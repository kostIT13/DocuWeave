from src.infrastructure.core.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, func
import uuid
from datetime import datetime, timezone
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from src.infrastructure.models.project import Project
    from src.infrastructure.models.user import User
    from src.infrastructure.models.message import Message
    from src.infrastructure.models.graph_trace import GraphTrace


class ChatSession(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), default="Новый чат")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates='sessions')
    project: Mapped["Project"] = relationship("Project", back_populates='sessions')
    messages: Mapped[List["Message"]] = relationship("Message", back_populates='chat_session', cascade='all, delete-orphan', lazy="selectin")
    traces: Mapped[List["GraphTrace"]] = relationship("GraphTrace", back_populates='chat_session', cascade='all, delete-orphan', lazy='selectin')



