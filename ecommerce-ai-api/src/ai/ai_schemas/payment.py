from pydantic import BaseModel, Field

from api_schemas.support_views import OrderChoice, PaymentStatusView


class PaymentReply(BaseModel):
    message: str = Field(description="Türkçe kısa yanıt; listeyi satır satır yazma")
    items: list[PaymentStatusView] = Field(
        default_factory=list,
        description="list_payment_statuses sonucu; değilse boş",
    )
    unpaid_orders: list[OrderChoice] = Field(
        default_factory=list,
        description="list_unpaid_order_choices sonucu; değilse boş",
    )
