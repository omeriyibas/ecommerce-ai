"""RagService — tokenize + search (embed/rerank mock)."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import numpy as np
import pytest
from rank_bm25 import BM25Okapi

from ai.ai_schemas.rag import RetrievedPassage
from enums.document import DocumentType
from services.rag_service import RagIndex, RagService, tokenize


def test_tokenize_splits_words():
    assert tokenize("iade politikasi: 14 gun!") == [
        "iade",
        "politikasi",
        "14",
        "gun",
    ]


def _chunk(
    *,
    content: str,
    document_type: DocumentType,
    embedding: list[float],
) -> SimpleNamespace:
    return SimpleNamespace(
        content=content,
        document_type=document_type,
        embedding=embedding,
    )


@pytest.mark.asyncio
async def test_search_returns_reranked_passages(monkeypatch):
    dim = 4
    chunks = [
        _chunk(
            content="İade 14 gün içinde yapılabilir.",
            document_type=DocumentType.iade,
            embedding=[1.0, 0.0, 0.0, 0.0],
        ),
        _chunk(
            content="Kargo 2-3 iş günü sürer.",
            document_type=DocumentType.kargo,
            embedding=[0.0, 1.0, 0.0, 0.0],
        ),
        _chunk(
            content="Genel mağaza bilgisi.",
            document_type=DocumentType.genel,
            embedding=[0.7, 0.7, 0.0, 0.0],
        ),
    ]
    vectors = np.asarray([c.embedding for c in chunks], dtype=np.float32)
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    vectors = vectors / np.maximum(norms, 1e-12)
    index = RagIndex(
        customer_id="1",
        chunks=chunks,  # type: ignore[arg-type]
        vectors=vectors,
        bm25=BM25Okapi([tokenize(c.content) for c in chunks]),
    )

    embedder = MagicMock()
    embedder.embed_query = AsyncMock(
        return_value=SimpleNamespace(embeddings=[[1.0, 0.0, 0.0, 0.0]])
    )
    monkeypatch.setattr("services.rag_service.get_embedder", lambda: embedder)

    reranker = MagicMock()
    reranker.rerank.return_value = [
        {"id": 0, "text": chunks[0].content, "score": 0.9},
    ]
    monkeypatch.setattr("services.rag_service.get_reranker", lambda: reranker)

    svc = RagService(db=MagicMock())
    result = await svc.search(
        index,
        query="iade süresi",
        document_type=DocumentType.iade,
    )

    assert len(result.passages) == 1
    assert result.passages[0] == RetrievedPassage(
        content="İade 14 gün içinde yapılabilir.",
    )
    reranker.rerank.assert_called_once()


@pytest.mark.asyncio
async def test_search_no_allowed_type_returns_empty(monkeypatch):
    chunks = [
        _chunk(
            content="Sadece kargo metni",
            document_type=DocumentType.kargo,
            embedding=[1.0, 0.0, 0.0, 0.0],
        ),
    ]
    vectors = np.asarray([chunks[0].embedding], dtype=np.float32)
    vectors = vectors / np.linalg.norm(vectors)
    index = RagIndex(
        customer_id="1",
        chunks=chunks,  # type: ignore[arg-type]
        vectors=vectors,
        bm25=BM25Okapi([tokenize(chunks[0].content)]),
    )

    svc = RagService(db=MagicMock())
    result = await svc.search(
        index,
        query="iade",
        document_type=DocumentType.iade,
    )
    assert result.passages == []
