"""Router — TestModel (gerçek LLM yok)."""

from __future__ import annotations

from typing import get_args

from pydantic_ai.models.test import TestModel

from ai.agents.router import Route, router_agent

_ROUTES = set(get_args(Route))


def test_router_runs():
    with router_agent.override(model=TestModel()):
        result = router_agent.run_sync("Siparişlerimi göster.")

    assert result.output is not None
    assert result.output in _ROUTES


def test_router_output_is_route_literal():
    with router_agent.override(model=TestModel()):
        result = router_agent.run_sync("Merhaba")

    assert result.output in _ROUTES


def test_router_includes_rag_route():
    assert "rag" in _ROUTES
