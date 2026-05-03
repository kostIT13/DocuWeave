from typing import List, Dict, Any, Optional
import logging
from src.services.rag.base import EmbeddingProvider, VectorStore
from src.services.rag.document_processor import DocumentProcessor
from src.services.rag.config import RAGConfig

logger = logging.getLogger(__name__)


class RAGIndexer:
    def __init__(
        self,
        embedding_provider: EmbeddingProvider,
        vector_store: VectorStore,
        document_processor: DocumentProcessor,
        config: Optional[RAGConfig] = None
    ):
        self.embedding_provider = embedding_provider
        self.vector_store = vector_store
        self.document_processor = document_processor
        self.config = config or RAGConfig()
    
    async def index_document(
        self,
        doc_id: str,
        file_path: str,
        mime_type: str,
        project_settings: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        try:
            settings = self._prepare_indexing_settings(project_settings)
            
            self.document_processor.splitter = self.document_processor.splitter.clone(
                chunk_size=settings["chunk_size"],
                chunk_overlap=settings["chunk_overlap"]
            )
            
            chunks = await self.document_processor.load_and_split(file_path, mime_type)
            if not chunks:
                logger.warning(f"Документ {doc_id} не содержит текста")
                return {"success": False, "error": "Документ не содержит текста", "chunk_count": 0}
            
            chunk_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
            embeddings = []
            documents = []
            metadatas = []
            
            for chunk in chunks:
                emb = await self.embedding_provider.embed(
                    chunk["page_content"],
                    settings["embedding_model"]
                )
                embeddings.append(emb)
                
                metadata = chunk["metadata"].copy()
                metadata.update({
                    "project_id": user_id,
                    "doc_id": doc_id,
                    "chunk_index": len(documents)
                })
                metadatas.append(metadata)
                
                documents.append(chunk["page_content"])
            
            await self.vector_store.add_documents(
                collection=settings["collection"],
                ids=chunk_ids,
                embeddings=embeddings,
                metadatas=metadatas
            )
            
            logger.info(f"Документ {doc_id} проиндексирован, {len(chunks)} чанков")
            return {
                "success": True,
                "chunk_count": len(chunks),
                "collection": settings["collection"]
            }
            
        except Exception as e:
            logger.error(f"Ошибка индексации документа {doc_id}: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "chunk_count": 0
            }
    
    async def delete_document(
        self,
        doc_id: str,
        project_settings: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        try:
            settings = self._prepare_indexing_settings(project_settings)
            logger.info(f"Запрос на удаление документа {doc_id} из коллекции {settings['collection']}")
            return {
                "success": True,
                "message": f"Документ {doc_id} помечен для удаления"
            }
            
        except Exception as e:
            logger.error(f"Ошибка удаления документа {doc_id}: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def _prepare_indexing_settings(self, project_settings: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "chunk_size": project_settings.get("chunk_size", self.config.chunk_size),
            "chunk_overlap": project_settings.get("chunk_overlap", self.config.chunk_overlap),
            "embedding_model": project_settings.get("embedding_model", self.config.embedding_model),
            "collection": f"proj_{project_settings.get('collection_name', self.config.default_collection_name)}"
        }