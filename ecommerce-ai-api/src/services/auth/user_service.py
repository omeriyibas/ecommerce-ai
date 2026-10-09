from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from typing import List, Optional
import logging

from core.security import hash_password, create_token_pair, verify_password
from services.auth.auth_service import logout_all_refresh_tokens
from api_schemas.auth.change_password import ChangePasswordRequest
from deps.require_admin import require_admin_user
from enums.auth import UserRole
from repositories.user_repository import UserRepository
from api_schemas.auth.user import (
    UserCleanupResponse,
    UserCreate,
    UserResponse,
    UserWithEmail,
    LoginResult,
    LoginUserResponse,
)

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: AsyncSession):
        self._db = db
        self._repo = UserRepository(self._db)

    @staticmethod
    def _to_response(user) -> UserResponse:
        return UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
        )

    async def get_all_users(
        self,
        role: UserRole | None = None,
    ) -> List[UserResponse]:
        """Kullanıcıları getir; opsiyonel role filtresi."""
        users = await self._repo.get_all(role=role)
        return [self._to_response(user) for user in users]

    async def toggle_user_active(self, user_id: int) -> UserResponse:
        """Kullanıcının aktifliğini tersine çevir"""
        user = await self._repo.toggle_active(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kullanıcı bulunamadı",
            )
        return self._to_response(user)

    async def create_user(self, data: UserCreate) -> UserResponse:
        """Panel kullanıcı ekleme (role=user) — yalnızca admin."""
        if await self._repo.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email zaten kayıtlı",
            )

        hashed = hash_password(data.password)
        data.password = hashed
        data.role = UserRole.user

        user = await self._repo.create(data)
        logger.info("[panel] user create user_id=%s", user.id)

        return self._to_response(user)

    async def create_admin(self, data: UserCreate) -> UserResponse:
        """Admin kullanıcı ekleme (users tablosu, role=admin)."""
        if await self._repo.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email zaten kayıtlı",
            )

        hashed = hash_password(data.password)
        data.password = hashed
        data.role = UserRole.admin

        user = await self._repo.create(data)
        logger.info("[panel] admin create user_id=%s", user.id)

        return self._to_response(user)

    async def change_password(
        self, current_user: UserResponse, data: ChangePasswordRequest
    ) -> int:
        """Şifreyi günceller ve tüm refresh oturumlarını iptal eder."""
        row = await self._repo.get_by_id(int(current_user.id))
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kullanıcı bulunamadı",
            )
        if not verify_password(data.current_password, row.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mevcut şifre hatalı",
            )
        row.password = hash_password(data.new_password)
        await self._db.commit()
        role = (
            current_user.role.value
            if hasattr(current_user.role, "value")
            else str(current_user.role)
        )
        return await logout_all_refresh_tokens(int(current_user.id), role)

    async def login(
        self, data: UserWithEmail, *, client_ip: str | None = None
    ) -> LoginResult:
        """Panel kullanıcı girişi (users tablosu)."""
        ip = client_ip or "unknown"
        user = await self._repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password):
            logger.warning(
                "[auth] panel login failed reason=invalid_credentials ip=%s email=%s",
                ip,
                data.email,
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email veya şifre hatalı",
            )
        if not user.is_active:
            logger.warning(
                "[auth] panel login failed user_id=%s reason=inactive ip=%s",
                user.id,
                ip,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Kullanıcı hesabı pasif",
            )

        role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
        token = await create_token_pair(user.id, role_value)
        logger.info(
            "[auth] panel login ok user_id=%s role=%s ip=%s",
            user.id,
            role_value,
            ip,
        )

        return LoginResult(
            user=LoginUserResponse(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                is_active=user.is_active,
            ),
            token=token,
        )

    async def forgot_password(self, email: str) -> None:
        """Şifre sıfırlama isteği — kullanıcı varlığını sızdırmaz.

        E-posta gönderimi henüz yok; kayıtlı kullanıcı için yalnızca audit log.
        """
        user = await self._repo.get_by_email(email)
        if user is None:
            logger.info("[auth] forgot_password no_account email=%s", email)
            return
        logger.info(
            "[auth] forgot_password requested user_id=%s email=%s",
            user.id,
            email,
        )

    async def cleanup_all(
        self,
        current_user: UserResponse,
        *,
        user_ids: Optional[List[int]] = None,
        confirm: bool = False,
    ) -> UserCleanupResponse:
        require_admin_user(current_user)
        if not confirm:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Toplu silme için confirm=true gönderin",
            )

        stats = await self._repo.cleanup_all(
            exclude_user_id=current_user.id,
            user_ids=user_ids,
        )
        logger.info(
            "[panel] user cleanup-all user_id=%s users_deleted=%s selected=%s",
            current_user.id,
            stats["users_deleted"],
            user_ids is not None,
        )
        scope = (
            f"{stats['users_deleted']} kullanıcı"
            if user_ids is None
            else f"seçilen {stats['users_deleted']} kullanıcı"
        )
        return UserCleanupResponse(
            users_deleted=stats["users_deleted"],
            message=f"{scope} temizlendi",
        )
