from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from enums.document import DocumentType


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    #: Yükleme anında belirlenir; chunk'lara kopyalanır.
    document_type: Mapped[DocumentType] = mapped_column(
        String(32),
        nullable=False,
        default=DocumentType.genel,
        index=True,
    )

    chunks: Mapped[list["DocumentChunk"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
    )


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    customer_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    document_type: Mapped[DocumentType] = mapped_column(
        String(32),
        nullable=False,
        default=DocumentType.genel,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    #: text-embedding-3-small → 1536 float; hybrid arama için DB'de saklanır
    embedding: Mapped[list[float]] = mapped_column(ARRAY(Float), nullable=False)

    document: Mapped[Document] = relationship(back_populates="chunks")
