from src.infrastructure.core.base import Base 
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Enum, Text, DateTime, func
import uuid
import enum
from typing import Optional, TYPE_CHECKING, List
from datetime import datetime 
from sqlalchemy.dialects.postgresql import JSONB

if TYPE_CHECKING:
    from src.infrastructure.models.chat_session import ChatSession


class MessageRole(str, enum.Enum):
    USER = 'user'
    ASSISTANT = 'assistant'
    SYSTEM = 'system'


class Message(Base):
    __tablename__ = 'messages'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole), default=MessageRole.USER, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[Optional[dict]] = mapped_column(JSONB, default=lambda: {}, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    chat_session: Mapped["ChatSession"] = relationship("ChatSession", back_populates='messages')
    
    @property
    def sources(self) -> List[str]:
        if not self.metadata_:
            return []
        sources = self.metadata_.get("sources")
        return sources if isinstance(sources, list) else []

    @sources.setter
    def sources(self, value: List[str]):
        if self.metadata_ is None:
            self.metadata_ = {}
        self.metadata_["sources"] = value
    

