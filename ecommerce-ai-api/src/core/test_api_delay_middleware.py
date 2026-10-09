"""Test için her HTTP isteğine yapılandırılabilir gecikme ekler."""

import asyncio

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from core.config import get_settings


class TestApiDelayMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        delay_ms = get_settings().API_REQUEST_DELAY_MS
        if delay_ms > 0:
            await asyncio.sleep(delay_ms / 1000.0)
        return await call_next(request)
