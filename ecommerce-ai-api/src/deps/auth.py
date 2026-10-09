import logging
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt.exceptions import InvalidTokenError
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import decode_token
from deps.db import get_db
from models.auth import User
from api_schemas.auth.user import UserResponse

logger = logging.getLogger(__name__)

bearer = HTTPBearer(auto_error=False)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer),
                           db: AsyncSession = Depends(get_db)) -> UserResponse:

    if not creds:
        raise HTTPException(401, "Missing credentials")
    token = creds.credentials
    try:
        payload = decode_token(token)

        if payload.get("typ") != "access":
            raise HTTPException(401, "Invalid token type")
        sub = payload.get("sub")
        if sub is None or str(sub).strip() == "":
            raise HTTPException(401, "Missing subject in token")
        user_id = int(sub)
        role = payload.get("role")

        logger.debug(
            "Token'dan role okundu - user_id=%s role=%s",
            user_id,
            role,
        )

        if not role:
            logger.warning(f"Token'da role bulunamadı - user_id: {user_id}")
            raise HTTPException(401, "Missing role in token")

    except (InvalidTokenError, KeyError, ValueError):
        raise HTTPException(401, "Invalid or expired token")

    user = await db.get(User, user_id)
    if user is None:
        logger.warning(f"Kullanıcı bulunamadı - user_id: {user_id}")
        raise HTTPException(401, "User not found or inactive")
    if not user.is_active:
        logger.warning(f"Kullanıcı pasif - user_id: {user_id}")
        raise HTTPException(401, "User not found or inactive")

    db_role = user.role.value if hasattr(user.role, "value") else str(user.role)
    if role != db_role:
        logger.warning(
            "Token rolü veritabanı ile uyuşmuyor (yeniden giriş gerekir) user_id=%s token=%s db=%s",
            user_id,
            role,
            db_role,
        )
        raise HTTPException(
            401,
            "Oturum rolü güncel değil; lütfen tekrar giriş yapın",
        )

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
    )