from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

OrderStatus = Literal["pending", "shipped", "delivered", "cancelled"]


class OrderCreate(BaseModel):
    """Seed / iç kullanım — user_id açık."""

    user_id: int = Field(..., ge=1)
    product_id: int = Field(..., ge=1)
    status: OrderStatus = "pending"


class OrderCreateRequest(BaseModel):
    """Panel sipariş oluşturma — user_id JWT'den alınır."""

    product_id: int = Field(..., ge=1)
    status: OrderStatus = "pending"


class OrderUpdateRequest(BaseModel):
    """Panel sipariş güncelleme."""

    product_id: int = Field(..., ge=1)
    status: OrderStatus = "pending"


class OrderResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    product: str
    amount: float = Field(..., description="Ürün fiyatı (sipariş tutarı)")
    status: str

    model_config = ConfigDict(from_attributes=True)
