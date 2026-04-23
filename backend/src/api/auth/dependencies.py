from src.infrastructure.core.database import get_db
from src.services.user.user_service import UserService
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
from fastapi.security import OAuth2PasswordBearer
from src.infrastructure.models.user import User
from jose import jwt , JWTError
from src.infrastructure.core.config import settings


async def get_user_service(db: AsyncSession = Depends(get_db)):
    return UserService(db)

UserServiceDependency = Annotated[UserService, Depends(get_user_service)]


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    user_service: UserServiceDependency,
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверные учётные данные",
        headers={"WWW-Authenticate": "Bearer"}
    )
    
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await user_service.get_user_by_id(user_id)
    if user is None:
        raise credentials_exception
    
    return user

CurrentUserDependency = Annotated[User, Depends(get_current_user)]

