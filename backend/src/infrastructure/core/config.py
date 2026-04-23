from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str 
    LOG_LEVEL: str = "INFO"

    DEBUG: bool = False

    CHROMA_HOST: str 
    CHROMA_PORT: str 
    CHROMA_COLLECSTIONS: str 

    OLLAMA_HOST: str 
    OLLAMA_EMBBEDING_MODEL: str 
    OLLAMA_LLM: str
    
    OPENAI_API_KEY: str | None = None
    PROJECT_NAME: str = "DocuWeave"

    ENVIRONMENT: str = "developing"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

