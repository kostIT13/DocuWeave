from typing import TypedDict, List, Dict, Any, Optional
from datetime import datetime


class AgentState(TypedDict):
    input: str
    project_id: str
    user_id: str
    project_settings: Dict[str, Any]
    
    messages: List[Dict[str, str]]
    chat_session_id: Optional[str]
    
    context: List[Dict[str, Any]]
    documents: List[Dict[str, Any]]
    
    tools_called: List[str]
    tool_results: List[Dict[str, Any]]
    available_tools: List[str]
    
    response: Optional[str]
    intermediate_responses: List[str]
    
    metadata: Dict[str, Any]
    started_at: datetime
    updated_at: datetime
    
    error: Optional[str]
    should_continue: bool
    max_steps: int
    current_step: int
    
    needs_rag: bool
    needs_tool: bool
    is_final: bool


def create_initial_state(
    input_text: str,
    project_id: str,
    user_id: str,
    project_settings: Dict[str, Any],
    chat_session_id: Optional[str] = None,
    initial_messages: Optional[List[Dict[str, str]]] = None
) -> AgentState:
    now = datetime.utcnow()
    
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
    state["updated_at"] = datetime.utcnow()
    state["current_step"] += 1
    
    if state["current_step"] >= state["max_steps"]:
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
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if metadata:
        message["metadata"] = metadata
    
    state["messages"].append(message)
    return state


def add_tool_result_to_state(
    state: AgentState,
    tool_name: str,
    result: Any,
    success: bool = True
) -> AgentState:
    state["tools_called"].append(tool_name)
    state["tool_results"].append({
        "tool": tool_name,
        "result": result,
        "success": success,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return state