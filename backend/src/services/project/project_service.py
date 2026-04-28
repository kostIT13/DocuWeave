from src.services.project.repository import SQLAlchemyProjectRepository
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from src.infrastructure.models.project import Project
from src.services.project_settings_history.history_service import SettingsHistoryService


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db 
        self.repository = SQLAlchemyProjectRepository(db)
        self.history_service = SettingsHistoryService(db)

    
    async def get_project_by_id(self, project_id: str, user_id: str) -> Optional[Project]:
        return await self.repository.get_by_id(project_id, user_id)


    async def get_list_by_user(self, user_id: str, limit: int = 20) -> List[Project]:
        return await self.repository.list_by_user(user_id, limit)
    

    async def create_project(self, user_id: str, data: dict) -> Project:
        data["user_id"] = user_id 
        return await self.repository.create(data)
    

    async def update_project(self, user_id: str, project_id: str, data: dict) -> Optional[Project]:
        return await self.repository.update(project_id, user_id, data)
    

    async def delete_project(self, user_id: str, project_id: str) -> bool:
        return await self.repository.delete(project_id, user_id)
    
    async def update_settings(self, project_id: str, user_id: str, new_settings: dict) -> Project:
        project = await self.get_project_by_id(project_id, user_id)
        if not project:
            raise ValueError("Проект не найден")

        old_settings = project.settings or {}
        changed = {k: v for k, v in new_settings.items() if old_settings.get(k) != v}
        
        if not changed:
            return project 

        await self.history_service.record_change(
            user_id=user_id,
            project_id=project_id,
            old_settings=old_settings,
            new_settings=new_settings,
            changed_fields=changed
        )

        project.settings = new_settings
        
        await self.db.commit()
        await self.db.refresh(project)
        return project

