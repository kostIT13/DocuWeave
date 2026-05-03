from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional, Any
from enum import Enum


class LLMRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


class LLMMessage(BaseModel):
    role: LLMRole
    content: str
    name: Optional[str] = None 


class LLMGenerateRequest(BaseModel):
    model: str = Field(..., description="Название модели, например 'llama3.2:3b'")
    messages: List[LLMMessage]
    temperature: float = Field(default=0.3, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, ge=1)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    stop_sequences: Optional[List[str]] = None
    stream: bool = Field(default=False)


class LLMGenerateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    content: str
    model: str
    finish_reason: Optional[str] = None
    usage: Optional[Dict[str, int]] = None  
    metadata: Optional[Dict[str, Any]] = None


class LLMEmbedRequest(BaseModel):
    model: str = Field(..., description="Модель эмбеддингов, например 'nomic-embed-text'")
    text: str = Field(..., min_length=1, max_length=8192)


class LLMEmbedResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    embedding: List[float]
    model: str
    dimension: int