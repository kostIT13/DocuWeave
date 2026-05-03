from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.core.database import get_db
from src.services.agent.orchestrator import create_agent_orchestrator
from src.services.agent.graph import AgentGraph
from src.services.llm.llm_service import LLMService
from src.api.auth.dependencies import get_current_user
from src.api.project.dependencies import get_current_project
from src.services.agent.orchestrator import AgentOrchestrator


async def get_agent_orchestrator() -> "AgentOrchestrator":
    from src.services.agent.orchestrator import AgentOrchestrator
    
    return create_agent_orchestrator()


async def get_agent_graph() -> AgentGraph:
    llm_service = LLMService()
    return AgentGraph(llm_service)


async def get_llm_service() -> LLMService:
    return LLMService()


async def validate_agent_request(
    input_text: str,
    project_id: str,
    current_user = Depends(get_current_user),
    current_project = Depends(get_current_project)
) -> tuple:
    if not input_text or len(input_text.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Текст запроса не может быть пустым"
        )
    
    if len(input_text) > 5000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Текст запроса слишком длинный (максимум 5000 символов)"
        )
    
    if current_project.id != project_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У вас нет доступа к указанному проекту"
        )
    
    user_id = str(current_user.id)
    project_settings = current_project.settings or {}
    
    return user_id, project_settings


async def validate_document_analysis_request(
    document_content: str,
    analysis_type: str
) -> None:
    if not document_content or len(document_content.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Содержимое документа не может быть пустым"
        )
    
    if len(document_content) > 100000: 
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Содержимое документа слишком большое (максимум 100000 символов)"
        )
    
    valid_analysis_types = ["summary", "key_points", "sentiment", "structure"]
    if analysis_type not in valid_analysis_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимый тип анализа. Допустимые значения: {', '.join(valid_analysis_types)}"
        )


async def validate_batch_request(
    queries: list,
    max_concurrent: int
) -> None:
    if not queries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список запросов не может быть пустым"
        )
    
    if len(queries) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Слишком много запросов (максимум 100)"
        )
    
    if max_concurrent < 1 or max_concurrent > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="max_concurrent должен быть в диапазоне от 1 до 10"
        )
    
    for i, query in enumerate(queries):
        if not isinstance(query, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Запрос {i} должен быть словарем"
            )
        
        required_fields = ["input_text", "project_id", "user_id", "project_settings"]
        for field in required_fields:
            if field not in query:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Запрос {i} не содержит обязательное поле '{field}'"
                )


AgentOrchestratorDependency = Depends(get_agent_orchestrator)
AgentGraphDependency = Depends(get_agent_graph)
LLMServiceDependency = Depends(get_llm_service)