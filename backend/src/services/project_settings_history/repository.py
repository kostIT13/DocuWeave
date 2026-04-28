from src.services.project_settings_history.base import SettingsHistoryRepository
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from src.infrastructure.models.project_settings_history import ProjectSettingsHistory
from sqlalchemy import select, func


class SQLAlchemySettingsHistoryRepository(SettingsHistoryRepository):
    def __init__(self, session: AsyncSession):
        self.session = session 

    
    async def get_by_id(self, history_id: str, project_id: str) -> Optional[ProjectSettingsHistory]:
        query = select(ProjectSettingsHistory).where(ProjectSettingsHistory.id==history_id, ProjectSettingsHistory.project_id==project_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    

    async def list_by_project(self, project_id: str, limit: int = 20) -> List[ProjectSettingsHistory]:
        query = select(ProjectSettingsHistory).where(ProjectSettingsHistory.project_id==project_id).order_by(ProjectSettingsHistory.created_at.desc()).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
    

    async def create(self, data: dict) -> ProjectSettingsHistory:
        history = ProjectSettingsHistory(**data)
        self.session.add(history)
        await self.session.commit()
        await self.session.refresh(history)
        return history
 

    async def count_by_project(self, project_id: str) -> int:
        query = select(func.count()).where(ProjectSettingsHistory.project_id == project_id)
        result = await self.session.execute(query)
        return result.scalar_one()
    
    