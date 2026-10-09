"""Tutarlı API hata cevapları (panel `detail` alanı ile uyumlu)."""

import logging

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

_STATUS_CODES: dict[int, str] = {
    400: "bad_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    409: "conflict",
    422: "validation_error",
    429: "too_many_requests",
    500: "internal_error",
    503: "service_unavailable",
}


def _error_code(status_code: int) -> str:
    return _STATUS_CODES.get(status_code, "http_error")


def _message_from_detail(detail: object) -> str:
    if isinstance(detail, str) and detail.strip():
        return detail
    if isinstance(detail, list) and detail:
        first = detail[0]
        if isinstance(first, dict):
            msg = first.get("msg")
            if isinstance(msg, str) and msg.strip():
                return msg
        if isinstance(first, str) and first.strip():
            return first
    return "İstek işlenemedi"


def _validation_errors(errors: list[dict]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for err in errors:
        loc = err.get("loc") or ()
        parts = [str(part) for part in loc if part not in ("body", "query", "path")]
        field = ".".join(parts) if parts else str(loc[-1] if loc else "body")
        msg = err.get("msg")
        out.append(
            {
                "field": field,
                "message": str(msg) if msg is not None else "Geçersiz değer",
            }
        )
    return out


async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    message = _message_from_detail(detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": _error_code(exc.status_code),
            "message": message,
            "detail": detail,
        },
    )


async def validation_exception_handler(
    _: Request, exc: RequestValidationError
) -> JSONResponse:
    raw_errors = list(exc.errors())
    return JSONResponse(
        status_code=422,
        content={
            "code": "validation_error",
            "message": "Geçersiz istek",
            "detail": raw_errors,
            "errors": _validation_errors(raw_errors),
        },
    )


async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled server error: %s", exc)
    message = "Sunucu hatası"
    return JSONResponse(
        status_code=500,
        content={
            "code": "internal_error",
            "message": message,
            "detail": message,
        },
    )


def register_exception_handlers(app) -> None:
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
