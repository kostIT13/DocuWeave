import httpx
import logging
import json
from typing import List, Dict, Any, Optional, AsyncGenerator
from src.services.llm.base import LLMProvider
from src.services.llm.schemas import (
    LLMGenerateRequest, LLMGenerateResponse,
    LLMEmbedRequest, LLMEmbedResponse, LLMRole
)
from src.infrastructure.core.config import settings


logger = logging.getLogger(__name__)


class UnifiedOllamaClient(LLMProvider):
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_HOST or "http://localhost:11434").rstrip("/")
        self._client: Optional[httpx.AsyncClient] = None
        logger.info(f"UnifiedOllamaClient инициализирован с базовым URL: {self.base_url}")

    async def __aenter__(self):
        self._client = httpx.AsyncClient(timeout=120.0)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            await self._client.aclose()

    def _get_client(self) -> httpx.AsyncClient:
        if not self._client:
            self._client = httpx.AsyncClient(timeout=120.0)
        return self._client

    async def generate(
        self, request: LLMGenerateRequest
    ) -> LLMGenerateResponse:
        client = self._get_client()
        
        ollama_messages = [
            {"role": msg.role.value, "content": msg.content}
            for msg in request.messages
        ]
        
        payload = {
            "model": request.model,
            "messages": ollama_messages,
            "stream": False,
            "options": {
                "temperature": request.temperature,
                "top_p": request.top_p,
            }
        }
        if request.max_tokens:
            payload["options"]["num_predict"] = request.max_tokens
        if request.stop_sequences:
            payload["options"]["stop"] = request.stop_sequences
        
        try:
            res = await client.post(f"{self.base_url}/api/chat", json=payload)
            res.raise_for_status()
            data = res.json()
            
            return LLMGenerateResponse(
                content=data["message"]["content"],
                model=request.model,
                finish_reason=data.get("done_reason"),
                usage={
                    "prompt_tokens": data.get("prompt_eval_count", 0),
                    "completion_tokens": data.get("eval_count", 0)
                } if data.get("done") else None
            )
        except httpx.HTTPError as e:
            logger.error(f"Ollama generate error: {e}", exc_info=True)
            raise

    async def generate_stream(
        self, request: LLMGenerateRequest
    ) -> AsyncGenerator[str, None]:
        client = self._get_client()
        
        ollama_messages = [
            {"role": msg.role.value, "content": msg.content}
            for msg in request.messages
        ]
        
        payload = {
            "model": request.model,
            "messages": ollama_messages,
            "stream": True,
            "options": {
                "temperature": request.temperature,
                "top_p": request.top_p,
            }
        }
        if request.max_tokens:
            payload["options"]["num_predict"] = request.max_tokens
        
        try:
            async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as res:
                res.raise_for_status()
                async for line in res.aiter_lines():
                    if line.strip() and line.startswith("{"):
                        try:
                            chunk = json.loads(line)
                            if "message" in chunk and "content" in chunk["message"]:
                                yield chunk["message"]["content"]
                        except json.JSONDecodeError:
                            logger.warning(f"Failed to parse JSON chunk: {line}")
        except httpx.HTTPError as e:
            logger.error(f"Ollama stream error: {e}", exc_info=True)
            raise

    async def embed(self, request: LLMEmbedRequest) -> LLMEmbedResponse:
        client = self._get_client()
        
        try:
            res = await client.post(f"{self.base_url}/api/embeddings", json={
                "model": request.model,
                "prompt": request.text
            })
            res.raise_for_status()
            data = res.json()
            
            return LLMEmbedResponse(
                embedding=data["embedding"],
                model=request.model
            )
        except httpx.HTTPError as e:
            logger.error(f"Ollama embed error: {e}", exc_info=True)
            raise
        except KeyError:
            logger.error(f"Invalid response from Ollama: {data}")
            raise

    async def list_models(self) -> List[str]:
        client = self._get_client()
        
        try:
            res = await client.get(f"{self.base_url}/api/tags")
            res.raise_for_status()
            data = res.json()
            
            return [model["name"] for model in data.get("models", [])]
        except httpx.HTTPError as e:
            logger.error(f"Ollama list_models error: {e}", exc_info=True)
            raise

    async def embed_text(self, text: str, model: str) -> List[float]:
        request = LLMEmbedRequest(text=text, model=model)
        response = await self.embed(request)
        return response.embedding

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.3,
        system_prompt: Optional[str] = None
    ) -> str:
        llm_messages = []
        if system_prompt:
            llm_messages.append({"role": "system", "content": system_prompt})
        
        for msg in messages:
            llm_messages.append({"role": msg["role"], "content": msg["content"]})
        
        request = LLMGenerateRequest(
            model=model,
            messages=[{"role": m["role"], "content": m["content"]} for m in llm_messages],
            temperature=temperature
        )
        
        response = await self.generate(request)
        return response.content

    async def chat_stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.3,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        llm_messages = []
        if system_prompt:
            llm_messages.append({"role": "system", "content": system_prompt})
        
        for msg in messages:
            llm_messages.append({"role": msg["role"], "content": msg["content"]})
        
        request = LLMGenerateRequest(
            model=model,
            messages=[{"role": m["role"], "content": m["content"]} for m in llm_messages],
            temperature=temperature
        )
        
        async for chunk in self.generate_stream(request):
            yield chunk