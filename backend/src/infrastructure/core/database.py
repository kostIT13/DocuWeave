import logging
from sqlalchemy.ext.asyncio import create_async_engine
from src.infrastructure.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from typing import AsyncGenerator


logger = logging.getLogger(__name__)

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG, pool_pre_ping=True)

async_session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
            logger.debug("The transaction is fixed")
        except Exception as e:
            await session.rollback()
            logger.error(f"Transaction error {e}", exc_info=True)
            raise
    



