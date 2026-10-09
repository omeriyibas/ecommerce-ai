import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from api_schemas.auth.token import TokenResult
from core.config import get_settings
from infrastructure.store.redis_store import store_refresh_jti

settings = get_settings()

BCRYPT_MAX_PASSWORD_BYTES = 72


def hash_password(pw: str) -> str:
    pw_bytes = pw.encode("utf-8")
    if len(pw_bytes) > BCRYPT_MAX_PASSWORD_BYTES:
        pw_bytes = pw_bytes[:BCRYPT_MAX_PASSWORD_BYTES]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(
        plain.encode("utf-8"),
        hashed.encode("utf-8") if isinstance(hashed, str) else hashed,
    )


def _jwt(payload: dict, minutes: int = None, days: int = None):
    exp = datetime.now(timezone.utc) + (
        timedelta(minutes=minutes) if minutes else timedelta(days=days)
    )
    to_encode = payload | {
        "exp": exp,
        "iat": datetime.now(timezone.utc),
        "iss": settings.JWT_ISS,
        "aud": settings.JWT_AUD,
    }
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def decode_token(token: str, *, verify_exp: bool = True) -> dict:
    """JWT doğrula: imza, alg, exp, iss, aud (+ çağıranın sub/typ kontrolleri)."""
    return jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALG],
        audience=settings.JWT_AUD,
        issuer=settings.JWT_ISS,
        options={"verify_exp": verify_exp},
    )


def create_access_token(user_id: int, role: str):
    return _jwt(
        {"sub": str(user_id), "typ": "access", "role": role},
        minutes=settings.ACCESS_MIN,
    )


def create_refresh_token(user_id: int, role: str):
    jti = str(uuid.uuid4())
    token = _jwt(
        {"sub": str(user_id), "typ": "refresh", "jti": jti, "role": role},
        days=settings.REFRESH_DAYS,
    )
    return token, jti


async def create_token_pair(user_id: int, role: str):
    access = create_access_token(user_id, role)
    refresh, jti = create_refresh_token(user_id, role)

    ttl = settings.REFRESH_DAYS * 24 * 3600
    await store_refresh_jti(jti, user_id, role, ttl)

    return TokenResult(access_token=access, refresh_token=refresh)
