from pydantic_ai import Agent, DeferredToolRequests

from ai.ai_schemas.order import OrderReply
from ai.deps import AppDeps
from ai.runtime.model import build_model, build_model_settings
from ai.toolsets.order import order_toolset
from ai.validators.order import validate_order_output
from core.config import get_settings

_settings = get_settings()

order_agent = Agent(
    build_model(),
    name="order_agent",
    deps_type=AppDeps,
    output_type=OrderReply | DeferredToolRequests,
    toolsets=[order_toolset],
    model_settings=build_model_settings(),
    retries=_settings.AGENT_RETRIES,
    instructions=(
        "Sipariş asistanı. Türkçe, kısa. Veri için tool kullan; uydurma. "
        "Geçmişte liste/seçim varsa tool’u tekrarlama."
    ),
)
order_agent.output_validator(validate_order_output)
