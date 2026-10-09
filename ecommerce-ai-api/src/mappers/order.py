"""Order: ORM → API response."""

from api_schemas.order import OrderResponse
from models.order import Order


def order_to_response(row: Order) -> OrderResponse:
    product = row.product
    return OrderResponse(
        id=row.id,
        user_id=row.user_id,
        product_id=row.product_id,
        product=product.name if product is not None else "",
        amount=float(product.price) if product is not None else 0.0,
        status=row.status,
    )
