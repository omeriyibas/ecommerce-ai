"""search_documents tool — index yoksa boş."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from ai.ai_schemas.rag import SearchResult
from ai.deps import AppDeps
from ai.toolsets.rag import search_documents
from enums.document import DocumentType


@pytest.mark.asyncio
async def test_search_documents_empty_without_index(run_ctx):
    run_ctx.deps.rag_index = None
    run_ctx.deps.rag_service = None

    out = await search_documents(
        run_ctx,
        query="iade",
        document_type=DocumentType.iade,
    )
    assert out == SearchResult(passages=[])


@pytest.mark.asyncio
async def test_search_documents_calls_service(run_ctx, app_deps: AppDeps):
    expected = SearchResult(passages=[{"content": "14 gün iade"}])
    rag_service = MagicMock()
    rag_service.search = AsyncMock(return_value=expected)
    index = MagicMock()

    run_ctx.deps.rag_service = rag_service
    run_ctx.deps.rag_index = index
    run_ctx.deps.customer_id = "1"

    out = await search_documents(
        run_ctx,
        query="iade süresi",
        document_type=DocumentType.iade,
    )

    assert out is expected
    rag_service.search.assert_awaited_once_with(
        index,
        query="iade süresi",
        document_type=DocumentType.iade,
    )
