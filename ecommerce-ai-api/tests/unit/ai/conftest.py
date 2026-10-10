"""AI unit — gerçek LLM yok.

Agent() import’ta provider kurduğu için dummy OPENAI_API_KEY şart;
ALLOW_MODEL_REQUESTS=False + TestModel override ile gerçek istek atılmaz.
"""

from __future__ import annotations

import os
from unittest.mock import MagicMock

# test modülleri agent import etmeden önce
os.environ.setdefault("OPENAI_API_KEY", "sk-test-unit-not-used")

import pytest
from pydantic_ai import models

from ai.deps import AppDeps

models.ALLOW_MODEL_REQUESTS = False


@pytest.fixture
def app_deps() -> AppDeps:
    return AppDeps(
        order_service=MagicMock(),
        payment_service=MagicMock(),
        product_service=MagicMock(),
        user_id=1,
    )


@pytest.fixture
def run_ctx(app_deps: AppDeps):
    from pydantic_ai import RunContext
    from pydantic_ai.models.test import TestModel
    from pydantic_ai.usage import RunUsage

    return RunContext(
        deps=app_deps,
        model=TestModel(),
        usage=RunUsage(),
        partial_output=False,
    )
