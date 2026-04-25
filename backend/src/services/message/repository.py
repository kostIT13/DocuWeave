from src.services.message.base import MessageRepository
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from src.infrastructure.models.message import Message 
from sqlalchemy import select


class SQLAlchemyMessageRepository(MessageRepository):
    def __init__(self, session: AsyncSession):
        self.session = session 


    async def get_by_id(self, message_id: str) -> Optional[Message]:
        query = select(Message).where(Message.id == message_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    

    async def get_by_session(self, session_id: str, limit: int = 50) -> List[Message]:
        query = (
            select(Message)
            .where(Message.session_id == session_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
    

    async def create(self, data: dict) -> Message:
        message = Message(**data)
        self.session.add(message)
        await self.session.commit()
        await self.session.refresh(message)
        return message 
    
    
    async def update_metadata(self, message_id: str, metadata: dict) -> Optional[Message]:
        message = await self.get_by_id(message_id)
        if not message:
            return None
        
        current = message.metadata_ or {}
        message.metadata_ = {**current, **metadata}
        
        await self.session.commit()
        await self.session.refresh(message)
        return message