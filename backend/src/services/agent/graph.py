# src/services/agent/agent_graph.py
from typing import Dict, Any, Optional, Literal
import logging
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

from src.services.agent.state import AgentState, update_state_timestamp, add_message_to_state, add_tool_result_to_state
from src.services.agent.tools import AgentTools
from src.services.llm.llm_service import LLMService
from src.services.rag import create_rag_orchestrator

logger = logging.getLogger(__name__)


class AgentGraph:
    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm_service = llm_service or LLMService()
        self.tools = AgentTools(llm_service)
        self.rag_orchestrator = create_rag_orchestrator()
        
        self.graph = self._create_graph()
    
    def _create_graph(self) -> StateGraph:
        workflow = StateGraph(AgentState)
        
        workflow.add_node("classify_query", self._classify_query_node)
        workflow.add_node("rag_search", self._rag_search_node)
        workflow.add_node("call_tools", self._call_tools_node)
        workflow.add_node("generate_response", self._generate_response_node)
        workflow.add_node("finalize", self._finalize_node)
        
        workflow.set_entry_point("classify_query")
        
        workflow.add_conditional_edges(
            "classify_query",
            self._route_after_classification,
            {
                "needs_rag": "rag_search",
                "needs_tool": "call_tools",
                "direct_response": "generate_response"
            }
        )
        
        workflow.add_edge("rag_search", "call_tools")
        workflow.add_edge("call_tools", "generate_response")
        workflow.add_edge("generate_response", "finalize")
        workflow.add_edge("finalize", END)
        
        return workflow.compile()
    
    def _classify_query_node(self, state: AgentState) -> AgentState:
        logger.info(f"Узел classify_query: {state['input'][:50]}...")
        
        state = update_state_timestamp(state)
        
        try:
            classification = self.tools.classify_query(
                state["input"],
                ["information_request", "document_analysis", "summarization", "general_conversation"]
            )
            
            category = classification.get("category", "information_request")
            
            if category in ["information_request", "document_analysis"]:
                state["needs_rag"] = True
                state["needs_tool"] = True
            elif category == "summarization":
                state["needs_tool"] = True
                state["needs_rag"] = False
            else:
                state["needs_rag"] = False
                state["needs_tool"] = False
            
            state.setdefault("metadata", {})["query_classification"] = classification
            
            logger.info(f"Запрос классифицирован как: {category}, needs_rag: {state['needs_rag']}, needs_tool: {state['needs_tool']}")
            
        except Exception as e:
            logger.error(f"Ошибка классификации запроса: {e}", exc_info=True)
            state["error"] = f"Ошибка классификации: {str(e)}"
            state["needs_rag"] = True 
        
        return state
    
    def _rag_search_node(self, state: AgentState) -> AgentState:
        logger.info(f"Узел rag_search для проекта: {state['project_id']}")
        
        state = update_state_timestamp(state)
        
        try:
            context = self.tools.rag_search(
                state["input"],
                state["project_id"],
                state["project_settings"],
                top_k=state["project_settings"].get("top_k", 4)
            )
            
            state["context"] = context
            state["documents"] = context
            
            logger.info(f"Найдено {len(context)} релевантных документов")
            
            state = add_tool_result_to_state(
                state,
                "rag_search",
                {"document_count": len(context), "query": state["input"]}
            )
            
        except Exception as e:
            logger.error(f"Ошибка поиска в RAG: {e}", exc_info=True)
            state["error"] = f"Ошибка поиска документов: {str(e)}"
            state["context"] = []
        
        return state
    
    def _call_tools_node(self, state: AgentState) -> AgentState:
        logger.info(f"Узел call_tools, доступно инструментов: {len(self.tools.get_all_tools())}")
        
        state = update_state_timestamp(state)
        
        try:
            messages = []

            system_message = "Ты - интеллектуальный ассистент по анализу документов. У тебя есть доступ к инструментам для поиска и анализа документов."
            messages.append({"role": "system", "content": system_message})
            
            messages.extend(state.get("messages", [])[-5:]) 
            
            messages.append({"role": "user", "content": state["input"]})
            
            if state.get("context"):
                context_text = "\n\n".join([
                    f"[Документ {i+1}]: {doc.get('content', '')[:200]}..."
                    for i, doc in enumerate(state["context"][:3])
                ])
                messages.append({"role": "system", "content": f"Контекст:\n{context_text}"})
            
            if state.get("context"):
                response = self.tools.answer_with_context(
                    state["input"],
                    state["context"]
                )
                
                state.setdefault("intermediate_responses", []).append(response)
                state = add_tool_result_to_state(
                    state,
                    "answer_with_context",
                    {"response_preview": response[:100] + "..." if len(response) > 100 else response}
                )
            
            if "анализ" in state["input"].lower() or "analyze" in state["input"].lower():
                for doc in state.get("context", [])[:2]: 
                    analysis = self.tools.document_analysis(
                        doc.get("content", "")[:1000],
                        "key_points"
                    )
                    
                    state.setdefault("intermediate_responses", []).append(f"Анализ документа: {analysis.get('result', '')[:200]}...")
                    state = add_tool_result_to_state(
                        state,
                        "document_analysis",
                        {"analysis_preview": analysis.get('result', '')[:100] + "..."}
                    )
            
            logger.info(f"Вызвано инструментов: {len(state.get('tools_called', []))}")
            
        except Exception as e:
            logger.error(f"Ошибка вызова инструментов: {e}", exc_info=True)
            state["error"] = f"Ошибка вызова инструментов: {str(e)}"
        
        return state
    
    def _generate_response_node(self, state: AgentState) -> AgentState:
        logger.info("Узел generate_response")
        
        state = update_state_timestamp(state)
        
        try:
            prompt_parts = []
            
            prompt_parts.append(f"Запрос пользователя: {state['input']}")
            
            if state.get("context"):
                prompt_parts.append("\nРелевантные документы:")
                for i, doc in enumerate(state["context"][:3]):
                    content_preview = doc.get("content", "")[:300]
                    prompt_parts.append(f"[Документ {i+1}]: {content_preview}...")
            
            if state.get("tool_results"):
                prompt_parts.append("\nРезультаты анализа:")
                for i, result in enumerate(state["tool_results"][-3:]):
                    tool_name = result.get("tool", f"Инструмент {i+1}")
                    preview = str(result.get("result", ""))[:150]
                    prompt_parts.append(f"{tool_name}: {preview}...")
            
            prompt_parts.append("\nСгенерируй полный, информативный ответ на основе вышеуказанной информации.")
            
            prompt = "\n".join(prompt_parts)
            
            response = self.llm_service.generate(
                model=state["project_settings"].get("llm_model", "qwen2.5:7b"),
                messages=[{"role": "user", "content": prompt}],
                temperature=state["project_settings"].get("temperature", 0.3),
                system_prompt="Ты - полезный ассистент по анализу документов. Отвечай подробно и информативно."
            )
            
            state["response"] = response
            state["is_final"] = True
            
            logger.info(f"Сгенерирован ответ длиной {len(response)} символов")
            
        except Exception as e:
            logger.error(f"Ошибка генерации ответа: {e}", exc_info=True)
            state["error"] = f"Ошибка генерации ответа: {str(e)}"
            state["response"] = "Извините, произошла ошибка при генерации ответа."
        
        return state
    
    def _finalize_node(self, state: AgentState) -> AgentState:
        logger.info("Узел finalize")
        
        state = update_state_timestamp(state)
        state["should_continue"] = False
        
        if state.get("response"):
            state = add_message_to_state(
                state,
                "assistant",
                state["response"],
                {
                    "tools_used": state.get("tools_called", []),
                    "documents_used": len(state.get("context", [])),
                    "processing_time": (state["updated_at"] - state["started_at"]).total_seconds()
                }
            )
        
        result = {
            "response": state.get("response"),
            "context": state.get("context", []),
            "tools_used": state.get("tools_called", []),
            "processing_steps": state.get("current_step", 0),
            "error": state.get("error"),
            "metadata": state.get("metadata", {})
        }
        
        state.setdefault("metadata", {})["final_result"] = result
        
        logger.info(f"Агент завершил работу за {state.get('current_step', 0)} шагов")
        
        return state
    
    def _route_after_classification(self, state: AgentState) -> Literal["needs_rag", "needs_tool", "direct_response"]:
        """Route after query classification"""
        if state.get("error"):
            return "direct_response"
        
        if state.get("needs_rag"):
            return "needs_rag"
        elif state.get("needs_tool"):
            return "needs_tool"
        else:
            return "direct_response"
    
    def run(self, initial_state: AgentState) -> Dict[str, Any]:
        logger.info(f"Запуск агента для запроса: '{initial_state['input'][:50]}...'")
        
        try:
            final_state = self.graph.invoke(initial_state)
            
            result = {
                "success": final_state.get("error") is None,
                "response": final_state.get("response"),
                "context": final_state.get("context", []),
                "tools_used": final_state.get("tools_called", []),
                "steps": final_state.get("current_step", 0),
                "error": final_state.get("error"),
                "metadata": final_state.get("metadata", {}),
                "processing_time": (final_state.get("updated_at") - final_state.get("started_at")).total_seconds() if final_state.get("updated_at") and final_state.get("started_at") else 0
            }
            
            logger.info(f"Агент завершил выполнение: успех={result['success']}, шагов={result['steps']}")
            
            return result
            
        except Exception as e:
            logger.error(f"Ошибка выполнения графа агента: {e}", exc_info=True)
            return {
                "success": False,
                "response": "Извините, произошла ошибка при обработке запроса.",
                "error": str(e),
                "tools_used": [],
                "steps": 0,
                "context": []
            }


def create_agent_graph(llm_service: Optional[LLMService] = None) -> AgentGraph:
    return AgentGraph(llm_service)