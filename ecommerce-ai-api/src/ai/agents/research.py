from pydantic_ai import Agent, WebSearchTool
from pydantic_ai.capabilities import NativeTool

from ai.ai_schemas.research import ProductResearchReply
from ai.deps import AppDeps
from ai.runtime.model import build_model, build_model_settings
from ai.toolsets.research import research_toolset
from ai.validators.research import validate_research_output
from core.config import get_settings

_settings = get_settings()

research_agent = Agent(
    build_model(_settings.OPENAI_RESPONSES_MODEL),
    name="research_agent",
    deps_type=AppDeps,
    output_type=ProductResearchReply,
    toolsets=[research_toolset],
    capabilities=[NativeTool(WebSearchTool())],
    model_settings=build_model_settings(
        temperature=_settings.RESEARCH_TEMPERATURE,
        timeout=_settings.RESEARCH_TIMEOUT,
    ),
    retries=_settings.AGENT_RETRIES,
    instructions=(
        "Ürün araştırma asistanı. Türkçe, kısa. "
        "Sipariş belirsizse numara sor; rastgele seçme. "
        "Katalog adı açıksa doğrudan araştır."
    ),
)
research_agent.output_validator(validate_research_output)
