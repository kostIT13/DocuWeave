from src.services.message.repository import SQLAlchemyMessageRepository
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List 
from src.infrastructure.models.message import Message


class MessageService:
    def __init__(self, db: AsyncSession):
        self.db = db 
        self.repository = SQLAlchemyMessageRepository(db)


    async def get_message_by_id(self, message_id: str) -> Optional[Message]:
        return await self.repository.get_by_id(message_id)
    

    async def get_history_by_session(self, session_id: str, limit: int = 50) -> List[Message]:
        return await self.repository.get_by_session(session_id, limit)
    

    async def add_message(
        self, session_id: str, role: str, content: str, metadata: dict | None = None
    ) -> Message:
        return await self.repository.create({
            "session_id": session_id,
            "role": role,
            "content": content,
            "metadata_": metadata or {}
        })


    async def attach_rag_sources(self, message_id: str, sources: List[str]) -> bool:
        result = await self.repository.update_metadata(message_id, {"sources": sources})
        return result is not None