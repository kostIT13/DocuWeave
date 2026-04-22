from fastapi import FastAPI
from src.lifespan import lifespan
from src.infrastructure.core.logging_settings import setup_logging
from src.infrastructure.core.config import settings


setup_logging(level=settings.LOG_LEVEL)


app = FastAPI(titel='DocuWeave', lifespan=lifespan, description='Local AI Document Assistant')