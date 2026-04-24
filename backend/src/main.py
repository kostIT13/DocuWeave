from fastapi import FastAPI
from src.lifespan import lifespan
from src.infrastructure.core.logging_settings import setup_logging
from src.infrastructure.core.config import settings
from src.infrastructure.models.chat_session import ChatSession
from src.infrastructure.models.document import Document
from src.infrastructure.models.graph_trace import GraphTrace
from src.infrastructure.models.message import Message 
from src.infrastructure.models.project import Project
from src.infrastructure.models.user import User
from src.infrastructure.models.project_settings_history import ProjectSettingsHistory


setup_logging(level=settings.LOG_LEVEL)


app = FastAPI(titel='DocuWeave', lifespan=lifespan, description='Local AI Document Assistant')