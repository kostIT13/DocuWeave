from src.infrastructure.core.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, func
import uuid
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.infrastructure.models.project import Project
    from src.infrastructure.models.user import User


class ProjectSettingsHistory(Base):
    __tablename__ = "project_settings_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    old_settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    new_settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    changed_fields: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="project_settings_history", lazy='selectin')
    user: Mapped["User | None"] = relationship("User", back_populates="project_settings_history", lazy='selectin')
