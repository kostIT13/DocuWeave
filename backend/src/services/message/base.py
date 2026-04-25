from abc import ABC, abstractmethod
from typing import List, Optional
from src.infrastructure.models.message import Message


class MessageRepository(ABC):

    @abstractmethod
    async def get_by_id(self, message_id: str) -> Optional[Message]:
        raise NotImplementedError


    @abstractmethod
    async def get_by_session(self, session_id: str, limit: int = 50) -> List[Message]:
        raise NotImplementedError


    @abstractmethod
    async def create(self, data: dict) -> Message:
        raise NotImplementedError


    @abstractmethod
    async def update_metadata(self, message_id: str, metadata: dict) -> Optional[Message]:
        raise NotImplementedError