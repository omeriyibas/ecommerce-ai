"""Destek asistanı tool çıktıları — dar alanlar."""

from pydantic import BaseModel, Field


class OrderChoice(BaseModel):
    """Liste / seçim — durum yok."""

    id: int
    product: str
    amount: float


class OrderStatusView(BaseModel):
    """Durum / iptal sonucu."""

    id: int
    product: str
    status: str


class PaymentStatusView(BaseModel):
    """Ödeme durumu — tutar / ödeme id yok."""

    order_id: int
    product: str = Field(default="", description="Siparişteki ürün adı")
    status: str
