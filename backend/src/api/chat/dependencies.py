from src.services.chat_session.chat_service import ChatSessionService
from fastapi import Depends, Path, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.core.database import get_db
from typing import Annotated
from src.api.auth.dependencies import CurrentUserDependency
from src.infrastructure.models.chat_session import ChatSession
from src.services.message.message_service import MessageService


async def get_session_service(db: AsyncSession = Depends(get_db)):
    return ChatSessionService(db)


ChatSessionServiceDependency = Annotated[ChatSessionService, Depends(get_session_service)]


async def get_chat_or_404(
    current_user: CurrentUserDependency,
    chat_service: ChatSessionServiceDependency,
    chat_id: str = Path(..., description="ID чата")
) -> ChatSession:
    chat = await chat_service.get_chat(chat_id, current_user.id)
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Чат не найден или доступ запрещён"
        )
    
    return chat


ChatDependency = Annotated[ChatSession, Depends(get_chat_or_404)]


async def get_message_service(db: AsyncSession = Depends(get_db)):
    return MessageService(db)


MessageServiceDependency = Annotated[MessageService, Depends(get_message_service)]

