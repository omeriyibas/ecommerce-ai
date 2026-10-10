"""RAG agent — TestModel (gerçek LLM / FlashRank yok)."""

from __future__ import annotations

from pydantic_ai.models.test import TestModel

from ai.agents.rag import get_rag_agent
from ai.ai_schemas.rag import AssistantReply
from ai.deps import AppDeps


def test_rag_agent_runs(app_deps: AppDeps):
    agent = get_rag_agent()
    with agent.override(model=TestModel(), toolsets=[]):
        result = agent.run_sync("İade süresi nedir?", deps=app_deps)

    assert isinstance(result.output, AssistantReply)
    assert isinstance(result.output.answer, str)


def test_rag_agent_custom_answer(app_deps: AppDeps):
    agent = get_rag_agent()
    model = TestModel(custom_output_args={"answer": "14 gün içinde iade."})
    with agent.override(model=model, toolsets=[]):
        result = agent.run_sync("İade?", deps=app_deps)

    assert result.output.answer == "14 gün içinde iade."
