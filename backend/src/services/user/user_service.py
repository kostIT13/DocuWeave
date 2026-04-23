from src.services.user.repository import SQLAlchemyUserRepository
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from src.infrastructure.models.user import User
import uuid
from src.infrastructure.utils.hash_password import _hash_password
from src.infrastructure.utils.verify_password import _verify_password


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = SQLAlchemyUserRepository(db)


    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        return await self.repository.get_by_id(user_id)
    

    async def get_user_by_email(self, email: str) -> Optional[User]:
        return await self.repository.get_by_email(email)
    

    async def get_all_users(self, **filters) -> List[User]:
        return await self.repository.get_all(**filters)
    

    async def create_user(self, data: dict) -> User: 
        password = data['password']
        if len(password.encode('utf-8')) > 72:
            raise ValueError("Пароль слишком длинный (макс. 72 байта)")
        if len(password) < 6:
            raise ValueError("Пароль слишком короткий (мин. 6 символов)")
        
        existing_users = await self.repository.get_all(email=data['email'])
        if existing_users:
            raise ValueError("Email уже занят")
        
        existing = await self.repository.get_all(username=data.get('username'))
        if existing:
            
            raise ValueError("Username уже занят")
        hashed_password =_hash_password(password)
        
        user = await self.repository.create({
            "id": str(uuid.uuid4()),
            "email": data['email'],
            "username": data['username'],
            "hashed_password": hashed_password,
            "is_active": True,
            "is_superuser": False
        })
        return user


    async def update_user(self, user_id: str, data: dict) -> Optional[User]:
        if 'password' in data:
            new_password = data['password']
            if len(new_password.encode('utf-8')) > 72:
                raise ValueError("Пароль слишком длинный (макс. 72 байта)")
            
            data['hashed_password'] =_hash_password(new_password)
            del data['password']
        
        return await self.repository.update(user_id, data)
    
    