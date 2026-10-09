from pydantic_ai import ModelRetry, RunContext

from ai.ai_schemas.research import ProductResearchReply
from ai.deps import AppDeps


def _prompt_text(ctx: RunContext[AppDeps]) -> str:
    prompt = ctx.prompt
    if isinstance(prompt, str):
        return prompt
    return str(prompt or '')


def _is_order_research(prompt: str, output: ProductResearchReply) -> bool:
    if output.order_id is not None:
        return True
    text = prompt.casefold()
    return 'sipariş' in text or 'siparis' in text


async def validate_research_output(
    ctx: RunContext[AppDeps],
    output: ProductResearchReply,
) -> ProductResearchReply:
    if ctx.partial_output:
        return output

    if len((output.message or '').strip()) < 40:
        raise ModelRetry(
            'Araştırma mesajı çok kısa. En az birkaç maddeyle özetle.'
        )

    if not output.sources:
        raise ModelRetry(
            'sources boş. Web search kaynaklarından en az bir http(s) URL ekle.'
        )

    for url in output.sources:
        if not isinstance(url, str) or not url.startswith(('http://', 'https://')):
            raise ModelRetry(
                f'Geçersiz kaynak URL: {url!r}. http:// veya https:// olmalı.'
            )

    prompt = _prompt_text(ctx)
    if not _is_order_research(prompt, output):
        return output

    if output.order_id is None:
        raise ModelRetry(
            'Sipariş araştırmasında order_id zorunlu. '
            'get_latest_order_product veya get_order_product kullan.'
        )

    if not (output.product_name or '').strip():
        raise ModelRetry(
            'Sipariş araştırmasında product_name zorunlu; ürün adını doldur.'
        )

    order = await ctx.deps.order_service.get_order(
        ctx.deps.user_id,
        output.order_id,
    )
    if order is None:
        raise ModelRetry(
            f'order_id={output.order_id} bu kullanıcıya ait değil veya yok. '
            'Doğru sipariş numarasını kullan.'
        )

    if order.product.casefold() != output.product_name.strip().casefold():
        raise ModelRetry(
            f'product_name siparişteki ürünle uyuşmuyor. '
            f'Beklenen: {order.product!r}, gelen: {output.product_name!r}.'
        )

    return output
