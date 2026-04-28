from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any, List


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Название проекта")
    description: Optional[str] = Field(None, max_length=1000, description="Описание проекта")


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str
    description: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: Optional[datetime] = None


class ProjectSettings(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    llm_model: str = Field(default="qwen2.5:7b", description="Модель Ollama для генерации")
    embedding_model: str = Field(default="nomic-embed-text", description="Модель для эмбеддингов")
    chunk_size: int = Field(default=512, ge=100, le=4000, description="Размер чанка в токенах")
    chunk_overlap: int = Field(default=50, ge=0, le=500, description="Перекрытие чанков")
    temperature: float = Field(default=0.3, ge=0.0, le=1.0, description="Креативность LLM")
    system_prompt: Optional[str] = Field(default=None, description="Кастомный системный промпт")
    top_k: int = Field(default=4, ge=1, le=10, description="Количество источников для RAG")


class ProjectSettingsUpdate(BaseModel):
    llm_model: Optional[str] = None
    embedding_model: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    temperature: Optional[float] = None
    system_prompt: Optional[str] = None
    top_k: Optional[int] = None

    def merge_with_defaults(self) -> dict:
        defaults = ProjectSettings().model_dump()
        return {**defaults, **self.model_dump(exclude_unset=True)}


class SettingsHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: Optional[str] = None
    old_settings: Optional[Dict[str, Any]] = None
    new_settings: Dict[str, Any]
    changed_fields: Dict[str, Any]
    created_at: datetime


class HistoryPagination(BaseModel):
    items: List[SettingsHistoryResponse]
    total: int
    page: int
    page_size: int