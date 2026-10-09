from pydantic_ai import FunctionToolset, ModelRetry, RunContext

from ai.ai_schemas.research import OrderProductInfo
from ai.deps import AppDeps
from api_schemas.order import OrderResponse
from api_schemas.product import ProductResponse


def _current_user_instruction(ctx: RunContext[AppDeps]) -> str:
    return f'Şu anda giriş yapmış kullanıcının ID’si: {ctx.deps.user_id}.'


research_toolset = FunctionToolset[AppDeps](
    id="product-research",
    instructions=[
        "Son sipariş → latest; numara varsa get_order_product; "
        "belirsizse sormadan tool çağırma. Sonra web search; sources doldur.",
        _current_user_instruction,
    ],
)


async def _order_product_info(
    ctx: RunContext[AppDeps],
    order: OrderResponse,
) -> OrderProductInfo:
    product = await ctx.deps.product_service.get_product(order.product_id)
    if product is None:
        raise ModelRetry(
            f'Sipariş {order.id} için ürün '
            f'(product_id={order.product_id}) bulunamadı.'
        )
    return OrderProductInfo(
        order_id=order.id,
        product_id=product.id,
        name=product.name,
        price=product.price,
        description=product.description,
    )


@research_toolset.tool
async def get_latest_order_product(ctx: RunContext[AppDeps]) -> OrderProductInfo:
    """Kullanıcının son siparişindeki ürünü getirir."""
    order = await ctx.deps.order_service.get_latest_order(ctx.deps.user_id)
    if order is None:
        raise ModelRetry('Bu kullanıcının hiç siparişi yok.')
    return await _order_product_info(ctx, order)


@research_toolset.tool
async def get_order_product(
    ctx: RunContext[AppDeps],
    order_id: int,
) -> OrderProductInfo:
    """Verilen siparişteki ürünü getirir (kullanıcının kendi siparişi)."""
    order = await ctx.deps.order_service.get_order(ctx.deps.user_id, order_id)
    if order is None:
        raise ModelRetry(
            'Bu sipariş bulunamadı. Geçerli bir sipariş numarası kullan.'
        )
    return await _order_product_info(ctx, order)


@research_toolset.tool
async def list_catalog_products(ctx: RunContext[AppDeps]) -> list[ProductResponse]:
    """Katalogdaki ürünleri listeler."""
    return await ctx.deps.product_service.list_products()


@research_toolset.tool
async def get_catalog_product(
    ctx: RunContext[AppDeps],
    product_id: int,
) -> ProductResponse:
    """Katalogdan tek ürün getirir."""
    product = await ctx.deps.product_service.get_product(product_id)
    if product is None:
        raise ModelRetry(
            'Bu ürün bulunamadı. Geçerli bir ürün numarası kullan.'
        )
    return product
