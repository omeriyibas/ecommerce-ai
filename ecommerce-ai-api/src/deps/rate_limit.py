"""Redis tabanlı basit rate limit."""

from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable

from fastapi import HTTPException, Request
from starlette import status

from core.client_ip import get_client_ip
from core.config import get_settings
from infrastructure.managers.redis_manager import redis_manager

logger = logging.getLogger(__name__)


async def _enforce(
    request: Request,
    *,
    scope: str,
    limit: int,
    window_sec: int,
) -> None:
    settings = get_settings()
    if not settings.RATE_LIMIT_ENABLED:
        return
    if limit <= 0 or window_sec <= 0:
        return

    host = get_client_ip(request) or "unknown"
    key = f"rate_limit:{scope}:{host}"

    try:
        client = redis_manager.get_client()
        count = await client.incr(key)
        if int(count) == 1:
            await client.expire(key, window_sec)
        if int(count) > limit:
            logger.warning(
                "[rate_limit] exceeded scope=%s ip=%s count=%s limit=%s window_sec=%s",
                scope,
                host,
                int(count),
                limit,
                window_sec,
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Çok fazla deneme; lütfen daha sonra tekrar deneyin",
            )
    except HTTPException:
        raise
    except Exception:
        # Redis erişilemezse isteği engelleme (fail-open)
        return


def rate_limit(
    scope: str,
    *,
    limit: int,
    window_sec: int,
) -> Callable[[Request], Awaitable[None]]:
    async def dependency(request: Request) -> None:
        await _enforce(
            request,
            scope=scope,
            limit=limit,
            window_sec=window_sec,
        )

    return dependency


def api_rate_limit(scope: str) -> Callable[[Request], Awaitable[None]]:
    """Genel API rate limit; farklı uçlar `scope` ile ayrılır."""
    s = get_settings()
    return rate_limit(
        scope,
        limit=s.RATE_LIMIT_API_MAX,
        window_sec=s.RATE_LIMIT_API_WINDOW_SEC,
    )


def auth_login_rate_limit() -> Callable[[Request], Awaitable[None]]:
    s = get_settings()
    return rate_limit(
        "auth_login",
        limit=s.RATE_LIMIT_LOGIN_MAX,
        window_sec=s.RATE_LIMIT_LOGIN_WINDOW_SEC,
    )


def auth_register_rate_limit() -> Callable[[Request], Awaitable[None]]:
    s = get_settings()
    return rate_limit(
        "auth_register",
        limit=s.RATE_LIMIT_REGISTER_MAX,
        window_sec=s.RATE_LIMIT_REGISTER_WINDOW_SEC,
    )


def admin_bootstrap_rate_limit() -> Callable[[Request], Awaitable[None]]:
    s = get_settings()
    return rate_limit(
        "admin_bootstrap",
        limit=s.RATE_LIMIT_ADMIN_MAX,
        window_sec=s.RATE_LIMIT_ADMIN_WINDOW_SEC,
    )


def auth_forgot_password_rate_limit() -> Callable[[Request], Awaitable[None]]:
    s = get_settings()
    return rate_limit(
        "auth_forgot_password",
        limit=s.RATE_LIMIT_REGISTER_MAX,
        window_sec=s.RATE_LIMIT_REGISTER_WINDOW_SEC,
    )
