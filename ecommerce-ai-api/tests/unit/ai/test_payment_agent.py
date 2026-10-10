"""Payment agent — TestModel + validator (toolset kapalı)."""

from __future__ import annotations

from pydantic_ai.models.test import TestModel

from ai.agents.payment import payment_agent
from ai.ai_schemas.payment import PaymentReply
from ai.deps import AppDeps


def test_payment_agent_runs(app_deps: AppDeps):
    with payment_agent.override(model=TestModel(), toolsets=[]):
        result = payment_agent.run_sync("Merhaba", deps=app_deps)

    assert isinstance(result.output, PaymentReply)


def test_payment_agent_validator_shortens_unpaid(app_deps: AppDeps):
    model = TestModel(
        custom_output_args={
            "message": "Ödenecek #3 tablet 99 TL",
            "items": [],
            "unpaid_orders": [{"id": 3, "product": "tablet", "amount": 99.0}],
        },
    )
    with payment_agent.override(model=model, toolsets=[]):
        result = payment_agent.run_sync("Ödenecekler", deps=app_deps)

    assert result.output.message == "Ödenecek siparişleriniz (1 adet)."
    assert len(result.output.unpaid_orders) == 1
