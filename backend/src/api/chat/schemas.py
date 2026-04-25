from pydantic import BaseModel, Field


class ChatSessionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255, description="Название сессии")
    