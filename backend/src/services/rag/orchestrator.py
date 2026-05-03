from typing import List, Dict, Any, Optional, AsyncGenerator
import logging
from src.services.rag.indexer import RAGIndexer
from src.services.rag.retriever import RAGRetriever
from src.services.rag.generator import RAGGenerator
from src.services.rag.config import RAGConfig
import datetime

logger = logging.getLogger(__name__)


class RAGOrchestrator:
    def __init__(
        self,
        indexer: RAGIndexer,
        retriever: RAGRetriever,
        generator: RAGGenerator,
        config: Optional[RAGConfig] = None
    ):
        self.indexer = indexer
        self.retriever = retriever
        self.generator = generator
        self.config = config or RAGConfig()
    
    async def index_document(
        self,
        doc_id: str,
        file_path: str,
        mime_type: str,
        project_settings: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        logger.info(f"Оркестратор: начало индексации документа {doc_id}")
        return await self.indexer.index_document(
            doc_id=doc_id,
            file_path=file_path,
            mime_type=mime_type,
            project_settings=project_settings,
            user_id=user_id
        )
    
    async def retrieve(
        self,
        query: str,
        project_settings: Dict[str, Any],
        project_id: str
    ) -> List[Dict[str, Any]]:
        logger.info(f"Оркестратор: поиск документов для запроса: '{query[:50]}...'")
        return await self.retriever.retrieve(query, project_settings, project_id)
    
    async def generate_response(
        self,
        query: str,
        context: List[Dict[str, Any]],
        history: List[Dict[str, str]],
        project_settings: Dict[str, Any]
    ) -> str:
        logger.info(f"Оркестратор: генерация ответа для запроса: '{query[:50]}...'")
        return await self.generator.generate_response(
            query=query,
            context=context,
            history=history,
            project_settings=project_settings
        )
    
    async def generate_response_stream(
        self,
        query: str,
        context: List[Dict[str, Any]],
        history: List[Dict[str, str]],
        project_settings: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        logger.info(f"Оркестратор: потоковая генерация ответа для запроса: '{query[:50]}...'")
        async for chunk in self.generator.generate_response_stream(
            query=query,
            context=context,
            history=history,
            project_settings=project_settings
        ):
            yield chunk
    
    async def rag_pipeline(
        self,
        query: str,
        project_settings: Dict[str, Any],
        project_id: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        logger.info(f"Оркестратор: запуск полного RAG пайплайна для запроса: '{query[:50]}...'")
        
        context = await self.retriever.retrieve(query, project_settings, project_id)
        
        if not context:
            logger.warning(f"Оркестратор: не найдено релевантных документов для запроса: '{query}'")
            return {
                "success": False,
                "error": "Не найдено релевантных документов",
                "query": query,
                "context": [],
                "response": None
            }
        
        history = history or []
        response = await self.generator.generate_response(
            query=query,
            context=context,
            history=history,
            project_settings=project_settings
        )
        
        quality_metrics = await self.generator.evaluate_response_quality(
            query=query,
            response=response,
            context=context
        )
        
        return {
            "success": True,
            "query": query,
            "context_count": len(context),
            "context": context,
            "response": response,
            "quality_metrics": quality_metrics
        }
    
    async def rag_pipeline_stream(
        self,
        query: str,
        project_settings: Dict[str, Any],
        project_id: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        logger.info(f"Оркестратор: запуск потокового RAG пайплайна для запроса: '{query[:50]}...'")
        
        context = await self.retriever.retrieve(query, project_settings, project_id)
        
        yield {
            "stage": "retrieval",
            "context_count": len(context),
            "context": context
        }
        
        if not context:
            logger.warning(f"Оркестратор: не найдено релевантных документов")
            yield {
                "stage": "error",
                "error": "Не найдено релевантных документов"
            }
            return
        
        history = history or []
        response_parts = []
        
        async for chunk in self.generator.generate_response_stream(
            query=query,
            context=context,
            history=history,
            project_settings=project_settings
        ):
            response_parts.append(chunk)
            yield {
                "stage": "generation",
                "chunk": chunk,
                "response_so_far": "".join(response_parts)
            }
        
        full_response = "".join(response_parts)
        yield {
            "stage": "complete",
            "response": full_response,
            "context_count": len(context)
        }
    
    async def health_check(self) -> Dict[str, Any]:
        health_status = {
            "overall": "healthy",
            "components": {},
            "timestamp": None
        }
        
        try:
            health_status["components"]["indexer"] = {
                "status": "healthy",
                "message": "Indexer initialized"
            }
        except Exception as e:
            health_status["components"]["indexer"] = {
                "status": "unhealthy",
                "message": str(e)
            }
            health_status["overall"] = "degraded"
        
        try:
            health_status["components"]["retriever"] = {
                "status": "healthy",
                "message": "Retriever initialized"
            }
        except Exception as e:
            health_status["components"]["retriever"] = {
                "status": "unhealthy",
                "message": str(e)
            }
            health_status["overall"] = "degraded"
        
        try:
            health_status["components"]["generator"] = {
                "status": "healthy",
                "message": "Generator initialized"
            }
        except Exception as e:
            health_status["components"]["generator"] = {
                "status": "unhealthy",
                "message": str(e)
            }
            health_status["overall"] = "degraded"
        
        health_status["timestamp"] = datetime.datetime.utcnow().isoformat()
        
        return health_status