from typing import List, Dict, Any, Optional
import logging
from src.services.rag.base import EmbeddingProvider, VectorStore
from src.services.rag.config import RAGConfig

logger = logging.getLogger(__name__)


class RAGRetriever:
    def __init__(
        self,
        embedding_provider: EmbeddingProvider,
        vector_store: VectorStore,
        config: Optional[RAGConfig] = None
    ):
        self.embedding_provider = embedding_provider
        self.vector_store = vector_store
        self.config = config or RAGConfig()
    
    async def retrieve(
        self,
        query: str,
        project_settings: Dict[str, Any],
        project_id: str
    ) -> List[Dict[str, Any]]:
        try:
            settings = self._prepare_retrieval_settings(project_settings)
            collection = settings["collection"]
            
            embedding = await self.embedding_provider.embed(query, settings["embedding_model"])
            
            results = await self.vector_store.query(
                collection=collection,
                query_embedding=embedding,
                top_k=settings["top_k"],
                where_filter={"project_id": project_id}
            )
            
            documents = results.get("documents", [])
            metadatas = results.get("metadatas", [])
            distances = results.get("distances", [])
            
            formatted_results = []
            for i, (doc, meta, dist) in enumerate(zip(documents, metadatas, distances)):
                formatted_results.append({
                    "content": doc,
                    "metadata": meta,
                    "score": 1.0 - dist if dist is not None else None,
                    "rank": i + 1
                })
            
            logger.info(f"Найдено {len(formatted_results)} релевантных документов для запроса: '{query[:50]}...'")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Ошибка поиска документов для запроса '{query}': {e}", exc_info=True)
            return []
    
    async def retrieve_with_scores(
        self,
        query: str,
        project_settings: Dict[str, Any],
        project_id: str,
        score_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        results = await self.retrieve(query, project_settings, project_id)
        
        # Фильтрация по порогу
        filtered_results = [
            result for result in results
            if result["score"] is not None and result["score"] >= score_threshold
        ]
        
        if len(filtered_results) < len(results):
            logger.info(f"Отфильтровано {len(results) - len(filtered_results)} документов с score < {score_threshold}")
        
        return filtered_results
    
    async def retrieve_multiple_queries(
        self,
        queries: List[str],
        project_settings: Dict[str, Any],
        project_id: str
    ) -> Dict[str, List[Dict[str, Any]]]:
        from asyncio import gather
        
        tasks = [
            self.retrieve(query, project_settings, project_id)
            for query in queries
        ]
        
        results = await gather(*tasks, return_exceptions=True)
        
        formatted_results = {}
        for i, (query, result) in enumerate(zip(queries, results)):
            if isinstance(result, Exception):
                logger.error(f"Ошибка при поиске для запроса '{query}': {result}")
                formatted_results[query] = []
            else:
                formatted_results[query] = result
        
        return formatted_results
    
    def _prepare_retrieval_settings(self, project_settings: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "embedding_model": project_settings.get("embedding_model", self.config.embedding_model),
            "top_k": project_settings.get("top_k", self.config.top_k),
            "collection": f"proj_{project_settings.get('collection_name', self.config.default_collection_name)}"
        }