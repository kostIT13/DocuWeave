# src/services/agent/tools.py
from typing import Dict, Any, List, Optional
import logging
from langchain_core.tools import tool, ToolException

from src.services.rag import create_rag_orchestrator
from src.services.llm.llm_service import LLMService
from src.prompts.rag_prompts import rag_prompts

logger = logging.getLogger(__name__)


class AgentTools:
    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm_service = llm_service or LLMService()
        self.rag_orchestrator = create_rag_orchestrator()
    
    @tool("rag_search")
    def rag_search(
        self,
        query: str,
        project_id: str,
        project_settings: Dict[str, Any],
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """Search for relevant documents using RAG"""
        try:
            logger.info(f"Вызов инструмента rag_search для запроса: '{query}'")
            
            context = self.rag_orchestrator.retrieve(
                query=query,
                project_settings=project_settings,
                project_id=project_id
            )
            
            if len(context) > top_k:
                context = context[:top_k]
            
            logger.info(f"Найдено {len(context)} релевантных документов")
            return context
            
        except Exception as e:
            logger.error(f"Ошибка в инструменте rag_search: {e}", exc_info=True)
            raise ToolException(f"Ошибка поиска документов: {str(e)}")
    
    @tool("document_analysis")
    def document_analysis(
        self,
        document_content: str,
        analysis_type: str = "summary"
    ) -> Dict[str, Any]:
        """Analyze document content with specified analysis type"""
        try:
            logger.info(f"Вызов инструмента document_analysis, тип: {analysis_type}")
            
            prompt = ""
            if analysis_type == "summary":
                prompt = rag_prompts.get_summarization_prompt(document_content)
            elif analysis_type == "key_points":
                prompt = "Выдели ключевые точки из следующего текста:\n\n" + document_content
            elif analysis_type == "sentiment":
                prompt = "Проанализируй тональность следующего текста:\n\n" + document_content
            elif analysis_type == "structure":
                prompt = "Проанализируй структуру следующего документа:\n\n" + document_content
            else:
                prompt = f"Проанализируй документ ({analysis_type}):\n\n{document_content}"
            
            response = self.llm_service.generate(
                model="qwen2.5:7b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            
            return {
                "analysis_type": analysis_type,
                "content": document_content[:500] + "..." if len(document_content) > 500 else document_content,
                "result": response,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Ошибка в инструменте document_analysis: {e}", exc_info=True)
            raise ToolException(f"Ошибка анализа документа: {str(e)}")
    
    @tool("summarize")
    def summarize(
        self,
        text: str,
        max_length: int = 500
    ) -> str:
        """Summarize text to specified max length"""
        try:
            logger.info(f"Вызов инструмента summarize, длина текста: {len(text)}")
            
            prompt = rag_prompts.get_summarization_prompt(text)
            
            response = self.llm_service.generate(
                model="qwen2.5:7b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=max_length
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Ошибка в инструменте summarize: {e}", exc_info=True)
            raise ToolException(f"Ошибка суммаризации: {str(e)}")
    
    @tool("extract_entities")
    def extract_entities(
        self,
        text: str,
        entity_types: Optional[List[str]] = None
    ) -> Dict[str, List[str]]:
        """Extract named entities from text"""
        try:
            logger.info(f"Вызов инструмента extract_entities, типы: {entity_types}")
            
            if entity_types is None:
                entity_types = ["people", "organizations", "dates", "locations", "key_terms"]
            
            prompt = rag_prompts.get_extraction_prompt(text, entity_types)
            
            response = self.llm_service.generate(
                model="qwen2.5:7b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            
            result = {}
            lines = response.split('\n')
            current_category = None
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                if ':' in line:
                    category, entities = line.split(':', 1)
                    current_category = category.strip().lower()
                    entities_list = [e.strip() for e in entities.split(',') if e.strip()]
                    result[current_category] = entities_list
                elif current_category and line.startswith('-'):
                    entity = line[1:].strip()
                    if current_category not in result:
                        result[current_category] = []
                    result[current_category].append(entity)
            
            return result
            
        except Exception as e:
            logger.error(f"Ошибка в инструменте extract_entities: {e}", exc_info=True)
            raise ToolException(f"Ошибка извлечения сущностей: {str(e)}")
    
    @tool("answer_with_context")
    def answer_with_context(
        self,
        question: str,
        context: List[Dict[str, Any]]
    ) -> str:
        """Generate answer based on provided context"""
        try:
            logger.info(f"Вызов инструмента answer_with_context, вопрос: '{question}'")
            
            context_text = "\n\n".join([
                f"[Документ {i+1}]: {doc.get('content', '')}"
                for i, doc in enumerate(context)
            ])
            
            prompt = rag_prompts.get_qa_prompt(question, context_text)
            
            response = self.llm_service.generate(
                model="qwen2.5:7b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Ошибка в инструменте answer_with_context: {e}", exc_info=True)
            raise ToolException(f"Ошибка генерации ответа: {str(e)}")
    
    @tool("classify_query")
    def classify_query(
        self,
        query: str,
        categories: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Classify user query into predefined categories"""
        try:
            logger.info(f"Вызов инструмента classify_query: '{query}'")
            
            if categories is None:
                categories = [
                    "information_request",
                    "document_analysis", 
                    "summarization",
                    "entity_extraction",
                    "general_conversation",
                    "complex_analysis"
                ]
            
            prompt = rag_prompts.get_classification_prompt(query, categories)
            
            response = self.llm_service.generate(
                model="qwen2.5:7b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            
            confidence = 0.8 
            
            return {
                "query": query,
                "category": response.strip(),
                "confidence": confidence,
                "categories_considered": categories
            }
            
        except Exception as e:
            logger.error(f"Ошибка в инструменте classify_query: {e}", exc_info=True)
            raise ToolException(f"Ошибка классификации запроса: {str(e)}")
    
    def get_all_tools(self) -> List:
        """Return list of all available tools"""
        return [
            self.rag_search,
            self.document_analysis,
            self.summarize,
            self.extract_entities,
            self.answer_with_context,
            self.classify_query
        ]