from fastapi import Depends, HTTPException, status, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.infrastructure.models.user import User
from src.infrastructure.models.project import Project
from src.infrastructure.core.database import get_db
from src.api.auth.dependencies import CurrentUserDependency
from typing import Annotated
from src.services.project.project_service import ProjectService
from src.services.project_settings_history.history_service import SettingsHistoryService


async def get_project_service(db: AsyncSession = Depends(get_db)):
    return ProjectService(db)


ProjectServiceDependency = Annotated[ProjectService, Depends(get_project_service)]


async def get_current_project(
    current_user: CurrentUserDependency,
    project_id: str = Path(..., description="ID проекта"),
    db: AsyncSession = Depends(get_db)
) -> Project:
    stmt = select(Project).where(
        Project.id == project_id,
        Project.user_id == current_user.id  
    )
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        stmt_exists = select(Project.id).where(Project.id == project_id)
        exists = (await db.execute(stmt_exists)).scalar_one_or_none()
        
        if not exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Проект не найден"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ к проекту запрещён"
            )
    
    return project


CurrentProjectDependency = Annotated[Project, Depends(get_current_project)]


async def get_settings_history_service(db: AsyncSession = Depends(get_db)):
    return SettingsHistoryService(db)


SettingsHistoryServiceDependency = Annotated[SettingsHistoryService, Depends(get_settings_history_service)]
    