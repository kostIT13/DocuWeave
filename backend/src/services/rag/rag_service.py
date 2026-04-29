import uuid
import hashlib
from typing import List, Dict, Any, Optional, AsyncGenerator
import logging
from src.services.rag.ollama_client import OllamaClient
from src.services.rag.chroma_client import ChromaClient
from src.services.rag.document_processor import DocumentProcessor

logger = logging.getLogger(__name__)


class RAGService:
    def __init__(self):
        self.ollama = OllamaClient()
        self.chroma = ChromaClient()
        self.processor = DocumentProcessor()

    async def index_document(
        self, doc_id: str, file_path: str, mime_type: str, 
        project_settings: Dict[str, Any], user_id: str
    ) -> Dict:
        """
        Индексирует документ: разбивает на чанки, создаёт эмбеддинги, сохраняет в ChromaDB.
        user_id здесь фактически является project_id (используется для фильтрации).
        """
        try:
            settings = {
                "chunk_size": project_settings.get("chunk_size", 512),
                "chunk_overlap": project_settings.get("chunk_overlap", 50),
                "embedding_model": project_settings.get("embedding_model", "nomic-embed-text"),
                "collection": f"proj_{project_settings.get('collection_name', 'default')}"
            }
            # Настраиваем сплиттер
            self.processor.splitter = self.processor.splitter.clone(
                chunk_size=settings["chunk_size"], 
                chunk_overlap=settings["chunk_overlap"]
            )

            chunks = await self.processor.load_and_split(file_path, mime_type)
            chunk_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
            
            embeddings = []
            documents = []
            metadatas = []
            for chunk in chunks:
                # Создаём эмбеддинг для каждого чанка
                emb = await self.ollama.embed(chunk["page_content"], settings["embedding_model"])
                embeddings.append(emb)
                # Подготавливаем метаданные
                metadata = chunk["metadata"].copy()
                metadata["project_id"] = user_id  # project_id, переданный как user_id
                metadata["doc_id"] = doc_id
                metadatas.append(metadata)
                documents.append(chunk["page_content"])

            # Сохраняем в ChromaDB
            await self.chroma.add_documents(
                collection_name=settings["collection"],
                ids=chunk_ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=documents
            )
            
            logger.info(f"Документ {doc_id} проиндексирован, {len(chunks)} чанков")
            return {"success": True, "chunk_count": len(chunks)}
        except Exception as e:
            logger.error(f"Ошибка индексации документа {doc_id}: {e}", exc_info=True)
            return {"success": False, "error": str(e), "chunk_count": 0}

    async def retrieve(
        self, query: str, project_settings: Dict[str, Any], project_id: str
    ) -> List[Dict[str, Any]]:
        """
        Извлекает релевантные чанки по запросу.
        """
        try:
            collection = f"proj_{project_settings.get('collection_name', 'default')}"
            embedding = await self.ollama.embed(query, project_settings.get("embedding_model", "nomic-embed-text"))
            
            res = await self.chroma.query(
                collection_name=collection,
                query_embedding=embedding,
                top_k=project_settings.get("top_k", 4),
                where_filter={"project_id": project_id}
            )
            
            # res["documents"] и res["metadatas"] уже плоские списки
            documents = res.get("documents", [])
            metadatas = res.get("metadatas", [])
            
            return [
                {"content": doc, "metadata": meta}
                for doc, meta in zip(documents, metadatas)
            ]
        except Exception as e:
            logger.error(f"Ошибка извлечения контекста для запроса '{query}': {e}", exc_info=True)
            return []

    async def generate_response(
        self, query: str, context: List[Dict], history: List[Dict], 
        project_settings: Dict[str, Any]
    ) -> str:
        """
        Генерирует ответ на основе контекста и истории.
        """
        try:
            context_text = "\n\n".join([c["content"] for c in context])
            system_prompt = project_settings.get("system_prompt") or (
                f"Ты ассистент по анализу документов. Отвечай только на основе контекста.\n"
                f"Контекст:\n{context_text}"
            )
            
            messages = history + [{"role": "user", "content": query}]
            return await self.ollama.chat(
                messages, 
                model=project_settings.get("llm_model", "qwen2.5:7b"),
                temperature=project_settings.get("temperature", 0.3),
                system_prompt=system_prompt
            )
        except Exception as e:
            logger.error(f"Ошибка генерации ответа: {e}", exc_info=True)
            return "Извините, произошла ошибка при генерации ответа."

    async def generate_response_stream(
        self, query: str, context: List[Dict], history: List[Dict], 
        project_settings: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """
        Стриминговая версия generate_response.
        Пока возвращает ответ по токенам (заглушка, можно интегрировать с Ollama streaming).
        """
        # Для простоты генерируем полный ответ и отдаём по словам
        full_response = await self.generate_response(query, context, history, project_settings)
        words = full_response.split()
        for word in words:
            yield word + " "
            import asyncio
            await asyncio.sleep(0.01)  # небольшая задержка для имитации стрима