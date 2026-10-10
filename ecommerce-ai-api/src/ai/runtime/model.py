from __future__ import annotations

from typing import Any, cast

from pydantic_ai.models import Model
from pydantic_ai.models.fallback import FallbackModel
from pydantic_ai.settings import ModelSettings

from core.config import get_settings


def resolve_thinking(raw: str | None) -> bool | str | None:
    if raw is None:
        return None
    lowered = raw.strip().lower()
    if lowered in {'1', 'true', 'yes', 'on'}:
        return True
    if lowered in {'0', 'false', 'no', 'off'}:
        return False
    return lowered


def build_model(model_name: str | None = None) -> str | Model:
    """Primary model; OPENAI_FALLBACK_MODEL doluysa FallbackModel sarar."""
    settings = get_settings()
    primary = model_name or settings.OPENAI_MODEL
    fallback = settings.OPENAI_FALLBACK_MODEL
    if fallback:
        return FallbackModel(primary, fallback)
    return primary


def build_router_model() -> str | Model:
    """`typesafe:jev-…` + LLM FallbackModel; key yoksa LLM."""
    settings = get_settings()
    llm = build_model()
    if not (settings.TYPESAFE_API_KEY or "").strip():
        return llm
    return FallbackModel(settings.TYPESAFE_MODEL, llm)


def build_model_settings(
    *,
    temperature: float | None = None,
    timeout: float | None = None,
    max_tokens: int | None = None,
) -> ModelSettings:
    """ModelSettings üretir.

    gpt-5 ailesinde reasoning açıken temperature desteklenmez (uyarı + ignore).
    Temperature yalnız AGENT_THINKING=false iken gönderilir.
    """
    settings = get_settings()
    thinking = resolve_thinking(settings.AGENT_THINKING)

    model_settings: dict[str, Any] = {
        'timeout': settings.AGENT_TIMEOUT if timeout is None else timeout,
        'max_tokens': (
            settings.AGENT_MAX_TOKENS if max_tokens is None else max_tokens
        ),
    }

    if thinking is not None:
        model_settings['thinking'] = thinking

    # Reasoning açık / default iken sampling parametresi gönderme
    if thinking is False:
        model_settings['temperature'] = (
            settings.AGENT_TEMPERATURE if temperature is None else temperature
        )

    return cast(ModelSettings, model_settings)
