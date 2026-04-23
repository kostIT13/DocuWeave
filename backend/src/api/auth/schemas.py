from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr = Field(..., examples=["user@example.com"])
    username: str
    password: str = Field(..., examples=["Str0ngP@ss!"], json_schema_extra={"writeOnly": True})
    

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Пароль слишком длинный (макс. 72 байта для bcrypt)')
        if len(v) < 6:
            raise ValueError('Пароль слишком короткий (мин. 6 символов)')
        return v
    

class UserLogin(BaseModel):
    email: EmailStr = Field(..., examples=["user@example.com"])
    password: str = Field(..., examples=["Str0ngP@ss!"], json_schema_extra={"writeOnly": True})


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str 
    email: str 
    username: str 
    created_at: datetime
    

