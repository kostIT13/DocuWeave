from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from fastapi.responses import StreamingResponse
from typing import List, AsyncGenerator
import json
from src.api.chat.dependencies import ChatDependency, MessageServiceDependency
from src.api.chat.schemas import MessageCreate, MessageResponse
from src.api.project.dependencies import CurrentProjectDependency
from src.services.message.message_service import MessageService
from src.services.rag.rag_service import RAGService
from src.infrastructure.core.database import get_db
from src.infrastructure.models.project import Project
from src.infrastructure.models.message import MessageRole
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.api.chat.schemas import ChatHistoryResponse, ChatSessionCreate, ChatSessionListResponse, ChatSessionResponse, ChatSessionUpdate
from src.api.chat.dependencies import ChatSessionServiceDependency
from src.api.auth.dependencies import CurrentUserDependency


router = APIRouter(prefix="/chat-sessions", tags=["Chat Sessions"])


@router.post("", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    data: ChatSessionCreate,
    service: ChatSessionServiceDependency,
    current_project: CurrentProjectDependency,
    current_user: CurrentUserDependency
):
    return await service.create_session(
        project_id=current_project.id,
        user_id=current_user.id,
        title=data.title
    )

@router.get("", response_model=List[ChatSessionResponse])
async def list_sessions(
    service: ChatSessionServiceDependency,
    current_project: CurrentProjectDependency,
    current_user: CurrentUserDependency,
    limit: int = Query(20, ge=1, le=100),
):
    return await service.get_list_by_projects(
        project_id=current_project.id,
        user_id=current_user.id,
        limit=limit
    )


@router.get("/{chat_id}", response_model=ChatSessionResponse)
async def get_session(chat: ChatDependency):
    return chat


@router.patch("/{chat_id}", response_model=ChatSessionResponse)
async def update_session(
    chat: ChatDependency,
    data: ChatSessionUpdate,
    service: ChatSessionServiceDependency
):
    try:
        return await service.update_session(
            session_id=chat.id,
            project_id=chat.project_id,
            user_id=chat.user_id,
            data=data.model_dump(exclude_unset=True)
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    chat: ChatDependency,
    service: ChatSessionServiceDependency
):
    success = await service.delete_session(
        session_id=chat.id,
        project_id=chat.project_id,
        user_id=chat.user_id
    )
    if not success:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Сессия не найдена")


@router.get("/{chat_id}/messages", response_model=List[MessageResponse])
async def get_chat_history(
    message_service: MessageServiceDependency,
    chat: ChatDependency,
    limit: int = Query(50, ge=1, le=200)
):
    messages = await message_service.get_history_by_session(chat.id, limit)
    return [MessageResponse.model_validate(msg) for msg in messages]


@router.post("/{chat_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    chat: ChatDependency,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    message_service: MessageServiceDependency = None
):
    user_msg = await message_service.add_message(
        session_id=chat.id,
        role=data.role.value if hasattr(data.role, 'value') else data.role,
        content=data.content,
        metadata={}
    )
    
    proj_stmt = select(Project).where(Project.id == chat.project_id)
    project = (await db.execute(proj_stmt)).scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    settings = project.settings or {}
    
    history_msgs = await message_service.get_history_by_session(chat.id, limit=10)
    history = [
        {"role": msg.role.value if hasattr(msg.role, 'value') else msg.role, "content": msg.content}
        for msg in history_msgs
    ]
    
    rag = RAGService()
    
    context = await rag.retrieve(
        query=data.content,
        project_settings=settings,
        project_id=chat.project_id
    )
    
    answer = await rag.generate_response(
        query=data.content,
        context=context,
        history=history,
        project_settings=settings
    )
    
    sources = [
        c["metadata"].get("file_path") 
        for c in context 
        if c.get("metadata", {}).get("file_path")
    ]
    
    await message_service.add_message(
        session_id=chat.id,
        role=MessageRole.ASSISTANT.value,
        content=answer,
        metadata={
            "sources": sources,
            "context_count": len(context),
            "model_used": settings.get("llm_model", "qwen2.5:7b")
        }
    )

    return MessageResponse.model_validate(user_msg)


@router.get("/{chat_id}/messages/stream")
async def stream_message(
    chat: ChatDependency,
    query: str = Query(..., min_length=1, description="Текст вопроса"),
    db: AsyncSession = Depends(get_db),
    message_service: MessageServiceDependency = None
):
    await message_service.add_message(
        session_id=chat.id,
        role="user",
        content=query,
        metadata={}
    )
    
    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            proj_stmt = select(Project).where(Project.id == chat.project_id)
            project = (await db.execute(proj_stmt)).scalar_one_or_none()
            settings = project.settings if project else {}
            
            history_msgs = await message_service.get_history_by_session(chat.id, limit=10)
            history = [
                {"role": msg.role.value if hasattr(msg.role, 'value') else msg.role, "content": msg.content}
                for msg in history_msgs
            ]
            
            rag = RAGService()
            
            context = await rag.retrieve(query, settings, chat.project_id)
            
            sources_meta = [
                {"file": c["metadata"].get("file_path"), "chunk": c["metadata"].get("chunk_index")}
                for c in context
            ]
            yield f"data: {json.dumps({'type': 'sources', 'data': sources_meta})}\n\n"
            
            full_response = ""
            async for token in rag.generate_response_stream(query, context, history, settings):
                full_response += token
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
            
            await message_service.add_message(
                session_id=chat.id,
                role=MessageRole.ASSISTANT.value,
                content=full_response,
                metadata={
                    "sources": sources_meta,
                    "context_count": len(context),
                    "model_used": settings.get("llm_model", "qwen2.5:7b"),
                    "streamed": True
                }
            )
            
            yield f"data: {json.dumps({'type': 'done', 'message_id': 'saved'})}\n\n"
            
        except Exception as e:
            import logging
            logging.error(f"SSE error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'detail': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  
        }
    )