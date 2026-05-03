from typing import List, Dict, Any, Optional, AsyncGenerator
import logging
from src.services.llm.base import LLMProvider
from src.services.rag.config import RAGConfig
from src.prompts.rag_prompts import rag_prompts

logger = logging.getLogger(__name__)


class RAGGenerator:
    def __init__(
        self,
        llm_provider: LLMProvider,
        config: Optional[RAGConfig] = None
    ):
        self.llm_provider = llm_provider
        self.config = config or RAGConfig()
    
    async def generate_response(
        self,
        query: str,
        context: List[Dict[str, Any]],
        history: List[Dict[str, str]],
        project_settings: Dict[str, Any]
    ) -> str:
        try:
            system_prompt = self._prepare_system_prompt(context, project_settings)
            
            messages = self._prepare_messages(history, query, system_prompt)
            
            settings = self._prepare_generation_settings(project_settings)
            
            from src.services.llm.schemas import LLMGenerateRequest, LLMMessage, LLMRole
            
            llm_messages = []
            for msg in messages:
                llm_messages.append(LLMMessage(
                    role=LLMRole(msg["role"]),
                    content=msg["content"]
                ))
            
            request = LLMGenerateRequest(
                model=settings["llm_model"],
                messages=llm_messages,
                temperature=settings["temperature"],
                max_tokens=settings.get("max_tokens")
            )
            
            response = await self.llm_provider.generate(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Ошибка генерации ответа: {e}", exc_info=True)
            return "Извините, произошла ошибка при генерации ответа."
    
    async def generate_response_stream(
        self,
        query: str,
        context: List[Dict[str, Any]],
        history: List[Dict[str, str]],
        project_settings: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        try:
            system_prompt = self._prepare_system_prompt(context, project_settings)
            
            messages = self._prepare_messages(history, query, system_prompt)
            
            settings = self._prepare_generation_settings(project_settings)
            
            from src.services.llm.schemas import LLMGenerateRequest, LLMMessage, LLMRole
            
            llm_messages = []
            for msg in messages:
                llm_messages.append(LLMMessage(
                    role=LLMRole(msg["role"]),
                    content=msg["content"]
                ))
            
            request = LLMGenerateRequest(
                model=settings["llm_model"],
                messages=llm_messages,
                temperature=settings["temperature"],
                max_tokens=settings.get("max_tokens")
            )
            
            async for chunk in self.llm_provider.generate_stream(request):
                yield chunk
                
        except Exception as e:
            logger.error(f"Ошибка потоковой генерации ответа: {e}", exc_info=True)
            yield "Извините, произошла ошибка при генерации ответа."
    
    def _prepare_system_prompt(
        self,
        context: List[Dict[str, Any]],
        project_settings: Dict[str, Any]
    ) -> str:
        custom_prompt = project_settings.get("system_prompt")
        if custom_prompt:
            return custom_prompt
        
        context_text = "\n\n".join([
            f"[Документ {i+1}]: {doc['content']}"
            for i, doc in enumerate(context)
        ])
        
        return rag_prompts.get_document_analysis_prompt(context_text)
    
    def _prepare_messages(
        self,
        history: List[Dict[str, str]],
        query: str,
        system_prompt: str
    ) -> List[Dict[str, str]]:
        messages = []
        
        messages.append({"role": "system", "content": system_prompt})
        
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        messages.append({"role": "user", "content": query})
        
        return messages
    
    def _prepare_generation_settings(self, project_settings: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "llm_model": project_settings.get("llm_model", self.config.llm_model),
            "temperature": project_settings.get("temperature", self.config.temperature),
            "max_tokens": project_settings.get("max_tokens")
        }
    
    async def evaluate_response_quality(
        self,
        query: str,
        response: str,
        context: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        context_relevance = self._calculate_context_relevance(response, context)
        answer_length = len(response.split())
        
        return {
            "context_relevance": context_relevance,
            "answer_length": answer_length,
            "has_answer": answer_length > 0,
            "score": min(1.0, context_relevance * 0.7 + (min(answer_length, 100) / 100) * 0.3)
        }
    
    def _calculate_context_relevance(self, response: str, context: List[Dict[str, Any]]) -> float:
        if not context or not response:
            return 0.0
        
        context_keywords = set()
        for doc in context:
            words = doc["content"].lower().split()[:20]  
            context_keywords.update(words)
        
        response_words = set(response.lower().split())
        common_words = context_keywords.intersection(response_words)
        
        if not context_keywords:
            return 0.0
        
        return len(common_words) / len(context_keywords)