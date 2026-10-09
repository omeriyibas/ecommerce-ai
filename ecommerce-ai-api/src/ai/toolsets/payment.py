from typing import Any

from fastapi import HTTPException
from pydantic_ai import FunctionToolset, ModelRetry, RunContext, ToolDefinition

from ai.deps import AppDeps
from api_schemas.support_views import OrderChoice, PaymentStatusView


def _current_user_instruction(ctx: RunContext[AppDeps]) -> str:
    return f"Şu anda giriş yapmış kullanıcının ID’si: {ctx.deps.user_id}."


_payment_tools = FunctionToolset[AppDeps](
    id="payment-support",
    instructions=[
        "Uygun tool’u çağır. Ödeme için belirsizse unpaid listele; "
        "tutar/ödeme id yazma.",
        _current_user_instruction,
    ],
)


@_payment_tools.tool
async def list_payment_statuses(
    ctx: RunContext[AppDeps],
) -> list[PaymentStatusView]:
    """Ödeme durum listesi: sipariş no, ürün, durum (tutar yok)."""
    return await ctx.deps.payment_service.list_payment_statuses(ctx.deps.user_id)


@_payment_tools.tool
async def list_unpaid_order_choices(
    ctx: RunContext[AppDeps],
) -> list[OrderChoice]:
    """Ödemesi olmayan siparişler: numara, ürün, tutar."""
    return await ctx.deps.order_service.list_unpaid_order_choices(ctx.deps.user_id)


@_payment_tools.tool
async def get_payment_status(
    ctx: RunContext[AppDeps],
    order_id: int,
) -> PaymentStatusView:
    """Belirli siparişin ödeme durumunu getirir."""
    view = await ctx.deps.payment_service.get_payment_status(
        ctx.deps.user_id,
        order_id,
    )
    if view is None:
        raise ModelRetry(
            "Bu sipariş için ödeme kaydı bulunamadı. "
            "Geçerli bir sipariş numarası kullan veya pay_for_order ile öde."
        )
    return view


@_payment_tools.tool
async def get_latest_payment_status(
    ctx: RunContext[AppDeps],
) -> PaymentStatusView:
    """En son siparişin ödeme durumunu getirir."""
    view = await ctx.deps.payment_service.get_latest_payment_status(
        ctx.deps.user_id,
    )
    if view is None:
        raise ModelRetry(
            "Son sipariş için ödeme kaydı yok veya sipariş bulunamadı."
        )
    return view


@_payment_tools.tool
async def pay_for_order(ctx: RunContext[AppDeps], order_id: int) -> PaymentStatusView:
    """Sipariş ödemesini paid yapar (yoksa oluşturur). Onay sonrası çalışır."""
    try:
        return await ctx.deps.payment_service.pay_for_order(
            ctx.deps.user_id,
            order_id,
            status="paid",
        )
    except HTTPException as exc:
        detail = exc.detail if isinstance(exc.detail, str) else "Ödeme oluşturulamadı."
        raise ModelRetry(detail) from exc


def _payment_approval_policy(
    ctx: RunContext[AppDeps],
    tool_def: ToolDefinition,
    tool_args: dict[str, Any],
) -> bool:
    return tool_def.name == "pay_for_order"


payment_toolset = _payment_tools.approval_required(_payment_approval_policy)
