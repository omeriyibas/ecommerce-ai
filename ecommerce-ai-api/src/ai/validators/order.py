from pydantic_ai import DeferredToolRequests, RunContext

from ai.ai_schemas.order import OrderReply
from ai.deps import AppDeps


def _short_list_message(kind: str, count: int, ask: bool) -> str:
    base = f"{kind} ({count} adet)."
    if ask:
        return f"{base} Hangisini seçersiniz?"
    return base


async def validate_order_output(
    ctx: RunContext[AppDeps],
    output: OrderReply | DeferredToolRequests,
) -> OrderReply | DeferredToolRequests:
    if ctx.partial_output or isinstance(output, DeferredToolRequests):
        return output

    if not output.items:
        return output

    ask = "?" in output.message or "hangi" in output.message.casefold()
    return OrderReply(
        message=_short_list_message("Siparişleriniz", len(output.items), ask),
        items=output.items,
    )
