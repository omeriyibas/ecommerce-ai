"""Refresh token HTTP cookie yardımcıları (HttpOnly / Secure / SameSite / Partitioned)."""

from __future__ import annotations

from typing import Literal

from fastapi import HTTPException, Request, Response, status

from core.config import get_settings

settings = get_settings()

REFRESH_COOKIE_NAME = "refresh_token"
#: "1" = Max-Age ile kalıcı; "0" = session cookie (remember_me=false)
REFRESH_PERSIST_COOKIE_NAME = "refresh_persist"
COOKIE_PATH = "/auth"

SameSite = Literal["lax", "strict", "none"]


def _samesite() -> SameSite:
    raw = (settings.COOKIE_SAMESITE or "lax").strip().lower()
    if raw not in ("lax", "strict", "none"):
        return "lax"
    return raw  # type: ignore[return-value]


def _wants_partitioned() -> bool:
    """CHIPS: cross-site (SameSite=None) cookie'lerde Partitioned gerekir."""
    return _samesite() == "none"


def _append_partitioned(response: Response, key: str) -> None:
    """Python <3.14 / Starlette: partitioned= kwarg kullanılamaz; header'a ekle."""
    prefix = f"{key}=".encode("latin-1").lower()
    for i in range(len(response.raw_headers) - 1, -1, -1):
        name, value = response.raw_headers[i]
        if name != b"set-cookie":
            continue
        if not value.lower().startswith(prefix):
            continue
        if b"partitioned" not in value.lower():
            response.raw_headers[i] = (name, value + b"; Partitioned")
        return


def _base_cookie_kwargs(*, max_age: int | None) -> dict:
    return {
        "httponly": True,
        "secure": True,
        "samesite": _samesite(),
        "path": COOKIE_PATH,
        "max_age": max_age,
    }


def _set_cookie(
    response: Response,
    *,
    key: str,
    value: str,
    max_age: int | None,
    expires: int | None = None,
) -> None:
    kwargs = _base_cookie_kwargs(max_age=max_age)
    if expires is not None:
        kwargs["expires"] = expires
    response.set_cookie(key=key, value=value, **kwargs)
    if _wants_partitioned():
        _append_partitioned(response, key)


def is_refresh_persistent(request: Request) -> bool:
    return (request.cookies.get(REFRESH_PERSIST_COOKIE_NAME) or "1") != "0"


def set_refresh_cookie(
    response: Response,
    refresh_token: str,
    *,
    persistent: bool = True,
) -> None:
    max_age = int(settings.REFRESH_DAYS) * 24 * 3600 if persistent else None
    _set_cookie(
        response,
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=max_age,
    )
    _set_cookie(
        response,
        key=REFRESH_PERSIST_COOKIE_NAME,
        value="1" if persistent else "0",
        max_age=max_age,
    )


def clear_refresh_cookie(response: Response) -> None:
    # delete_cookie Partitioned desteklemez; aynı attribute ile expire et
    for key in (REFRESH_COOKIE_NAME, REFRESH_PERSIST_COOKIE_NAME):
        _set_cookie(response, key=key, value="", max_age=0, expires=0)


def resolve_refresh_token(
    request: Request,
    *,
    body_refresh: str | None,
) -> str:
    """Önce body (mobile), yoksa HttpOnly cookie (panel)."""
    from_body = (body_refresh or "").strip()
    if from_body:
        return from_body
    from_cookie = (request.cookies.get(REFRESH_COOKIE_NAME) or "").strip()
    if from_cookie:
        return from_cookie
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing refresh token",
    )
