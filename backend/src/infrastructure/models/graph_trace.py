from src.infrastructure.core.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, JSONB, DateTime, func
import uuid 
from typing import Optional, TYPE_CHECKING, List
from datetime import datetime

if TYPE_CHECKING:
    from src.infrastructure.models.chat_session import ChatSession


class GraphTrace(Base):
    __tablename__ = 'traces'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    step_name: Mapped[str] = mapped_column(String(255))
    input: Mapped[Optional[dict]] = mapped_column(JSONB, default=lambda: {}, nullable=True)
    output: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    state_snapshot: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    chat_session: Mapped[ChatSession] = relationship("ChatSession", back_populates="traces")


    