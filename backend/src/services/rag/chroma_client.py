import chromadb
from chromadb.config import Settings
from src.infrastructure.core.config import settings
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


def _create_chroma_client():
    is_production = settings.ENVIRONMENT == "production"
    
    if is_production:
        logger.info("ChromaDB: используя локальное хранилище (production)")
        return chromadb.PersistentClient(
            path="/app/chroma_data",
            settings=Settings(anonymized_telemetry=False)
        )
    else:
        logger.info(f"ChromaDB: подключение к {settings.CHROMA_HOST}:{settings.CHROMA_PORT}")
        return chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            settings=Settings(anonymized_telemetry=False)
        )


class ChromaClient:
    def __init__(self, client=None):
        self.client = client or _create_chroma_client()
    
    def get_or_create_collection(self, name: str, **kwargs):
        return self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"}
        )
    
    async def add_documents(
        self, 
        collection_name: str, 
        ids: List[str], 
        embeddings: List[List[float]], 
        metadatas: List[Dict],
        documents: Optional[List[str]] = None
    ):
        try:
            collection = self.get_or_create_collection(collection_name)
            if documents is None:
                documents = [""] * len(ids)
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            logger.info(f"Добавлено {len(ids)} документов в коллекцию '{collection_name}'")
        except Exception as e:
            logger.error(f"Ошибка добавления документов в коллекцию '{collection_name}': {e}")
            raise
    

    async def query(
        self, 
        collection_name: str, 
        query_embedding: List[float], 
        top_k: int = 5,
        where_filter: Optional[Dict] = None
    ) -> Dict[str, Any]:
        try:
            collection = self.get_or_create_collection(collection_name)
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_filter
            )
            flattened = {}
            for key in ['documents', 'metadatas', 'distances', 'ids']:
                if key in results and results[key]:
                    flattened[key] = results[key][0] 
                else:
                    flattened[key] = []
            return flattened
        except Exception as e:
            logger.error(f"Ошибка поиска в коллекции '{collection_name}': {e}")
            raise
    

    async def delete_documents(self, collection_name: str, ids: List[str]):
        try:
            collection = self.get_or_create_collection(collection_name)
            collection.delete(ids=ids)
            logger.info(f"Удалено {len(ids)} документов из коллекции '{collection_name}'")
        except Exception as e:
            logger.error(f"Ошибка удаления документов из коллекции '{collection_name}': {e}")
            raise


_chroma_client_instance = None


def _get_chroma_client_instance():
    global _chroma_client_instance
    if _chroma_client_instance is None:
        _chroma_client_instance = ChromaClient()
    return _chroma_client_instance


class _LazyChromaClient:
    def __getattr__(self, name):
        instance = _get_chroma_client_instance()
        return getattr(instance, name)


chroma_client = _LazyChromaClient()