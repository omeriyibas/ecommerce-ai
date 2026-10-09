from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

PaymentStatus = Literal["pending", "paid", "failed", "refunded"]


class PaymentCreate(BaseModel):
    """Seed / iç kullanım — user_id ve amount açık."""

    order_id: int = Field(..., ge=1)
    user_id: int = Field(..., ge=1)
    amount: float = Field(..., gt=0)
    status: PaymentStatus = "pending"


class PaymentCreateRequest(BaseModel):
    """Panel ödeme oluşturma — tutar sipariş ürününden alınır."""

    order_id: int = Field(..., ge=1)
    status: PaymentStatus = "pending"


class PaymentUpdateRequest(BaseModel):
    """Panel ödeme güncelleme — tutar sipariş ürününden alınır."""

    order_id: int = Field(..., ge=1)
    status: PaymentStatus = "pending"


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    user_id: int
    amount: float
    status: str

    model_config = ConfigDict(from_attributes=True)
