import asyncio
import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    PyPDFLoader, TextLoader, Docx2txtLoader, UnstructuredMarkdownLoader
)
from typing import List, Dict, Any
from pathlib import Path


logger = logging.getLogger(__name__)


class DocumentProcessor:
    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 50):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    async def load_and_split(self, file_path: str, mime_type: str) -> List[Dict[str, Any]]:
        try:
            loader = self._get_loader(file_path, mime_type)
            docs = await asyncio.to_thread(loader.load)
            logger.info(f"Загружен документ {file_path}, количество страниц/секций: {len(docs)}")
            
            chunks = self.splitter.split_documents(docs)
            logger.info(f"Документ разбит на {len(chunks)} чанков")
            
            return [
                {
                    "page_content": chunk.page_content,
                    "metadata": {
                        **chunk.metadata,
                        "file_path": file_path,
                        "chunk_index": i,
                        "mime_type": mime_type
                    }
                }
                for i, chunk in enumerate(chunks)
            ]
        except Exception as e:
            logger.error(f"Ошибка обработки документа {file_path}: {e}", exc_info=True)
            raise

    def _get_loader(self, path: str, mime: str):
        loaders = {
            "application/pdf": PyPDFLoader,
            "text/plain": TextLoader,
            "text/markdown": UnstructuredMarkdownLoader,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": Docx2txtLoader,
            "application/msword": TextLoader,
        }
        loader_cls = loaders.get(mime, TextLoader)
        logger.debug(f"Используется загрузчик {loader_cls.__name__} для файла {path}")
        return loader_cls(path)

    def update_splitter_params(self, chunk_size: int, chunk_overlap: int):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        logger.info(f"Параметры сплиттера обновлены: chunk_size={chunk_size}, chunk_overlap={chunk_overlap}")