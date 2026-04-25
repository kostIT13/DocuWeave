from src.services.project.base import ProjectRepository
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from src.infrastructure.models.project import Project
from sqlalchemy import select 


class SQLAlchemyProjectRepository(ProjectRepository):
    def __init__(self, session: AsyncSession):
        self.session = session 


    async def get_by_id(self, project_id: str, user_id: str) -> Optional[Project]:
        query = select(Project).where(Project.id==project_id, Project.user_id==user_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    

    async def list_by_user(self, user_id: str, limit: int = 20) -> List[Project]:
        query = select(Project).where(Project.user_id==user_id).order_by(Project.updated_at.desc()).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
    

    async def create(self, data: dict) -> Project:
        project = Project(**data)
        self.session.add(project)
        await self.session.commit()
        await self.session.refresh(project)
        return project 
    

    async def update(self, project_id: str, user_id: str, data: dict) -> Optional[Project]:
        project = await self.get_by_id(project_id=project_id, user_id=user_id)
        if not project:
            return None 
        
        for field, value in data.items():
            if hasattr(project, field):
                setattr(project, field, value)

        await self.session.commit()
        await self.session.refresh(project)
        return project
    

    async def delete(self, project_id: str, user_id: str) -> bool:
        project = await self.get_by_id(project_id=project_id, user_id=user_id)
        if not project:
            return False 
        
        await self.session.delete(project)
        await self.session.commit()
        return True