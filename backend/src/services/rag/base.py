from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class EmbeddingProvider(ABC):
    
    @abstractmethod
    async def embed(self, text: str, model: str) -> List[float]: ...


class VectorStore(ABC):

    @abstractmethod
    async def add_documents(
        self, collection: str, ids: List[str], 
        embeddings: List[List[float]], metadatas: List[Dict[str, Any]]
    ) -> None: ...


    @abstractmethod
    async def query(
        self, collection: str, query_embedding: List[float], 
        top_k: int, where_filter: Optional[Dict] = None
    ) -> Dict[str, Any]: ...


    @abstractmethod
    async def delete_documents(self, collection: str, ids: List[str]) -> None: ...


class DocumentChunker(ABC):

    @abstractmethod
    async def load_and_split(
        self, file_path: str, mime_type: str, 
        chunk_size: int, chunk_overlap: int
    ) -> List[Dict[str, Any]]: ...


class RAGPipeline(ABC):

    @abstractmethod
    async def index(
        self, doc_id: str, file_path: str, mime_type: str, 
        project_settings: Dict[str, Any]
    ) -> Dict[str, Any]: ...


    @abstractmethod
    async def retrieve(
        self, query: str, project_settings: Dict[str, Any], project_id: str
    ) -> List[Dict[str, Any]]: ...


    @abstractmethod
    async def generate(
        self, query: str, context: List[Dict], 
        history: List[Dict], project_settings: Dict[str, Any]
    ) -> str: ...