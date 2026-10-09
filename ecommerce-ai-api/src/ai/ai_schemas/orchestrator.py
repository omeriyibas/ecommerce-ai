from pydantic import BaseModel, Field

from api_schemas.support_views import OrderChoice, PaymentStatusView


class OrchestratorReply(BaseModel):
    message: str = Field(description="Kullanıcıya Türkçe yanıt")
    order_items: list[OrderChoice] = Field(
        default_factory=list,
        description="Sohbet UI için sipariş satırları",
    )
    payment_items: list[PaymentStatusView] = Field(
        default_factory=list,
        description="Sohbet UI için ödeme satırları",
    )
