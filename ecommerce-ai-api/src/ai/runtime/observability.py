from __future__ import annotations

import logfire

from core.config import get_settings


def setup_logfire() -> bool:
    """Logfire etkinse configure + pydantic-ai instrument.

    Token yoksa buluta göndermez (`if-token-present`); uygulama çalışmaya devam eder.
    """
    settings = get_settings()
    if not settings.LOGFIRE_ENABLED:
        return False

    configure_kwargs: dict = {
        'service_name': settings.LOGFIRE_SERVICE_NAME,
        'send_to_logfire': 'if-token-present',
    }
    if settings.LOGFIRE_TOKEN:
        configure_kwargs['token'] = settings.LOGFIRE_TOKEN
    if settings.LOGFIRE_ENVIRONMENT:
        configure_kwargs['environment'] = settings.LOGFIRE_ENVIRONMENT

    logfire.configure(**configure_kwargs)
    logfire.instrument_pydantic_ai()
    return True
