from abc import ABC, abstractmethod
from typing import Optional, List 
from src.infrastructure.models.project_settings_history import ProjectSettingsHistory


class SettingsHistoryRepository(ABC):

    @abstractmethod
    async def get_by_id(self, history_id: str, project_id: str) -> Optional[ProjectSettingsHistory]:
        raise NotImplementedError
    

    @abstractmethod
    async def list_by_project(self, project_id: str, limit: int = 20) -> List[ProjectSettingsHistory]:
        raise NotImplementedError
    

    @abstractmethod
    async def create(self, data: dict) -> ProjectSettingsHistory:
        raise NotImplementedError
    

    @abstractmethod 
    async def count_by_project(self, project_id: str) -> int:
        raise NotImplementedError
    