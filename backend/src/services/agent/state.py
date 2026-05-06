# src/services/agent/state.py
from typing import TypedDict, List, Dict, Any, Optional, NotRequired
from datetime import datetime, timezone


class AgentState(TypedDict, total=False):
    # Обязательные поля
    input: str
    project_id: str
    user_id: str
    project_settings: Dict[str, Any]
    
    # Опциональные поля
    messages: NotRequired[List[Dict[str, str]]]
    chat_session_id: NotRequired[Optional[str]]
    
    context: NotRequired[List[Dict[str, Any]]]
    documents: NotRequired[List[Dict[str, Any]]]
    
    tools_called: NotRequired[List[str]]
    tool_results: NotRequired[List[Dict[str, Any]]]
    available_tools: NotRequired[List[str]]
    
    response: NotRequired[Optional[str]]
    intermediate_responses: NotRequired[List[str]]
    
    metadata: NotRequired[Dict[str, Any]]
    started_at: NotRequired[datetime]
    updated_at: NotRequired[datetime]
    
    error: NotRequired[Optional[str]]
    should_continue: NotRequired[bool]
    max_steps: NotRequired[int]
    current_step: NotRequired[int]
    
    needs_rag: NotRequired[bool]
    needs_tool: NotRequired[bool]
    is_final: NotRequired[bool]


def create_initial_state(
    input_text: str,
    project_id: str,
    user_id: str,
    project_settings: Dict[str, Any],
    chat_session_id: Optional[str] = None,
    initial_messages: Optional[List[Dict[str, str]]] = None
) -> AgentState:
    now = datetime.now(timezone.utc)
    
    return {
        "input": input_text,
        "project_id": project_id,
        "user_id": user_id,
        "project_settings": project_settings,
        
        "messages": initial_messages or [],
        "chat_session_id": chat_session_id,
        
        "context": [],
        "documents": [],
        
        "tools_called": [],
        "tool_results": [],
        "available_tools": ["rag_search", "document_analysis", "summarize", "extract_entities"],
        
        "response": None,
        "intermediate_responses": [],
        
        "metadata": {
            "model": project_settings.get("llm_model", "qwen2.5:7b"),
            "temperature": project_settings.get("temperature", 0.3),
            "rag_enabled": True,
            "agent_version": "1.0.0"
        },
        "started_at": now,
        "updated_at": now,
        
        "error": None,
        "should_continue": True,
        "max_steps": 10,
        "current_step": 0,
        
        "needs_rag": True,
        "needs_tool": False,
        "is_final": False
    }


def update_state_timestamp(state: AgentState) -> AgentState:
    state["updated_at"] = datetime.now(timezone.utc)
    state["current_step"] = state.get("current_step", 0) + 1
    
    if state["current_step"] >= state.get("max_steps", 10):
        state["should_continue"] = False
        state["error"] = "Достигнуто максимальное количество шагов"
    
    return state


def add_message_to_state(
    state: AgentState,
    role: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None
) -> AgentState:
    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if metadata:
        message["metadata"] = metadata
    
    state.setdefault("messages", []).append(message)
    return state


def add_tool_result_to_state(
    state: AgentState,
    tool_name: str,
    result: Any,
    success: bool = True
) -> AgentState:
    state.setdefault("tools_called", []).append(tool_name)
    state.setdefault("tool_results", []).append({
        "tool": tool_name,
        "result": result,
        "success": success,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return state