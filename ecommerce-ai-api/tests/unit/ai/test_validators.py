"""output_validator — liste varken message yalnız adet."""

from __future__ import annotations

import pytest
from pydantic_ai import ModelRetry

from ai.ai_schemas.order import OrderReply
from ai.ai_schemas.payment import PaymentReply
from ai.ai_schemas.research import ProductResearchReply
from ai.validators.order import validate_order_output
from ai.validators.payment import validate_payment_output
from ai.validators.research import validate_research_output
from api_schemas.support_views import OrderChoice, PaymentStatusView


@pytest.mark.asyncio
async def test_order_message_shortened_when_items(run_ctx):
    items = [OrderChoice(id=5, product="iphone", amount=55.0)]
    out = await validate_order_output(
        run_ctx,
        OrderReply(
            message="Siparişleriniz: 1 adet — #5 iphone, tutar 55.0",
            items=items,
        ),
    )
    assert isinstance(out, OrderReply)
    assert out.message == "Siparişleriniz (1 adet)."
    assert out.items == items


@pytest.mark.asyncio
async def test_order_message_ask_when_hangi(run_ctx):
    items = [
        OrderChoice(id=1, product="a", amount=1.0),
        OrderChoice(id=2, product="b", amount=2.0),
    ]
    out = await validate_order_output(
        run_ctx,
        OrderReply(message="Hangisini seçersiniz?", items=items),
    )
    assert out.message == "Siparişleriniz (2 adet). Hangisini seçersiniz?"


@pytest.mark.asyncio
async def test_order_empty_items_keeps_message(run_ctx):
    out = await validate_order_output(
        run_ctx,
        OrderReply(message="Sipariş bulunamadı.", items=[]),
    )
    assert out.message == "Sipariş bulunamadı."


@pytest.mark.asyncio
async def test_payment_unpaid_shortened(run_ctx):
    unpaid = [OrderChoice(id=3, product="x", amount=10.0)]
    out = await validate_payment_output(
        run_ctx,
        PaymentReply(
            message="Ödenecek: #3 x 10 TL",
            unpaid_orders=unpaid,
        ),
    )
    assert out.message == "Ödenecek siparişleriniz (1 adet)."
    assert out.unpaid_orders == unpaid
    assert out.items == []


@pytest.mark.asyncio
async def test_payment_items_shortened(run_ctx):
    items = [PaymentStatusView(order_id=1, product="y", status="paid")]
    out = await validate_payment_output(
        run_ctx,
        PaymentReply(message="#1 y paid", items=items),
    )
    assert out.message == "Ödemeleriniz (1 adet)."
    assert out.items == items


@pytest.mark.asyncio
async def test_research_rejects_short_message(run_ctx):
    with pytest.raises(ModelRetry):
        await validate_research_output(
            run_ctx,
            ProductResearchReply(
                message="kısa",
                sources=["https://example.com"],
            ),
        )


@pytest.mark.asyncio
async def test_research_rejects_empty_sources(run_ctx):
    with pytest.raises(ModelRetry):
        await validate_research_output(
            run_ctx,
            ProductResearchReply(
                message="x" * 50,
                sources=[],
            ),
        )
