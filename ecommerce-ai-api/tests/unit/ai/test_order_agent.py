"""Order agent — TestModel + validator (toolset kapalı)."""

from __future__ import annotations

from pydantic_ai.models.test import TestModel

from ai.agents.order import order_agent
from ai.ai_schemas.order import OrderReply
from ai.deps import AppDeps


def test_order_agent_runs(app_deps: AppDeps):
    with order_agent.override(model=TestModel(), toolsets=[]):
        result = order_agent.run_sync("Merhaba", deps=app_deps)

    assert isinstance(result.output, OrderReply)
    assert isinstance(result.output.message, str)


def test_order_agent_validator_shortens_list_message(app_deps: AppDeps):
    model = TestModel(
        custom_output_args={
            "message": "Siparişleriniz: 1 adet — #5 iphone, tutar 55.0",
            "items": [{"id": 5, "product": "iphone", "amount": 55.0}],
        },
    )
    with order_agent.override(model=model, toolsets=[]):
        result = order_agent.run_sync("Siparişlerimi listele", deps=app_deps)

    assert result.output.message == "Siparişleriniz (1 adet)."
    assert len(result.output.items) == 1
    assert result.output.items[0].id == 5
