from abc import ABC, abstractmethod
from typing import Optional, List
from src.infrastructure.models.document import Document, DocumentStatus


class DocumentRepository(ABC):

    @abstractmethod
    async def get_by_id(self, document_id: str) -> Optional[Document]:
        raise NotImplementedError
    

    @abstractmethod 
    async def get_project_documents(self, project_id: str) -> List[Document]:
        raise NotImplementedError
    

    @abstractmethod
    async def create(self, data: dict) -> Document:
        raise NotImplementedError
    

    @abstractmethod
    async def update(self, document_id: str, data: dict) -> Optional[Document]:
        raise NotImplementedError


    @abstractmethod
    async def delete(self, document_id: str) -> Optional[Document]:
        raise NotImplementedError
    

    @abstractmethod
    async def get_by_status(self, project_id: str, status: DocumentStatus) -> List[Document]:
        raise NotImplementedError
    

    @abstractmethod
    async def hard_delete(self, document_id: str) -> bool:
        raise NotImplementedError
    


    

