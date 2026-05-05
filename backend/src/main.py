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
from src.api.auth.endpoints import router as auth_router
from src.api.chat.endpoints import router as chat_router
from src.api.document.endpoints import router as document_router
from src.api.project.endpoints import router as project_router
from fastapi.middleware.cors import CORSMiddleware


setup_logging(level=settings.LOG_LEVEL)


app = FastAPI(titel='DocuWeave', lifespan=lifespan, description='Local AI Document Assistant')


app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(document_router)
app.include_router(project_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",      
        "http://127.0.0.1:5173",
        "http://localhost:3000",     
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)