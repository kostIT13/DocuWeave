from abc import ABC, abstractmethod
from typing import Optional, List
from src.infrastructure.models.project import Project


class ProjectRepository(ABC):

    @abstractmethod
    async def get_by_id(self, project_id: str) -> Optional[Project]:
        NotImplementedError

    @abstractmethod 
    async def get_all(self, **filters) -> List[Project]:
        NotImplementedError