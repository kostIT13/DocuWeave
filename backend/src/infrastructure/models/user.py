import uuid
from src.infrastructure.core.base import Base 
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, func, Boolean
from datetime import datetime
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from src.infrastructure.models.project import Project
    from src.infrastructure.models.chat_session import ChatSession
    from src.infrastructure.models.project_settings_history import ProjectSettingsHistory


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False, default='username')
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    sessions: Mapped[List["ChatSession"]] = relationship("ChatSession", back_populates='user', cascade='all, delete-orphan', lazy='selectin')
    projects: Mapped[List["Project"]] = relationship("Project", back_populates='user', cascade='all, delete-orphan', lazy='selectin')
    settings_history: Mapped[List["ProjectSettingsHistory"]] = relationship(
        "ProjectSettingsHistory", back_populates="user", lazy="selectin"
    )