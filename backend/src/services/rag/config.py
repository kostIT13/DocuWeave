from pydantic import BaseModel, Field
from typing import Optional


class RAGConfig(BaseModel):
    chunk_size: int = Field(default=512, description="Размер чанка в токенах")
    chunk_overlap: int = Field(default=50, description="Перекрытие между чанками")
    
    embedding_model: str = Field(default="nomic-embed-text", description="Модель для эмбеддингов")
    
    llm_model: str = Field(default="qwen2.5:7b", description="Модель для генерации")
    temperature: float = Field(default=0.3, ge=0.0, le=2.0, description="Температура генерации")
    
    top_k: int = Field(default=4, description="Количество возвращаемых релевантных чанков")
    
    default_collection_name: str = Field(default="default", description="Имя коллекции по умолчанию")
    
    system_prompt: Optional[str] = Field(
        default=None,
        description="Системный промпт для LLM. Если None, используется стандартный"
    )
    
    embedding_timeout: float = Field(default=60.0, description="Таймаут для эмбеддингов в секундах")
    generation_timeout: float = Field(default=120.0, description="Таймаут для генерации в секундах")


rag_config = RAGConfig()