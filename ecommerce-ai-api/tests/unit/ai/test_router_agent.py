"""Router — TestModel (gerçek LLM yok)."""

from __future__ import annotations

from pydantic_ai.models.test import TestModel

from ai.agents.router import SupportRoute, router_agent

_ROUTES = set(SupportRoute)


def test_router_runs():
    with router_agent.override(model=TestModel()):
        result = router_agent.run_sync("Siparişlerimi göster.")

    assert result.output is not None
    assert result.output in _ROUTES


def test_router_output_is_support_route():
    with router_agent.override(model=TestModel()):
        result = router_agent.run_sync("Merhaba")

    assert isinstance(result.output, SupportRoute)
    assert result.output in _ROUTES


def test_router_includes_rag_route():
    assert SupportRoute.rag in _ROUTES
