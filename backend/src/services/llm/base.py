from abc import ABC, abstractmethod
from typing import List, AsyncGenerator
from src.services.llm.schemas import (
    LLMGenerateRequest, LLMGenerateResponse,
    LLMEmbedRequest, LLMEmbedResponse
)


class LLMProvider(ABC):
    
    @abstractmethod
    async def generate(self, request: LLMGenerateRequest) -> LLMGenerateResponse:
        raise NotImplementedError
    

    @abstractmethod
    async def generate_stream(self, request: LLMGenerateRequest) -> AsyncGenerator[str, None]:
        raise NotImplementedError
    

    @abstractmethod
    async def embed(self, request: LLMEmbedRequest) -> LLMEmbedResponse:
        raise NotImplementedError
    

    @abstractmethod
    async def list_models(self) -> List[str]:
        raise NotImplementedError