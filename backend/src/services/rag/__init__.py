from src.services.rag.base import EmbeddingProvider, VectorStore
from src.services.rag.config import RAGConfig, rag_config
from src.services.rag.indexer import RAGIndexer
from src.services.rag.retriever import RAGRetriever
from src.services.rag.generator import RAGGenerator
from src.services.rag.orchestrator import RAGOrchestrator
from src.services.rag.document_processor import DocumentProcessor
from src.services.rag.chroma_client import ChromaClient
from src.services.llm.unified_ollama_client import UnifiedOllamaClient


__all__ = [
    "EmbeddingProvider",
    "VectorStore",
    
    "RAGConfig",
    "rag_config",
    
    "RAGIndexer",
    "RAGRetriever", 
    "RAGGenerator",
    "RAGOrchestrator",
    "DocumentProcessor",
    
    "ChromaClient",
    "UnifiedOllamaClient",
    
    "create_rag_orchestrator",
    "create_default_rag_components",
]


def create_default_rag_components(
    config: RAGConfig = None
) -> tuple[UnifiedOllamaClient, ChromaClient, DocumentProcessor]:
    config = config or rag_config
    
    ollama_client = UnifiedOllamaClient()
    
    chroma_client = ChromaClient()
    
    document_processor = DocumentProcessor(
        chunk_size=config.chunk_size,
        chunk_overlap=config.chunk_overlap
    )
    
    return ollama_client, chroma_client, document_processor


def create_rag_orchestrator(
    config: RAGConfig = None
) -> RAGOrchestrator:
    config = config or rag_config
    
    ollama_client, chroma_client, document_processor = create_default_rag_components(config)
    
    indexer = RAGIndexer(
        embedding_provider=ollama_client,
        vector_store=chroma_client,
        document_processor=document_processor,
        config=config
    )
    
    retriever = RAGRetriever(
        embedding_provider=ollama_client,
        vector_store=chroma_client,
        config=config
    )
    
    generator = RAGGenerator(
        llm_provider=ollama_client,
        config=config
    )
    
    orchestrator = RAGOrchestrator(
        indexer=indexer,
        retriever=retriever,
        generator=generator,
        config=config
    )
    
    return orchestrator