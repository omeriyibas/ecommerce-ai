"""Panel admin yetkisi zorunluluğu."""

from fastapi import Depends, HTTPException
from starlette import status

from api_schemas.auth.user import UserResponse
from deps.auth import get_current_user
from enums.auth import UserRole

ADMIN_FORBIDDEN_DETAIL = "Bu işlem için admin yetkisi gerekli"


def require_admin_user(user: UserResponse) -> UserResponse:
    """Servis katmanında admin kontrolü."""
    if user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ADMIN_FORBIDDEN_DETAIL,
        )
    return user


async def require_admin(
    user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """Router dependency: giriş yapmış panel admin."""
    return require_admin_user(user)
