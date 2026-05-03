from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class AgentQueryRequest(BaseModel):
    
    input_text: str = Field(..., description="Текст запроса пользователя")
    project_id: str = Field(..., description="Идентификатор проекта")
    use_rag: bool = Field(default=True, description="Использовать ли RAG поиск")
    use_tools: bool = Field(default=True, description="Использовать ли инструменты агента")
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        default=None, 
        description="История диалога в формате [{'role': 'user|assistant', 'content': '...'}]"
    )


class AgentToolResult(BaseModel):
    
    tool_name: str = Field(..., description="Название инструмента")
    result: Dict[str, Any] = Field(..., description="Результат выполнения инструмента")
    timestamp: datetime = Field(default_factory=datetime.now, description="Время выполнения")


class AgentResponse(BaseModel):
    
    success: bool = Field(..., description="Успешность обработки запроса")
    response: str = Field(..., description="Текст ответа агента")
    context: List[Dict[str, Any]] = Field(default=[], description="Релевантные документы")
    tools_used: List[str] = Field(default=[], description="Использованные инструменты")
    steps: int = Field(default=0, description="Количество шагов обработки")
    error: Optional[str] = Field(default=None, description="Ошибка, если есть")
    processing_time: float = Field(..., description="Время обработки в секундах")
    agent_version: str = Field(..., description="Версия агента")
    metadata: Dict[str, Any] = Field(default={}, description="Дополнительные метаданные")


class AgentInfoResponse(BaseModel):
    
    agent_version: str = Field(..., description="Версия агента")
    llm_service: str = Field(..., description="Используемый сервис LLM")
    tools_available: List[str] = Field(..., description="Доступные инструменты")
    graph_structure: Dict[str, Any] = Field(..., description="Структура графа агента")
    capabilities: List[str] = Field(..., description="Возможности агента")


class DocumentAnalysisRequest(BaseModel):
    
    document_content: str = Field(..., description="Содержимое документа для анализа")
    analysis_type: str = Field(
        default="summary", 
        description="Тип анализа (summary, key_points, sentiment, structure)"
    )
    project_settings: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="Настройки проекта (опционально)"
    )


class DocumentAnalysisResponse(BaseModel):
    
    analysis_type: str = Field(..., description="Тип анализа")
    content_preview: str = Field(..., description="Превью содержимого документа")
    analysis: str = Field(..., description="Результат анализа")
    tools_used: List[str] = Field(default=[], description="Использованные инструменты")
    success: bool = Field(..., description="Успешность анализа")
    processing_time: float = Field(..., description="Время обработки в секундах")
    error: Optional[str] = Field(default=None, description="Ошибка, если есть")


class BatchQueryRequest(BaseModel):
    
    queries: List[Dict[str, Any]] = Field(
        ...,
        description="Список запросов в формате: "
        "[{'input_text': '...', 'project_id': '...', 'user_id': '...', 'project_settings': {...}}]"
    )
    max_concurrent: int = Field(
        default=3, 
        ge=1, 
        le=10, 
        description="Максимальное количество одновременных запросов (1-10)"
    )


class BatchQueryResponse(BaseModel):
    
    results: List[Dict[str, Any]] = Field(..., description="Результаты обработки запросов")
    total_queries: int = Field(..., description="Общее количество запросов")
    successful: int = Field(..., description="Количество успешно обработанных запросов")
    failed: int = Field(..., description="Количество запросов с ошибками")
    total_processing_time: float = Field(..., description="Общее время обработки в секундах")