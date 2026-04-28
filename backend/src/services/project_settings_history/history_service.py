from src.services.project_settings_history.repository import SQLAlchemySettingsHistoryRepository
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.models.project_settings_history import ProjectSettingsHistory
from typing import Optional, List, Tuple


class SettingsHistoryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = SQLAlchemySettingsHistoryRepository(db)


    async def get_history_by_id(self, history_id: str, project_id: str) -> Optional[ProjectSettingsHistory]:
        return await self.repository.get_by_id(history_id, project_id)
    

    async def get_history(
        self, project_id: str, limit: int = 20
    ) -> Tuple[List[ProjectSettingsHistory], int]:
        items = await self.repository.list_by_project(project_id, limit)
        total = await self.repository.count_by_project(project_id)
        return items, total
    

    async def record_change(
        self, user_id: str, project_id: str, 
        old_settings: dict, new_settings: dict, changed_fields: dict
    ) -> ProjectSettingsHistory:
        return await self.repository.create({
            "user_id": user_id,
            "project_id": project_id,
            "old_settings": old_settings,
            "new_settings": new_settings,
            "changed_fields": changed_fields
        })