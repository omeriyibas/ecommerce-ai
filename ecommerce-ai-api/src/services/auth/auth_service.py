from jwt.exceptions import InvalidTokenError
from fastapi import HTTPException, status

from core.security import create_token_pair, decode_token
from infrastructure.store.redis_store import (
    is_refresh_active,
    revoke_all_refresh_for_user,
    revoke_refresh,
)
from api_schemas.auth.token import TokenResult


def _decode_refresh_payload(refresh_token: str, *, verify_exp: bool = True) -> dict:
    try:
        payload = decode_token(refresh_token, verify_exp=verify_exp)
        if payload.get("typ") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        sub = payload.get("sub")
        if sub is None or str(sub).strip() == "":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing subject in token",
            )
        return payload
    except HTTPException:
        raise
    except (InvalidTokenError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


async def rotate_refresh_token(refresh_token: str) -> TokenResult:
    payload = _decode_refresh_payload(refresh_token, verify_exp=True)
    user_id = int(payload["sub"])
    role = payload.get("role")
    jti = payload["jti"]

    if not await is_refresh_active(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh revoked or expired",
        )

    await revoke_refresh(jti)
    return await create_token_pair(user_id, role)


async def logout_refresh_token(refresh_token: str) -> None:
    """Tek oturum: refresh jti Redis'ten kaldırılır (idempotent)."""
    payload = _decode_refresh_payload(refresh_token, verify_exp=False)
    jti = payload.get("jti")
    if jti:
        await revoke_refresh(str(jti))


async def logout_all_refresh_tokens(user_id: int, role: str) -> int:
    """Kullanıcının tüm aktif refresh oturumlarını iptal eder."""
    return await revoke_all_refresh_for_user(int(user_id), str(role))
