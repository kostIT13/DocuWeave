import httpx
import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
from src.infrastructure.core.config import settings

logger = logging.getLogger(__name__)


class OllamaClient:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_HOST).rstrip("/")
        if not self.base_url:
            self.base_url = "http://localhost:11434"
        logger.info(f"OllamaClient инициализирован с базовым URL: {self.base_url}")

    async def embed(self, text: str, model: str) -> List[float]:
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                res = await client.post(f"{self.base_url}/api/embeddings", json={
                    "model": model,
                    "prompt": text
                })
                res.raise_for_status()
                data = res.json()
                return data["embedding"]
            except httpx.RequestError as e:
                logger.error(f"Сетевая ошибка при получении эмбеддинга: {e}")
                raise
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP ошибка {e.response.status_code} при получении эмбеддинга: {e.response.text}")
                raise
            except KeyError:
                logger.error(f"Некорректный ответ от Ollama: {data}")
                raise

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.3,
        system_prompt: Optional[str] = None
    ) -> str:
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature}
        }
        if system_prompt:
            payload["messages"].insert(0, {"role": "system", "content": system_prompt})

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                res = await client.post(f"{self.base_url}/api/chat", json=payload)
                res.raise_for_status()
                data = res.json()
                return data["message"]["content"]
            except httpx.RequestError as e:
                logger.error(f"Сетевая ошибка при чате с Ollama: {e}")
                raise
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP ошибка {e.response.status_code} при чате с Ollama: {e.response.text}")
                raise
            except KeyError:
                logger.error(f"Некорректный ответ от Ollama: {data}")
                raise


    async def chat_stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.3,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {"temperature": temperature}
        }
        if system_prompt:
            payload["messages"].insert(0, {"role": "system", "content": system_prompt})

        async with httpx.AsyncClient(timeout=180.0) as client:
            try:
                async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        line = line.strip()
                        if not line:
                            continue
                        if line.startswith("data: "):
                            json_str = line[6:]
                            if json_str == "[DONE]":
                                break
                            try:
                                import json
                                data = json.loads(json_str)
                                token = data.get("message", {}).get("content", "")
                                if token:
                                    yield token
                            except json.JSONDecodeError:
                                logger.warning(f"Не удалось декодировать JSON: {json_str}")
            except Exception as e:
                logger.error(f"Ошибка в стриминговом чате Ollama: {e}")
                raise