from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from src.api.chat.dependencies import ChatSessionServiceDependency, ChatDependency
from src.api.chat.schemas import (
    ChatSessionCreate, ChatSessionUpdate, ChatSessionResponse,
    MessageCreate, MessageResponse
)
from src.api.auth.dependencies import CurrentUserDependency
from src.api.project.dependencies import CurrentProjectDependency
from src.api.chat.dependencies import MessageServiceDependency


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
    message_service: MessageServiceDependency,
):
    msg = await message_service.add_message(
        session_id=chat.id,
        role=data.role,
        content=data.content,
        metadata={}
    )
    
    
    return MessageResponse.model_validate(msg)