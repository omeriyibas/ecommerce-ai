from __future__ import annotations

import asyncio
from typing import Any

from pydantic_ai.exceptions import (
    AgentRunError,
    ContentFilterError,
    FallbackExceptionGroup,
    ModelHTTPError,
    UnexpectedModelBehavior,
    UsageLimitExceeded,
)

# Graph adımlarında yakalanan, kullanıcıya çevrilebilir hatalar
RecoverableError = (
    AgentRunError,
    FallbackExceptionGroup,
    TimeoutError,
    asyncio.TimeoutError,
)


def format_agent_error(exc: BaseException, *, step: str) -> str:
    """İstisnayı kısa Türkçe kullanıcı mesajına çevirir (stack/API detayı yok)."""
    if isinstance(exc, ContentFilterError):
        return (
            f'{step} tamamlanamadı: model içeriği güvenlik filtresine takıldı. '
            'Lütfen soruyu yeniden ifade et.'
        )
    if isinstance(exc, UsageLimitExceeded):
        return (
            f'{step} tamamlanamadı: istek limiti aşıldı. '
            'Biraz sonra tekrar dene.'
        )
    if isinstance(exc, ModelHTTPError):
        if exc.status_code == 429:
            return (
                f'{step} tamamlanamadı: model servisi meşgul (rate limit). '
                'Kısa süre sonra tekrar dene.'
            )
        if 500 <= exc.status_code < 600:
            return (
                f'{step} tamamlanamadı: model servisinde geçici bir hata oluştu. '
                'Tekrar dene.'
            )
        return (
            f'{step} tamamlanamadı: model isteği reddedildi '
            f'(HTTP {exc.status_code}).'
        )
    if isinstance(exc, UnexpectedModelBehavior):
        return (
            f'{step} tamamlanamadı: model beklenen cevabı üretemedi. '
            'Soruyu netleştirip tekrar dene.'
        )
    if isinstance(exc, (TimeoutError, asyncio.TimeoutError)):
        return f'{step} tamamlanamadı: süre aşımı. Tekrar dene.'
    if isinstance(exc, FallbackExceptionGroup):
        return (
            f'{step} tamamlanamadı: birincil ve yedek modeller de başarısız oldu. '
            'Tekrar dene.'
        )
    if isinstance(exc, AgentRunError):
        return f'{step} tamamlanamadı. Lütfen tekrar dene.'
    return f'{step} tamamlanamadı. Lütfen tekrar dene.'


def record_step_error(state: Any, exc: BaseException, *, step: str) -> str:
    """SupportState.error / notes günceller; kullanıcı mesajını döner."""
    message = format_agent_error(exc, step=step)
    existing = getattr(state, 'error', None)
    state.error = f'{existing} {message}'.strip() if existing else message
    notes = getattr(state, 'notes', None)
    if isinstance(notes, list):
        notes.append(f'error:{step}:{type(exc).__name__}')
    print(f'\n[error:{step}] {type(exc).__name__}: {message}', flush=True)
    return message
