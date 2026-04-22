from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging
from sqlalchemy import text
from src.infrastructure.core.database import engine


logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("The application is running")
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Database connection error:{e}")
    yield
    
    await engine.dispose() 
    logger.info("Ready")