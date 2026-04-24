from abc import ABC, abstractmethod
from typing import Optional, List
from src.infrastructure.models.chat_session import ChatSession


class ChatSessionRepository(ABC):
    
    @abstractmethod
    async def get_by_id(self, session_id: str, project_id: str, user_id: str) -> Optional[ChatSession]:
        raise NotImplementedError
    

    @abstractmethod
    async def list_by_projects(self, project_id: str, user_id: str, limit: int = 20) -> List[ChatSession]:
        raise NotImplementedError
    

    @abstractmethod
    async def create(self, data: dict) -> ChatSession: 
        raise NotImplementedError


    @abstractmethod
    async def update(self, session_id: str, project_id: str, user_id: str, data: dict) -> Optional[ChatSession]:
        raise NotImplementedError


    @abstractmethod
    async def delete(self, session_id: str, project_id: str, user_id: str) -> bool:
        raise NotImplementedError   