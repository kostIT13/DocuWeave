from src.services.chat_session.base import ChatSessionRepository
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from src.infrastructure.models.chat_session import ChatSession
from sqlalchemy import select


class SQLALchemyChatSessionsRepository(ChatSessionRepository):
    def __init__(self, session: AsyncSession):
        self.session = session 


    async def get_by_id(self, session_id: str, project_id: str, user_id: str) -> Optional[ChatSession]:
        query = select(ChatSession).where(ChatSession.id==session_id, ChatSession.project_id==project_id, ChatSession.user_id==user_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    
    async def list_by_projects(self, project_id: str, user_id: str, limit: int = 20) -> List[ChatSession]:
        query = select(ChatSession).where(ChatSession.project_id==project_id, ChatSession.user_id==user_id).order_by(ChatSession.updated_at.desc()).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
    

    async def create(self, data: dict) -> ChatSession:
        chat_session = ChatSession(**data)
        self.session.add(chat_session)
        await self.session.commit()
        await self.session.refresh(chat_session)
        return chat_session 
    

    async def update(self, session_id: str, project_id: str, user_id: str, data: dict) -> Optional[ChatSession]:
        chat_session = await self.get_by_id(session_id=session_id, project_id=project_id, user_id=user_id)
        if not chat_session:
            return None 
        
        for field, value in data.items():
            if hasattr(chat_session, field):
                setattr(chat_session, field, value)

        await self.session.commit()
        await self.session.refresh(chat_session)
        return chat_session
    

    async def delete(self, session_id: str, project_id: str, user_id: str) -> bool:
        chat_session = await self.get_by_id(session_id=session_id, project_id=project_id, user_id=user_id)
        if not chat_session:
            return False 
        
        await self.session.delete(chat_session)
        await self.session.commit()
        return True
