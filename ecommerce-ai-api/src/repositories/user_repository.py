from typing import List, Optional, Sequence, TypedDict

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api_schemas.auth.user import UserCreate
from enums.auth import UserRole
from models.auth import User


class UserCleanupStats(TypedDict):
    users_deleted: int


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        role: UserRole | None = None,
    ) -> List[User]:
        """Kullanıcıları getir; role verilirse filtreler."""
        query = select(User)
        if role is not None:
            query = query.where(User.role == role)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_email(self, email: str) -> User | None:
        query = select(User).where(User.email == email)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_by_id(self, user_id: int) -> User | None:
        """ID ile kullanıcı getir"""
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def update(self, user_id: int, data: UserCreate) -> User | None:
        """Kullanıcı güncelle"""
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        user = result.scalars().first()

        if not user:
            return None

        user.name = data.name
        user.email = data.email
        user.password = data.password

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def toggle_active(self, user_id: int) -> User | None:
        """Kullanıcının is_active alanını tersine çevir"""
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        user = result.scalars().first()

        if not user:
            return None

        user.is_active = not bool(user.is_active)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def delete(self, user_id: int) -> bool:
        """Kullanıcı sil"""
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        user = result.scalars().first()

        if not user:
            return False

        await self.db.delete(user)
        await self.db.commit()
        return True

    async def create(self, data: UserCreate) -> User:
        user = User(
            email=data.email,
            name=data.name,
            password=data.password,
            role=data.role if data.role is not None else UserRole.admin,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def cleanup_all(
        self,
        *,
        exclude_user_id: int,
        user_ids: Optional[Sequence[int]] = None,
    ) -> UserCleanupStats:
        q = select(User).where(User.id != int(exclude_user_id))
        if user_ids is not None:
            q = q.where(User.id.in_(list(user_ids)))
        users = list((await self.db.execute(q)).scalars().all())
        for row in users:
            await self.db.delete(row)
        try:
            await self.db.commit()
        except IntegrityError as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Kullanıcılar silinemedi.",
            ) from e
        return {"users_deleted": len(users)}
