from pydantic_ai import Agent, DeferredToolRequests

from ai.ai_schemas.payment import PaymentReply
from ai.deps import AppDeps
from ai.runtime.model import build_model, build_model_settings
from ai.toolsets.payment import payment_toolset
from ai.validators.payment import validate_payment_output
from core.config import get_settings

_settings = get_settings()

payment_agent = Agent(
    build_model(),
    name="payment_agent",
    deps_type=AppDeps,
    output_type=PaymentReply | DeferredToolRequests,
    toolsets=[payment_toolset],
    model_settings=build_model_settings(),
    retries=_settings.AGENT_RETRIES,
    instructions=(
        "Ödeme asistanı. Türkçe, kısa. Veri için tool kullan; uydurma. "
        "Geçmişte liste/seçim varsa tool’u tekrarlama."
    ),
)
payment_agent.output_validator(validate_payment_output)
