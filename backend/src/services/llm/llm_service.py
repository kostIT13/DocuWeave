import logging
from typing import List, AsyncGenerator, Optional
from src.services.llm.base import LLMProvider
from src.services.llm.unified_ollama_client import UnifiedOllamaClient
from src.services.llm.schemas import (
    LLMGenerateRequest, LLMGenerateResponse,
    LLMEmbedRequest, LLMEmbedResponse, LLMMessage, LLMRole
)

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self, provider: Optional[LLMProvider] = None, base_url: Optional[str] = None):
        self.provider = provider or UnifiedOllamaClient(base_url=base_url)
        self.base_url = base_url

    async def generate(
        self,
        model: str,
        messages: List[dict],
        temperature: float = 0.3,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        llm_messages = []
        if system_prompt:
            llm_messages.append(LLMMessage(role=LLMRole.SYSTEM, content=system_prompt))
        
        for msg in messages:
            llm_messages.append(LLMMessage(
                role=LLMRole(msg["role"]),
                content=msg["content"],
                name=msg.get("name")
            ))
        
        request = LLMGenerateRequest(
            model=model,
            messages=llm_messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        response = await self.provider.generate(request)
        return response.content

    async def generate_stream(
        self,
        model: str,
        messages: List[dict],
        temperature: float = 0.3,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        llm_messages = []
        if system_prompt:
            llm_messages.append(LLMMessage(role=LLMRole.SYSTEM, content=system_prompt))
        
        for msg in messages:
            llm_messages.append(LLMMessage(
                role=LLMRole(msg["role"]),
                content=msg["content"]
            ))
        
        request = LLMGenerateRequest(
            model=model,
            messages=llm_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )
        
        async for token in self.provider.generate_stream(request):
            yield token

    async def embed(self, model: str, text: str) -> List[float]:
        request = LLMEmbedRequest(model=model, text=text)
        response = await self.provider.embed(request)
        return response.embedding

    async def list_available_models(self) -> List[str]:
        return await self.provider.list_models()