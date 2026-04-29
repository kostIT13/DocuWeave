from src.services.document.repository import SQLAlchemyDocumentRepository
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from src.infrastructure.models.document import Document
from pathlib import Path
import logging
from datetime import datetime, timezone
import os 
from src.infrastructure.models.document import DocumentStatus
import hashlib
import uuid
from src.services.rag.rag_service import RAGService
from fastapi import BackgroundTasks
from src.infrastructure.core.database import engine as async_engine
from sqlalchemy import select 
from src.infrastructure.models.project import Project
import asyncio

logger = logging.getLogger(__name__)


class DocumentService:
    def __init__(self, db: AsyncSession, upload_dir: str = "uploads"):
        self.db = db 
        self.repository = SQLAlchemyDocumentRepository(db)
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"DocumentService инициализирован (upload_dir={self.upload_dir})")

    async def get_document_by_id(self, document_id: str, project_id: str) -> Optional[Document]:
        document = await self.repository.get_by_id(document_id)
        if not document or document.project_id != project_id or document.is_deleted:
            return None
        return document
    
    async def get_list_documents(self, project_id: str, limit: int = 20) -> List[Document]:
        limit = max(1, min(limit, 100))
        return await self.repository.get_project_documents(project_id)

    async def upload_document(
        self,
        project_id: str,
        filename: str,
        file_content: bytes,
        file_type: str,
        background_tasks: BackgroundTasks
    ) -> Document:
        allowed_types = [
            "application/pdf",
            "text/plain",
            "text/markdown",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]
        if file_type not in allowed_types:
            raise ValueError(f"Неподдерживаемый тип файла: {file_type}")
        
        if not file_content:
            raise ValueError("Пустой файл не может быть загружен")

        content_hash = hashlib.sha256(file_content).hexdigest()
        
        existing = await self.repository.get_by_content_hash(project_id, content_hash)
        if existing and not existing.is_deleted:
            logger.info(f"Найден дубликат документа: {existing.filename} (id={existing.id})")
            return existing

        file_id = str(uuid.uuid4())
        ext = Path(filename).suffix or ".bin"
        file_path = self.upload_dir / f"{file_id}{ext}"
        

        def _write_file(path: Path, content: bytes):
            with open(path, "wb") as f:
                f.write(content)
        await asyncio.to_thread(_write_file, file_path, file_content)
        logger.info(f"Файл сохранён: {file_path} ({len(file_content)} байт)")

        now = datetime.now(timezone.utc)
        

        doc = await self.repository.create({
            "id": file_id,
            "project_id": project_id,
            "filename": filename,         
            "file_path": str(file_path),
            "file_size": len(file_content),
            "file_type": file_type,         
            "mime_type": file_type,         
            "content_hash": content_hash,
            "status": DocumentStatus.PENDING,
            "chunk_count": 0,
            "collection_name": "lua_docs", 
            "metadata_": {"original_filename": filename},
            "created_at": now,
            "updated_at": now
        })
        
        logger.info(f"Документ создан в БД: {doc.id} ({doc.filename})")
        
        background_tasks.add_task(self._index_document_safe, doc.id)
        
        return doc


    async def delete_document(self, document_id: str, project_id: str, hard: bool = False) -> bool:
        doc = await self.get_document_by_id(document_id, project_id)
        if not doc:
            logger.warning(f"Документ {document_id} не найден или доступ запрещён")
            return False
        
        if os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
                logger.info(f"Файл удалён с диска: {doc.file_path}")
            except OSError as e:
                logger.error(f"Ошибка удаления файла {doc.file_path}: {e}")
        
        try:
            rag = RAGService()
            collection = f"proj_{project_id}"
            logger.info(f"[RAG] Удаление из индекса: {collection}, doc_id={doc.id} (заглушка)")
        except Exception as e:
            logger.error(f"Ошибка удаления из индекса: {e}")
        
        if hard:
            result = await self.repository.hard_delete(document_id)
        else:
            result = await self.repository.delete(document_id)
        
        if result:
            logger.info(f"Документ {document_id} удалён из БД ({'hard' if hard else 'soft'})")
        
        return result


    async def retry_indexing(self, document_id: str, project_id: str) -> bool:
        doc = await self.get_document_by_id(document_id, project_id)
        if not doc:
            return False
        
        if doc.status == DocumentStatus.COMPLETED:
            logger.warning(f"Документ {document_id} уже проиндексирован")
            return True
        
        doc.status = DocumentStatus.PENDING
        doc.error_message = None
        await self.db.commit()
        
        asyncio.create_task(self._index_document_safe(document_id))
        return True


    async def _index_document_safe(self, document_id: str):
        rag = RAGService()
        
        async with AsyncSession(async_engine) as bg_session:
            bg_repo = SQLAlchemyDocumentRepository(bg_session)
            
            try:
                logger.info(f"[INDEX] Начинаю индексацию (id={document_id})")
                
                doc = await bg_repo.get_by_id(document_id)
                if not doc:
                    logger.error(f"Документ {document_id} не найден в БД")
                    return
                
                doc.status = DocumentStatus.PROCESSING
                doc.updated_at = datetime.now(timezone.utc)
                await bg_session.commit()
        
                proj_stmt = select(Project).where(Project.id == doc.project_id)
                proj_res = await bg_session.execute(proj_stmt)
                project = proj_res.scalar_one_or_none()
                settings = project.settings if project else {}
                
                result = await rag.index_document(
                    doc_id=doc.id,
                    file_path=doc.file_path,
                    mime_type=doc.mime_type,
                    project_settings=settings,      
                    user_id=doc.project_id          
                )
                
                if result.get("success"):
                    doc.status = DocumentStatus.COMPLETED
                    doc.chunk_count = result.get("chunk_count", 0)
                    doc.processed_at = datetime.now(timezone.utc)
                    doc.error_message = None
                    logger.info(f"[INDEX] Документ {doc.id} проиндексирован ({result.get('chunk_count')} чанков)")
                else:
                    doc.status = DocumentStatus.FAILED
                    doc.error_message = result.get("error", "Unknown error")
                    logger.error(f"[INDEX] Индексация {doc.id} не удалась: {doc.error_message}")
                
                await bg_session.commit()
                    
            except ImportError as e:
                logger.warning(f"[INDEX] RAG-сервис недоступен: {e}")
            except Exception as e:
                logger.error(f"[INDEX] Критическая ошибка индексации {document_id}: {type(e).__name__}: {e}", exc_info=True)
                try:
                    await bg_session.rollback()
                    doc = await bg_repo.get_by_id(document_id)
                    if doc:
                        doc.status = DocumentStatus.FAILED
                        doc.error_message = f"{type(e).__name__}: {str(e)}"
                        await bg_session.commit()
                except Exception as rollback_error:
                    logger.error(f"[INDEX] Не удалось обновить статус после ошибки: {rollback_error}")


    async def _get_file_content(self, file_path: str) -> bytes:
        def _read_file(path: str) -> bytes:
            with open(path, "rb") as f:
                return f.read()
        return await asyncio.to_thread(_read_file, file_path)