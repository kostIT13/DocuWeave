from pydantic import BaseModel, Field, ConfigDict, computed_field
from datetime import datetime
from typing import Optional, List, Dict, Any
from src.infrastructure.models.message import MessageRole


class ChatSessionCreate(BaseModel):
    title: str = Field(
        default="Новый чат", 
        min_length=1, 
        max_length=255,
        description="Название сессии"
    )


class ChatSessionUpdate(BaseModel):
    title: str = Field(
        min_length=1, 
        max_length=255,
        description="Новое название сессии"
    )


class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    title: str
    project_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class ChatSessionListResponse(BaseModel):
    items: List[ChatSessionResponse]
    total: int
    limit: int = 20


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000, description="Текст сообщения")
    role: MessageRole = Field(default=MessageRole.USER, description="Роль отправителя")


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: str
    session_id: str
    role: MessageRole
    content: str
    metadata: Optional[Dict[str, Any]] = Field(default=None, alias="metadata_")
    created_at: datetime

    @computed_field
    def sources(self) -> List[str]:
        if self.metadata and isinstance(self.metadata.get("sources"), list):
            return self.metadata["sources"]
        return []


class ChatHistoryResponse(BaseModel):
    items: List[MessageResponse]
    total: int
    limit: int = 50