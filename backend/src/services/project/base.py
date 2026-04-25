from abc import ABC, abstractmethod
from typing import Optional, List
from src.infrastructure.models.project import Project


class ProjectRepository(ABC):

    @abstractmethod
    async def get_by_id(self, project_id: str, user_id: str) -> Optional[Project]:
        raise NotImplementedError


    @abstractmethod 
    async def list_by_user(self, user_id: str, limit: int = 20) -> List[Project]:
        raise NotImplementedError


    @abstractmethod
    async def create(self, data: dict) -> Project:
        raise NotImplementedError
    

    @abstractmethod
    async def update(self, project_id: str, user_id: str, data: dict) -> Optional[Project]:
        raise NotImplementedError
    

    @abstractmethod
    async def delete(self, project_id: str, user_id: str) -> bool:
        raise NotImplementedError
    



    