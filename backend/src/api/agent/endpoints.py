import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.core.database import get_db
from src.api.agent.schemas import (
    AgentQueryRequest,
    AgentResponse,
    AgentInfoResponse,
    DocumentAnalysisRequest,
    DocumentAnalysisResponse,
    BatchQueryRequest,
    BatchQueryResponse
)
from src.api.agent.dependencies import (
    get_agent_orchestrator,
    validate_agent_request,
    validate_document_analysis_request,
    validate_batch_request,
    AgentOrchestratorDependency,
    LLMServiceDependency
)
from src.api.auth.dependencies import get_current_user
from src.api.project.dependencies import get_current_project
from src.services.agent.orchestrator import AgentOrchestrator
from src.services.llm.llm_service import LLMService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/query", response_model=AgentResponse, status_code=status.HTTP_200_OK)
async def process_agent_query(
    request: AgentQueryRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    current_project = Depends(get_current_project),
    orchestrator: AgentOrchestrator = AgentOrchestratorDependency,
    db: AsyncSession = Depends(get_db)
) -> AgentResponse:
    logger.info(
        f"Обработка запроса агента от пользователя {current_user.id}, "
        f"проект: {current_project.id}, запрос: '{request.input_text[:50]}...'"
    )
    
    try:
        user_id, project_settings = await validate_agent_request(
            input_text=request.input_text,
            project_id=request.project_id,
            current_user=current_user,
            current_project=current_project
        )
        
        result = await orchestrator.process_query(
            input_text=request.input_text,
            project_id=request.project_id,
            user_id=user_id,
            project_settings=project_settings,
            conversation_history=request.conversation_history,
            use_rag=request.use_rag,
            use_tools=request.use_tools
        )
        
        logger.info(
            f"Агент обработал запрос: успех={result['success']}, "
            f"шагов={result.get('steps', 0)}, время={result.get('processing_time', 0):.2f}с"
        )
        
        return AgentResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка обработки запроса агента: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )


@router.post("/query/rag-fallback", response_model=AgentResponse, status_code=status.HTTP_200_OK)
async def process_agent_query_with_rag_fallback(
    request: AgentQueryRequest,
    current_user = Depends(get_current_user),
    current_project = Depends(get_current_project),
    orchestrator: AgentOrchestrator = AgentOrchestratorDependency,
    db: AsyncSession = Depends(get_db)
) -> AgentResponse:
    logger.info(
        f"Обработка запроса с RAG fallback от пользователя {current_user.id}, "
        f"проект: {current_project.id}"
    )
    
    try:
        user_id, project_settings = await validate_agent_request(
            input_text=request.input_text,
            project_id=request.project_id,
            current_user=current_user,
            current_project=current_project
        )
        
        result = await orchestrator.process_query_with_rag_fallback(
            input_text=request.input_text,
            project_id=request.project_id,
            user_id=user_id,
            project_settings=project_settings,
            conversation_history=request.conversation_history
        )
        
        logger.info(
            f"Запрос обработан с источником: {result.get('source', 'unknown')}, "
            f"успех={result.get('success', False)}"
        )
        
        return AgentResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка обработки запроса с RAG fallback: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )


@router.post("/analyze-document", response_model=DocumentAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_document(
    request: DocumentAnalysisRequest,
    orchestrator: AgentOrchestrator = AgentOrchestratorDependency
) -> DocumentAnalysisResponse:
    logger.info(f"Анализ документа, тип: {request.analysis_type}")
    
    try:
        await validate_document_analysis_request(
            document_content=request.document_content,
            analysis_type=request.analysis_type
        )
        
        result = await orchestrator.analyze_document(
            document_content=request.document_content,
            analysis_type=request.analysis_type,
            project_settings=request.project_settings
        )
        
        logger.info(
            f"Документ проанализирован: успех={result['success']}, "
            f"время={result.get('processing_time', 0):.2f}с"
        )
        
        return DocumentAnalysisResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка анализа документа: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )


@router.post("/batch-process", response_model=BatchQueryResponse, status_code=status.HTTP_200_OK)
async def batch_process_queries(
    request: BatchQueryRequest,
    orchestrator: AgentOrchestrator = AgentOrchestratorDependency
) -> BatchQueryResponse:
    logger.info(f"Пакетная обработка {len(request.queries)} запросов")
    
    try:
        await validate_batch_request(
            queries=request.queries,
            max_concurrent=request.max_concurrent
        )
        
        results = await orchestrator.batch_process_queries(
            queries=request.queries,
            max_concurrent=request.max_concurrent
        )
        
        successful = sum(1 for r in results if r.get("success", False))
        failed = len(results) - successful
        
        total_processing_time = sum(r.get("processing_time", 0) for r in results)
        
        logger.info(
            f"Пакетная обработка завершена: успешно={successful}, "
            f"с ошибками={failed}, общее время={total_processing_time:.2f}с"
        )
        
        return BatchQueryResponse(
            results=results,
            total_queries=len(request.queries),
            successful=successful,
            failed=failed,
            total_processing_time=total_processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка пакетной обработки: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )


@router.get("/info", response_model=AgentInfoResponse, status_code=status.HTTP_200_OK)
async def get_agent_info(
    orchestrator: AgentOrchestrator = AgentOrchestratorDependency
) -> AgentInfoResponse:
    logger.info("Запрос информации об агенте")
    
    try:
        info = orchestrator.get_agent_info()
        return AgentInfoResponse(**info)
        
    except Exception as e:
        logger.error(f"Ошибка получения информации об агенте: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )


@router.get("/health", status_code=status.HTTP_200_OK)
async def agent_health_check(
    orchestrator: AgentOrchestrator = AgentOrchestratorDependency,
    llm_service: LLMService = LLMServiceDependency
) -> Dict[str, Any]:
    logger.info("Проверка здоровья агента")
    
    try:
        llm_health = await llm_service.generate(
            model="qwen2.5:7b",
            messages=[{"role": "user", "content": "test"}],
            max_tokens=1
        )
        llm_available = bool(llm_health)
        
        agent_info = orchestrator.get_agent_info()
        
        return {
            "status": "healthy",
            "llm_available": llm_available,
            "agent_version": agent_info["agent_version"],
            "tools_count": len(agent_info["tools_available"]),
            "timestamp": "2026-05-03T15:48:00Z" 
        }
        
    except Exception as e:
        logger.error(f"Ошибка проверки здоровья агента: {e}", exc_info=True)
        return {
            "status": "unhealthy",
            "error": str(e),
            "llm_available": False,
            "timestamp": "2026-05-03T15:48:00Z"
        }