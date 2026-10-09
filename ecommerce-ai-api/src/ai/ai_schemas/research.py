from pydantic import BaseModel, Field


class OrderProductInfo(BaseModel):
    order_id: int
    product_id: int
    name: str
    price: float
    description: str


class ProductResearchReply(BaseModel):
    message: str = Field(description='Ürün araştırması özeti, Türkçe')
    order_id: int | None = Field(
        default=None,
        ge=1,
        description='Araştırmanın dayandığı sipariş numarası (varsa)',
    )
    product_name: str = Field(
        default='',
        description='Araştırılan ürün adı (varsa)',
    )
    sources: list[str] = Field(
        default_factory=list,
        description='Kullanılan web kaynak URL’leri (http/https)',
    )

