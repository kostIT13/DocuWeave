# src/services/agent/orchestrator.py
from typing import Dict, Any, Optional, List
import logging
import asyncio
from datetime import datetime, timezone

from src.services.agent.state import (
    AgentState, 
    create_initial_state,
    update_state_timestamp
)
from src.services.agent.graph import AgentGraph
from src.services.llm.llm_service import LLMService
from src.services.rag import create_rag_orchestrator

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm_service = llm_service or LLMService()
        self.agent_graph = AgentGraph(llm_service)
        self.rag_orchestrator = create_rag_orchestrator()
        
        logger.info("Инициализирован AgentOrchestrator")
    
    async def process_query(
        self,
        input_text: str,
        project_id: str,
        user_id: str,
        project_settings: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, str]]] = None,
        use_rag: bool = True,
        use_tools: bool = True
    ) -> Dict[str, Any]:
        logger.info(
            f"Обработка запроса через агента: '{input_text[:50]}...', "
            f"проект: {project_id}, пользователь: {user_id}"
        )
        
        start_time = datetime.now(timezone.utc)
        
        try:
            initial_state = create_initial_state(
                input_text=input_text,
                project_id=project_id,
                user_id=user_id,
                project_settings=project_settings,
                conversation_history=conversation_history or [],
                use_rag=use_rag,
                use_tools=use_tools
            )
            
            result = self.agent_graph.run(initial_state)
            
            processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()
            result["processing_time"] = processing_time
            result["agent_version"] = "1.0.0"
            
            logger.info(
                f"Агент завершил обработку запроса за {processing_time:.2f} секунд, "
                f"успех: {result.get('success', False)}, шагов: {result.get('steps', 0)}"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Ошибка обработки запроса через агента: {e}", exc_info=True)
            
            return {
                "success": False,
                "response": "Извините, произошла ошибка при обработке запроса.",
                "error": str(e),
                "tools_used": [],
                "steps": 0,
                "context": [],
                "processing_time": (datetime.now(timezone.utc) - start_time).total_seconds(),
                "agent_version": "1.0.0"
            }
    
    async def process_query_with_rag_fallback(
        self,
        input_text: str,
        project_id: str,
        user_id: str,
        project_settings: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        logger.info(f"Обработка запроса с RAG fallback: '{input_text[:50]}...'")
        
        try:
            agent_result = await self.process_query(
                input_text=input_text,
                project_id=project_id,
                user_id=user_id,
                project_settings=project_settings,
                conversation_history=conversation_history,
                use_rag=True,
                use_tools=True
            )
            
            if agent_result.get("success", False) and agent_result.get("response"):
                agent_result["source"] = "agent"
                return agent_result
            
            logger.info("Агент не смог обработать запрос, используем стандартный RAG")
            
            rag_result = await self.rag_orchestrator.rag_pipeline(
                query=input_text,
                project_settings=project_settings,
                project_id=project_id,
                history=conversation_history
            )
            
            formatted_result = {
                "success": rag_result.get("success", False),
                "response": rag_result.get("response", ""),
                "context": rag_result.get("context", []),
                "tools_used": ["rag_pipeline"],
                "steps": 1,
                "error": rag_result.get("error"),
                "source": "rag_fallback",
                "processing_time": rag_result.get("processing_time", 0),
                "agent_version": "1.0.0"
            }
            
            return formatted_result
            
        except Exception as e:
            logger.error(f"Ошибка обработки запроса с RAG fallback: {e}", exc_info=True)
            
            return {
                "success": False,
                "response": "Извините, не удалось обработать ваш запрос. Пожалуйста, попробуйте снова.",
                "error": str(e),
                "tools_used": [],
                "steps": 0,
                "context": [],
                "source": "error_fallback",
                "agent_version": "1.0.0"
            }
    
    async def analyze_document(
        self,
        document_content: str,
        analysis_type: str = "summary",
        project_settings: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        logger.info(f"Анализ документа, тип: {analysis_type}, длина: {len(document_content)}")
        
        try:
            initial_state = create_initial_state(
                input_text=f"Проанализируй документ: {analysis_type}",
                project_id="document_analysis",
                user_id="system",
                project_settings=project_settings or {},
                conversation_history=[],
                use_rag=False,
                use_tools=True
            )
            
            initial_state["context"] = [{
                "content": document_content,
                "metadata": {"analysis_type": analysis_type},
                "score": 1.0,
                "rank": 1
            }]
            
            initial_state["needs_tool"] = True
            initial_state["needs_rag"] = False
            
            result = self.agent_graph.run(initial_state)
            
            analysis_result = {
                "analysis_type": analysis_type,
                "content_preview": document_content[:500] + "..." if len(document_content) > 500 else document_content,
                "analysis": result.get("response", ""),
                "tools_used": result.get("tools_used", []),
                "success": result.get("success", False),
                "processing_time": result.get("processing_time", 0)
            }
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Ошибка анализа документа: {e}", exc_info=True)
            
            return {
                "analysis_type": analysis_type,
                "content_preview": document_content[:500] + "..." if len(document_content) > 500 else document_content,
                "analysis": f"Ошибка анализа: {str(e)}",
                "tools_used": [],
                "success": False,
                "error": str(e)
            }
    
    async def batch_process_queries(
        self,
        queries: List[Dict[str, Any]],
        max_concurrent: int = 3
    ) -> List[Dict[str, Any]]:
        logger.info(f"Пакетная обработка {len(queries)} запросов, max_concurrent: {max_concurrent}")
        
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def process_with_semaphore(query_data: Dict[str, Any]) -> Dict[str, Any]:
            async with semaphore:
                return await self.process_query(
                    input_text=query_data["input_text"],
                    project_id=query_data["project_id"],
                    user_id=query_data["user_id"],
                    project_settings=query_data["project_settings"],
                    conversation_history=query_data.get("conversation_history")
                )
        
        tasks = [
            process_with_semaphore(query_data)
            for query_data in queries
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        formatted_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Ошибка обработки запроса {i}: {result}")
                formatted_results.append({
                    "success": False,
                    "response": "Ошибка обработки запроса",
                    "error": str(result),
                    "query_index": i
                })
            else:
                result["query_index"] = i
                formatted_results.append(result)
        
        return formatted_results
    
    def get_agent_info(self) -> Dict[str, Any]:
        return {
            "agent_version": "1.0.0",
            "llm_service": self.llm_service.__class__.__name__,
            "tools_available": [
                "rag_search",
                "document_analysis", 
                "summarize",
                "extract_entities",
                "answer_with_context",
                "classify_query"
            ],
            "graph_structure": {
                "nodes": [
                    "classify_query",
                    "rag_search", 
                    "call_tools",
                    "generate_response",
                    "finalize"
                ],
                "edges": [
                    "classify_query → conditional routing",
                    "rag_search → call_tools",
                    "call_tools → generate_response",
                    "generate_response → finalize"
                ]
            },
            "capabilities": [
                "RAG поиск документов",
                "Анализ документов",
                "Суммаризация текста",
                "Извлечение сущностей",
                "Классификация запросов",
                "Генерация ответов на основе контекста"
            ]
        }


def create_agent_orchestrator(llm_service: Optional[LLMService] = None) -> AgentOrchestrator:
    return AgentOrchestrator(llm_service)