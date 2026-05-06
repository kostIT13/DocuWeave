# src/api/document/endpoints.py
from fastapi import APIRouter, File, UploadFile, BackgroundTasks, HTTPException, status, Path
from src.api.document.dependencies import DocumentServiceDependency, DocumentDependency
from src.api.project.dependencies import CurrentProjectDependency  # ✅ Эта зависимость берёт project_id из пути
from src.api.document.schemas import DocumentListResponse, DocumentResponse, DocumentUploadResponse
from typing import List


# ✅ ИСПРАВЛЕНО: Добавлен {project_id} в префикс роутера
router = APIRouter(prefix="/projects/{project_id}/documents", tags=["Documents"])


@router.get("", response_model=List[DocumentListResponse])  # ← Убрали лишний слэш
async def get_project_documents(
    current_project: CurrentProjectDependency,  # ← Теперь project_id берётся из пути
    service: DocumentServiceDependency
):
    return await service.get_list_documents(current_project.id)


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    current_project: CurrentProjectDependency,
    service: DocumentServiceDependency,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Имя файла не указано')
    
    content_type = file.content_type or "application/octet-stream"
    file_content = await file.read()
    
    if len(file_content) > 10 * 1024 * 1024: 
        raise HTTPException(status_code=400, detail="Файл слишком большой (макс. 10MB)")
    
    try:
        document = await service.upload_document(
            project_id=current_project.id,
            filename=file.filename,
            file_content=file_content,
            file_type=content_type,
            background_tasks=background_tasks
        )
        
        return DocumentUploadResponse(
            id=document.id,
            filename=document.filename,
            status=document.status,
            message='Документ загружен и обрабатывается в фоне',
            created_at=document.created_at
        )
    
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    

@router.get('/{document_id}', response_model=DocumentResponse)
async def get_document(document: DocumentDependency):
    return document
 

@router.delete('/{document_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document: DocumentDependency,
    service: DocumentServiceDependency,
    hard: bool = False
):
    await service.delete_document(document.id, document.project_id, hard=hard)