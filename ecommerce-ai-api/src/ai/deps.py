from collections.abc import Callable
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from services.order_service import OrderService
from services.payment_service import PaymentService
from services.product_service import ProductService

if TYPE_CHECKING:
    from services.rag_service import RagIndex, RagService


@dataclass
class AppDeps:
    order_service: OrderService
    payment_service: PaymentService
    product_service: ProductService
    user_id: int
    customer_id: str | None = None
    rag_service: "RagService | None" = None
    rag_index: "RagIndex | None" = None
    #: HTTP/panel: deferred tool onayı (None → CLI stdin, eğer defer_approvals değilse)
    approve_deferred: Callable[[Any], bool] | None = field(default=None)
    #: True → onay çözülmez; DeferredToolRequests caller’a döner (panel kuyruğu)
    defer_approvals: bool = False


# Geriye dönük isim
OrderDeps = AppDeps
