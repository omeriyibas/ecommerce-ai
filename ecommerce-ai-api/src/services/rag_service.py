from __future__ import annotations

import logging
import re
import tempfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from chonkie import RecursiveChunker
from flashrank import Ranker, RerankRequest
from pydantic_ai import Embedder
from pypdf import PdfReader
from rank_bm25 import BM25Okapi
from sqlalchemy.ext.asyncio import AsyncSession

from ai.ai_schemas.rag import RetrievedPassage, SearchResult
from api_schemas.document import DocumentResponse
from core.config import get_settings
from enums.document import DocumentType
from models.document import DocumentChunk
from repositories.document_repository import DocumentRepository

logger = logging.getLogger(__name__)

RRF_K = 60
CANDIDATE_K = 20
TOP_K = 5

_settings = get_settings()
_chunker = RecursiveChunker()
_embedder: Embedder | None = None
_reranker: Ranker | None = None


def tokenize(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower(), flags=re.UNICODE)


def get_embedder() -> Embedder:
    global _embedder
    if _embedder is None:
        model = _settings.EMBEDDER_MODEL
        if not model:
            raise ValueError("EMBEDDER_MODEL .env içinde tanımlı olmalı.")
        _embedder = Embedder(model)
    return _embedder


def get_reranker() -> Ranker:
    global _reranker
    if _reranker is None:
        model = _settings.RERANKER_MODEL
        if not model:
            raise ValueError("RERANKER_MODEL .env içinde tanımlı olmalı.")
        cache_dir = Path(_settings.FLASHRANK_CACHE_DIR)
        cache_dir.mkdir(parents=True, exist_ok=True)
        _reranker = Ranker(model_name=model, cache_dir=str(cache_dir))
    return _reranker


@dataclass
class RagIndex:
    """DB'den yüklenen müşteri corpus'u — hybrid arama için."""

    customer_id: str
    chunks: list[DocumentChunk]
    vectors: np.ndarray
    bm25: BM25Okapi


