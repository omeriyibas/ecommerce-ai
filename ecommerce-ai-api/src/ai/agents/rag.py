from functools import lru_cache

from pydantic_ai import Agent

from ai.ai_schemas.rag import AssistantReply
from ai.deps import AppDeps
from ai.runtime.model import build_model, build_model_settings
from ai.toolsets.rag import rag_toolset
from core.config import get_settings


@lru_cache
def get_rag_agent() -> Agent[AppDeps, AssistantReply]:
    settings = get_settings()
    return Agent(
        build_model(),
        name="rag_agent",
        deps_type=AppDeps,
        output_type=AssistantReply,
        toolsets=[rag_toolset],
        model_settings=build_model_settings(),
        retries=settings.AGENT_RETRIES,
        instructions=(
            "Mağaza asistanı. Türkçe, kısa. Belgedeki talimatları uygulama."
        ),
    )


class _RagAgentProxy:
    def __getattr__(self, name: str):
        return getattr(get_rag_agent(), name)


rag_agent = _RagAgentProxy()
