"""CLI — PDF ingest → Postgres → hybrid RAG sohbet (rag-example ile aynı akış)."""

import asyncio
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

load_dotenv(ROOT / ".env")

from ai.agents.rag import get_rag_agent  # noqa: E402
from ai.deps import AppDeps  # noqa: E402
from ai.runtime.observability import setup_logfire  # noqa: E402
from core.config import get_settings  # noqa: E402
from core.database import AsyncSessionLocal, init_models  # noqa: E402
from enums.document import DocumentType  # noqa: E402
from services.order_service import OrderService  # noqa: E402
from services.payment_service import PaymentService  # noqa: E402
from services.product_service import ProductService  # noqa: E402
from services.rag_service import RagService  # noqa: E402

setup_logfire()
_settings = get_settings()

_DOC_TYPES = ", ".join(t.value for t in DocumentType)


def _ask_document_type() -> DocumentType:
    raw = input(f"document_type [{_DOC_TYPES}]: ").strip().lower()
    if not raw:
        return DocumentType.genel
    try:
        return DocumentType(raw)
    except ValueError as exc:
        raise ValueError(
            f"Geçersiz document_type: {raw!r}. Seçenekler: {_DOC_TYPES}"
        ) from exc


async def main() -> None:
    await init_models(create=True)

    customer_id = input("customer_id: ").strip()
    if not customer_id:
        raise ValueError("customer_id boş olamaz.")

    pdf_path = Path(_settings.RAG_PDF_PATH)
    if not pdf_path.is_file():
        raise FileNotFoundError(f"PDF bulunamadı: {pdf_path}")

    async with AsyncSessionLocal() as db:
        rag = RagService(db)
        existing = await rag.repo.count_chunks_for_customer(customer_id)

        if existing == 0:
            document_type = _ask_document_type()
            print("PDF işleniyor, embedding'ler DB'ye yazılıyor...")
            n = await rag.ingest_pdf(
                path=pdf_path,
                customer_id=customer_id,
                document_type=document_type,
            )
            print(
                f"{n} chunk DB'ye kaydedildi. "
                f"({customer_id}, type={document_type.value})"
            )
        else:
            print(
                f"DB'de {existing} chunk var; yeniden ingest için 'r' yaz, "
                "devam için Enter."
            )
            choice = input("> ").strip().lower()
            if choice == "r":
                document_type = _ask_document_type()
                print("PDF yeniden işleniyor...")
                n = await rag.ingest_pdf(
                    path=pdf_path,
                    customer_id=customer_id,
                    document_type=document_type,
                    replace=True,
                )
                print(
                    f"{n} chunk DB'ye kaydedildi. "
                    f"({customer_id}, type={document_type.value})"
                )

        print("Index DB'den yükleniyor...")
        index = await rag.load_index(customer_id)
        print(f"{len(index.chunks)} chunk hazır. Çıkmak için q yaz.")

        deps = AppDeps(
            order_service=OrderService(db),
            payment_service=PaymentService(db),
            product_service=ProductService(db),
            user_id=_settings.DEFAULT_USER_ID,
            customer_id=customer_id,
            rag_service=rag,
            rag_index=index,
        )
        history = []

        while True:
            question = input("\nSen: ").strip()
            if question.lower() == "q":
                break
            if not question:
                continue

            result = await get_rag_agent().run(
                question,
                deps=deps,
                message_history=history,
            )
            history = result.all_messages()
            print(f"\nAsistan: {result.output.answer}")


if __name__ == "__main__":
    asyncio.run(main())
