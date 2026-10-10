from enum import Enum
from typing import Any, cast

from pydantic_ai import Agent, UseEnumMemberDocstrings
from pydantic_ai.settings import ModelSettings

from ai.runtime.model import build_model_settings, build_router_model
from core.config import get_settings


class SupportRoute(str, UseEnumMemberDocstrings, Enum):
    """Kullanıcı mesajını hangi destek alanına yönlendirelim?"""

    general = "general"
    """Selamlama, teşekkür, veda veya net bir destek işi yok."""

    order = "order"
    """Sipariş listesi, durum, iptal veya sipariş seçimi."""

    payment = "payment"
    """Ödeme listesi, durum veya sipariş için ödeme."""

    both = "both"
    """Aynı mesajda hem sipariş hem ödeme."""

    research = "research"
    """Ürün araştırması, karşılaştırma veya web araması (sipariş ürünü dahil)."""

    rag = "rag"
    """Mağaza politikası / iade / kargo / garanti / SSS (belgeler)."""


# LLM + graph string karşılaştırmaları için
Route = SupportRoute

_settings = get_settings()

_router_settings: dict[str, Any] = {
    **dict(build_model_settings(temperature=_settings.ROUTER_TEMPERATURE)),
    "decision_route_threshold": _settings.TYPESAFE_ROUTER_MIN_CONFIDENCE,
}

router_agent = Agent(
    build_router_model(),
    name="router_agent",
    output_type=SupportRoute,
    model_settings=cast(ModelSettings, _router_settings),
    retries=_settings.AGENT_RETRIES,
    instructions=(
        "Tek route seç.\n"
        "Takip cevabı (numara/sıra/ürün): önceki domain (order|payment|rag).\n"
        "Belirsizlikte: general > order|payment > both > rag > research."
    ),
)
