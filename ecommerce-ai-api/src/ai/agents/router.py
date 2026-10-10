from typing import Literal

from pydantic_ai import Agent

from ai.runtime.model import build_model, build_model_settings
from core.config import get_settings

Route = Literal["order", "payment", "both", "research", "rag", "general"]

_settings = get_settings()

router_agent = Agent(
    build_model(),
    name="router_agent",
    output_type=Route,
    model_settings=build_model_settings(
        temperature=_settings.ROUTER_TEMPERATURE,
    ),
    retries=_settings.AGENT_RETRIES,
    instructions=(
        "Tek route seç: general | order | payment | both | research | rag.\n"
        "general: selam/teşekkür/vedalaşma veya net işlem yok.\n"
        "rag: mağaza politikası/iade/kargo/garanti/belge sorusu.\n"
        "research: açıkça ürün araştırma/karşılaştırma/web bilgisi "
        "(siparişteki ürünü araştır dahil). Selam research değil.\n"
        "order: sipariş liste/durum/iptal. payment: ödeme liste/durum/öde. "
        "both: ikisi birden.\n"
        "Takip cevabı (numara/sıra/ürün): önceki domain (order|payment|rag).\n"
        "Belirsizlikte: general > order|payment > both > rag > research."
    ),
)