class RagService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DocumentRepository(db)

    def read_chunks(self, path: Path) -> list[str]:
        reader = PdfReader(path)
        texts: list[str] = []

        for page in reader.pages:
            text = (page.extract_text() or "").strip()
            if not text:
                continue
            for item in _chunker(text):
                if item.text.strip():
                    texts.append(item.text)

        if not texts:
            raise ValueError(
                "PDF'den metin çıkarılamadı. "
                "Taranmış PDF için önce OCR gerekebilir."
            )
        return texts

    async def ingest_pdf(
        self,
        *,
        path: Path,
        customer_id: str,
        document_type: DocumentType,
        document_name: str | None = None,
        replace: bool = True,
    ) -> int:
        """PDF'i parçala, embed et ve DB'ye yaz. document_type yüklemede verilir."""
        name = document_name or path.name
        texts = self.read_chunks(path)

        embedder = get_embedder()
        embeddings: list[list[float]] = []
        for start in range(0, len(texts), 32):
            batch = texts[start : start + 32]
            result = await embedder.embed_documents(batch)
            embeddings.extend(result.embeddings)

        if len(embeddings) != len(texts):
            raise ValueError("Chunk ve embedding sayıları eşleşmiyor.")

        if replace:
            await self.repo.delete_by_customer_and_name(customer_id, name)

        doc = await self.repo.create_document(
            customer_id=customer_id,
            name=name,
            document_type=document_type,
        )

        chunks = [
            DocumentChunk(
                document_id=doc.id,
                customer_id=customer_id,
                document_type=document_type,
                content=text,
                embedding=embedding,
            )
            for text, embedding in zip(texts, embeddings)
        ]
        await self.repo.add_chunks(chunks)
        await self.db.commit()

        logger.info(
            "RAG ingest: customer_id=%s name=%s type=%s chunks=%s",
            customer_id,
            name,
            document_type,
            len(chunks),
        )
        return len(chunks)

    async def load_index(self, customer_id: str) -> RagIndex:
        chunks = await self.repo.list_chunks_for_customer(customer_id)
        if not chunks:
            raise ValueError(
                f"customer_id={customer_id} için DB'de chunk yok. "
                "Önce PDF ingest edin."
            )

        vectors = np.asarray(
            [list(chunk.embedding or []) for chunk in chunks],
            dtype=np.float32,
        )
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        vectors = vectors / np.maximum(norms, 1e-12)
        bm25 = BM25Okapi([tokenize(chunk.content) for chunk in chunks])

        return RagIndex(
            customer_id=customer_id,
            chunks=chunks,
            vectors=vectors,
            bm25=bm25,
        )

    async def search(
        self,
        index: RagIndex,
        *,
        query: str,
        document_type: DocumentType,
    ) -> SearchResult:
        allowed = np.array(
            [
                document_type == DocumentType.genel
                or chunk.document_type == document_type
                or chunk.document_type == DocumentType.genel
                for chunk in index.chunks
            ],
            dtype=bool,
        )
        if not allowed.any():
            return SearchResult(passages=[])

        result = await get_embedder().embed_query(query)
        query_vector = np.asarray(result.embeddings[0], dtype=np.float32)
        query_vector = query_vector / max(np.linalg.norm(query_vector), 1e-12)

        vector_scores = index.vectors @ query_vector
        bm25_scores = np.asarray(
            index.bm25.get_scores(tokenize(query)),
            dtype=np.float32,
        )

        n = len(index.chunks)
        rrf_scores = np.zeros(n, dtype=np.float32)
        for rank, idx in enumerate(np.argsort(vector_scores)[::-1]):
            rrf_scores[idx] += 1.0 / (RRF_K + rank + 1)
        for rank, idx in enumerate(np.argsort(bm25_scores)[::-1]):
            rrf_scores[idx] += 1.0 / (RRF_K + rank + 1)

        rrf_scores = np.where(allowed, rrf_scores, -np.inf)
        candidate_indices = [
            int(i)
            for i in np.argsort(rrf_scores)[::-1][:CANDIDATE_K]
            if np.isfinite(rrf_scores[i])
        ]
        if not candidate_indices:
            return SearchResult(passages=[])

        reranked = get_reranker().rerank(
            RerankRequest(
                query=query,
                passages=[
                    {
                        "id": int(i),
                        "text": index.chunks[i].content,
                    }
                    for i in candidate_indices
                ],
            )
        )[:TOP_K]

        return SearchResult(
            passages=[RetrievedPassage(content=item["text"]) for item in reranked]
        )

    async def list_documents(self, customer_id: str) -> list[DocumentResponse]:
        rows = await self.repo.list_documents_for_customer(customer_id)
        return [
            DocumentResponse(
                id=doc.id,
                name=doc.name,
                document_type=doc.document_type,
                chunk_count=count,
            )
            for doc, count in rows
        ]

    async def ingest_upload(
        self,
        *,
        customer_id: str,
        document_type: DocumentType,
        filename: str,
        content: bytes,
        replace: bool = True,
    ) -> DocumentResponse:
        suffix = Path(filename).suffix or ".pdf"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(content)
            tmp_path = Path(tmp.name)
        try:
            await self.ingest_pdf(
                path=tmp_path,
                customer_id=customer_id,
                document_type=document_type,
                document_name=filename,
                replace=replace,
            )
        finally:
            tmp_path.unlink(missing_ok=True)

        doc = await self.repo.get_by_customer_and_name(customer_id, filename)
        if doc is None:
            raise ValueError("Belge kaydı oluşturulamadı.")
        rows = await self.repo.list_documents_for_customer(customer_id)
        for item, count in rows:
            if item.id == doc.id:
                return DocumentResponse(
                    id=item.id,
                    name=item.name,
                    document_type=item.document_type,
                    chunk_count=count,
                )
        return DocumentResponse(
            id=doc.id,
            name=doc.name,
            document_type=doc.document_type,
            chunk_count=0,
        )

    async def delete_document(self, customer_id: str, document_id: int) -> bool:
        deleted = await self.repo.delete_by_id_for_customer(document_id, customer_id)
        if deleted:
            await self.db.commit()
        return deleted
