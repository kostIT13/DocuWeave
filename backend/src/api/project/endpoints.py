# src/api/project/routes.py
from fastapi import APIRouter, Depends, status, HTTPException, Query
from typing import List

from src.api.project.schemas import (
    ProjectCreate, ProjectResponse, ProjectUpdate, 
    ProjectSettings, ProjectSettingsUpdate, 
    HistoryPagination, SettingsHistoryResponse
)
from src.api.project.dependencies import (
    ProjectServiceDependency, 
    CurrentProjectDependency, 
    SettingsHistoryServiceDependency
)
from src.api.auth.dependencies import CurrentUserDependency


router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    service: ProjectServiceDependency,
    current_user: CurrentUserDependency
):
    return await service.create_project(
        user_id=current_user.id, 
        data=data.model_dump()
    )


@router.get("", response_model=List[ProjectResponse])
async def get_projects(
    service: ProjectServiceDependency,
    current_user: CurrentUserDependency,
    limit: int = Query(20, ge=1, le=100)
):
    return await service.get_list_by_user(user_id=current_user.id, limit=limit)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(current_project: CurrentProjectDependency):
    return current_project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    current_project: CurrentProjectDependency,
    data: ProjectUpdate,
    service: ProjectServiceDependency,
    current_user: CurrentUserDependency
):
    project = await service.update_project(
        project_id=current_project.id,
        user_id=current_user.id,
        data=data.model_dump(exclude_unset=True)
    )
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return project
    

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    current_project: CurrentProjectDependency,
    service: ProjectServiceDependency,
    current_user: CurrentUserDependency
):
    success = await service.delete_project(
        project_id=current_project.id,
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Проект не найден")


@router.get("/{project_id}/settings", response_model=ProjectSettings)
async def get_project_settings(current_project: CurrentProjectDependency):
    settings_data = current_project.settings or {}
    return ProjectSettings(**settings_data)


@router.patch("/{project_id}/settings", response_model=ProjectSettings)
async def update_project_settings(
    data: ProjectSettingsUpdate,
    current_project: CurrentProjectDependency,
    current_user: CurrentUserDependency,
    service: ProjectServiceDependency
):
    try:
        updated_settings = data.merge_with_defaults()
        project = await service.update_settings(
            project_id=current_project.id,
            user_id=current_user.id,
            new_settings=updated_settings
        )
        return ProjectSettings(**project.settings)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{project_id}/settings/history", response_model=HistoryPagination)
async def get_settings_history(
    current_project: CurrentProjectDependency,
    history_service: SettingsHistoryServiceDependency,
    page: int = Query(1, ge=1, description="Номер страницы"),
    page_size: int = Query(20, ge=1, le=100, description="Элементов на странице")
):
    skip = (page - 1) * page_size
    items, total = await history_service.get_history(
        project_id=current_project.id,
        skip=skip,
        limit=page_size
    )
    
    return HistoryPagination(
        items=[SettingsHistoryResponse.model_validate(h) for h in items],
        total=total,
        page=page,
        page_size=page_size
    )