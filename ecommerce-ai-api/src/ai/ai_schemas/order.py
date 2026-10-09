from pydantic import BaseModel, Field

from api_schemas.support_views import OrderChoice


class OrderReply(BaseModel):
    message: str = Field(description="Türkçe kısa yanıt; listeyi satır satır yazma")
    items: list[OrderChoice] = Field(
        default_factory=list,
        description="list_order_choices sonucu; değilse boş",
    )
