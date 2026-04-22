from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging
from sqlalchemy import text


logger = logging.getLogger("__main__")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Приложение запущено")
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Ошибка подключения к бд:{e}")
    yield
    
    await engine.dispose() 
    logger.info("Готово")