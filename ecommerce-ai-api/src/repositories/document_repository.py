from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from enums.document import DocumentType
from models.document import Document, DocumentChunk


class DocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id_for_customer(
        self,
        document_id: int,
        customer_id: str,
    ) -> Document | None:
        result = await self.db.execute(
            select(Document).where(
                Document.id == document_id,
                Document.customer_id == customer_id,
            )
        )
        return result.scalars().first()

    async def list_documents_for_customer(
        self,
        customer_id: str,
    ) -> list[tuple[Document, int]]:
        chunk_count = func.count(DocumentChunk.id).label("chunk_count")
        result = await self.db.execute(
            select(Document, chunk_count)
            .outerjoin(DocumentChunk, DocumentChunk.document_id == Document.id)
            .where(Document.customer_id == customer_id)
            .group_by(Document.id)
            .order_by(Document.id.desc())
        )
        return [(row[0], int(row[1] or 0)) for row in result.all()]

    async def get_by_customer_and_name(
        self,
        customer_id: str,
        name: str,
    ) -> Document | None:
        result = await self.db.execute(
            select(Document).where(
                Document.customer_id == customer_id,
                Document.name == name,
            )
        )
        return result.scalars().first()

    async def delete_by_customer_and_name(
        self,
        customer_id: str,
        name: str,
    ) -> None:
        await self.db.execute(
            delete(Document).where(
                Document.customer_id == customer_id,
                Document.name == name,
            )
        )

    async def delete_by_id_for_customer(
        self,
        document_id: int,
        customer_id: str,
    ) -> bool:
        result = await self.db.execute(
            delete(Document).where(
                Document.id == document_id,
                Document.customer_id == customer_id,
            )
        )
        return (result.rowcount or 0) > 0

    async def create_document(
        self,
        *,
        customer_id: str,
        name: str,
        document_type: DocumentType,
    ) -> Document:
        doc = Document(
            customer_id=customer_id,
            name=name,
            document_type=document_type,
        )
        self.db.add(doc)
        await self.db.flush()
        return doc

    async def add_chunks(
        self,
        chunks: Sequence[DocumentChunk],
    ) -> None:
        self.db.add_all(list(chunks))
        await self.db.flush()

    async def list_chunks_for_customer(
        self,
        customer_id: str,
    ) -> list[DocumentChunk]:
        result = await self.db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.customer_id == customer_id)
            .order_by(DocumentChunk.id)
        )
        return list(result.scalars().all())

    async def count_chunks_for_customer(self, customer_id: str) -> int:
        result = await self.db.execute(
            select(DocumentChunk.id).where(
                DocumentChunk.customer_id == customer_id
            )
        )
        return len(result.all())
