from src.services.document.document_service import DocumentService
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, Path, status, HTTPException
from src.infrastructure.core.database import get_db
from typing import Annotated
from src.infrastructure.models.document import Document
from src.api.project.dependencies import CurrentProjectDependency


async def get_document_service(db: AsyncSession = Depends(get_db)):
    return DocumentService(db)


DocumentServiceDependency = Annotated[DocumentService, Depends(get_document_service)]


async def get_document_or_404(
    document_service: DocumentServiceDependency,
    current_project: CurrentProjectDependency,
    document_id: str = Path(..., description="ID документа"),
) -> Document:
    document = await document_service.get_document_by_id(document_id, current_project.id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Документ не найден или доступ запрещён"
        )
    
    return document

DocumentDependency = Annotated[Document, Depends(get_document_or_404)]