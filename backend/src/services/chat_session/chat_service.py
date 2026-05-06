from src.services.chat_session.repository import SQLALchemyChatSessionsRepository
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from src.infrastructure.models.chat_session import ChatSession


class ChatSessionService:
    def __init__(self, db: AsyncSession):
        self.db = db 
        self.repository = SQLALchemyChatSessionsRepository(db)


    async def get_session_by_id(self, session_id: str, project_id: str, user_id: str) -> Optional[ChatSession]:
        return await self.repository.get_by_id(session_id, project_id, user_id)
    

    async def get_list_by_projects(self, project_id: str, user_id: str, limit: int = 20) -> List[ChatSession]:
        return await self.repository.list_by_projects(project_id, user_id, limit)
    

    async def create_session(self, project_id: str, user_id: str, title: str = 'Новый чат') -> ChatSession:
        chat_session = await self.repository.create({
            "project_id": project_id,
            "user_id": user_id, 
            "title": title
        })
        return chat_session
    

    async def update_session(self, session_id: str, project_id: str, user_id: str, data: dict) -> Optional[ChatSession]:
        return await self.repository.update(session_id, project_id, user_id, data)
    

    async def delete_session(self, session_id: str, project_id: str, user_id: str) -> bool:
        return await self.repository.delete(session_id, project_id, user_id)
    

