from pydantic_ai import DeferredToolRequests, RunContext

from ai.ai_schemas.payment import PaymentReply
from ai.deps import AppDeps


def _short_list_message(kind: str, count: int, ask: bool) -> str:
    base = f"{kind} ({count} adet)."
    if ask:
        return f"{base} Hangisini seçersiniz?"
    return base


async def validate_payment_output(
    ctx: RunContext[AppDeps],
    output: PaymentReply | DeferredToolRequests,
) -> PaymentReply | DeferredToolRequests:
    if ctx.partial_output or isinstance(output, DeferredToolRequests):
        return output

    ask = "?" in output.message or "hangi" in output.message.casefold()

    if output.unpaid_orders:
        return PaymentReply(
            message=_short_list_message(
                "Ödenecek siparişleriniz",
                len(output.unpaid_orders),
                ask,
            ),
            items=[],
            unpaid_orders=output.unpaid_orders,
        )

    if output.items:
        return PaymentReply(
            message=_short_list_message("Ödemeleriniz", len(output.items), ask),
            items=output.items,
            unpaid_orders=[],
        )

    return output
