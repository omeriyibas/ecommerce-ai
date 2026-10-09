from typing import Any

from pydantic_ai import FunctionToolset, ModelRetry, RunContext, ToolDefinition

from ai.deps import AppDeps
from api_schemas.support_views import OrderChoice, OrderStatusView


def _current_user_instruction(ctx: RunContext[AppDeps]) -> str:
    return f"Şu anda giriş yapmış kullanıcının ID’si: {ctx.deps.user_id}."


_order_tools = FunctionToolset[AppDeps](
    id="order-support",
    instructions=[
        "Uygun tool’u çağır. Belirsiz siparişte listele; "
        "“son sipariş”te latest kullan.",
        _current_user_instruction,
    ],
)


@_order_tools.tool
async def list_order_choices(ctx: RunContext[AppDeps]) -> list[OrderChoice]:
    """Sipariş seçim listesi: numara, ürün adı ve tutar (durum yok)."""
    return await ctx.deps.order_service.list_order_choices(ctx.deps.user_id)


@_order_tools.tool
async def get_order_status(
    ctx: RunContext[AppDeps],
    order_id: int,
) -> OrderStatusView:
    """Belirli siparişin durumunu getirir."""
    view = await ctx.deps.order_service.get_order_status(
        ctx.deps.user_id,
        order_id,
    )
    if view is None:
        raise ModelRetry(
            "Bu sipariş bulunamadı. Geçerli bir sipariş numarası kullan."
        )
    return view


@_order_tools.tool
async def get_latest_order_status(ctx: RunContext[AppDeps]) -> OrderStatusView:
    """En son siparişin durumunu getirir."""
    view = await ctx.deps.order_service.get_latest_order_status(ctx.deps.user_id)
    if view is None:
        raise ModelRetry("Bu kullanıcının hiç siparişi yok.")
    return view


@_order_tools.tool
async def cancel_order(ctx: RunContext[AppDeps], order_id: int) -> OrderStatusView:
    """Kullanıcının bir siparişini iptal eder; güncel durumu döner."""
    view = await ctx.deps.order_service.cancel_order_status(
        ctx.deps.user_id,
        order_id,
    )
    if view is None:
        raise ModelRetry(
            "Bu sipariş iptal edilemedi. Geçerli bir sipariş numarası kullan."
        )
    return view


def _order_approval_policy(
    ctx: RunContext[AppDeps],
    tool_def: ToolDefinition,
    tool_args: dict[str, Any],
) -> bool:
    return tool_def.name == "cancel_order"


order_toolset = _order_tools.approval_required(_order_approval_policy)
