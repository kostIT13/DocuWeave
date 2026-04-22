import uuid
from src.infrastructure.core.base import Base 
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, func
from datetime import datetime
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from src.infrastructure.models.project import Project
    from src.infrastructure.models.chat_session import ChatSession


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    
    sessions: Mapped[List[ChatSession]] = relationship("ChatSession", back_populates='user', cascade='all, delete-orphan', lazy='selectin')
    projects: Mapped[List[Project]] = relationship("Project", back_populates='user', cascade='all, delete-orphan', lazy='selectin')

    

