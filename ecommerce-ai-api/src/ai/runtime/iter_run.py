from __future__ import annotations

from typing import Any

from pydantic_ai import Agent
from pydantic_ai.messages import ModelMessage

from core.config import get_settings


async def run_with_iter(
    agent: Agent[Any, Any],
    prompt: str,
    *,
    deps: Any = None,
    message_history: list[ModelMessage] | None = None,
):
    """agent.iter ile çalıştır; iç graph düğümlerini (opsiyonel) logla.

    `run()` ile aynı sonucu verir; aradaki ModelRequest / CallTools / End
    adımlarını görmeyi sağlar.
    """
    settings = get_settings()
    label = agent.name or "agent"
    kwargs: dict[str, Any] = {}
    if deps is not None:
        kwargs["deps"] = deps
    if message_history:
        kwargs["message_history"] = message_history

    async with agent.iter(prompt, **kwargs) as agent_run:
        async for node in agent_run:
            if settings.AGENT_ITER_LOG:
                print(f"  [iter:{label}] {type(node).__name__}")
        if agent_run.result is None:
            raise RuntimeError(f"{label}: iter run sonucu boş")
        return agent_run.result
