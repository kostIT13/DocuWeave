from src.infrastructure.core.base import Base 
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, func
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List
from sqlalchemy.dialects.postgresql import JSONB

if TYPE_CHECKING:
    from src.infrastructure.models.user import User
    from src.infrastructure.models.document import Document
    from src.infrastructure.models.chat_session import ChatSession
    from src.infrastructure.models.project_settings_history import ProjectSettingsHistory


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="Название проекта")
    description: Mapped[str] = mapped_column(String(255), nullable=False, default="Описание проекта")
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        onupdate=func.now,          
        server_default=func.now()   
    )
    
    settings: Mapped[dict] = mapped_column(JSONB, default=lambda: {}, server_default="{}", nullable=False)

    user: Mapped["User"] = relationship("User", back_populates='projects')
    documents: Mapped[List["Document"]] = relationship("Document", back_populates='project', cascade='all, delete-orphan', lazy='selectin')
    sessions: Mapped[List["ChatSession"]] = relationship("ChatSession", back_populates='project', cascade='all, delete-orphan', lazy='selectin')
    settings_history: Mapped[List["ProjectSettingsHistory"]] = relationship(
        "ProjectSettingsHistory", back_populates="project", cascade="all, delete-orphan", lazy="selectin"
    )