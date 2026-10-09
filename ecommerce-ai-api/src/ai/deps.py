from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from services.order_service import OrderService
from services.payment_service import PaymentService
from services.product_service import ProductService


@dataclass
class AppDeps:
    order_service: OrderService
    payment_service: PaymentService
    product_service: ProductService
    user_id: int
    #: HTTP/panel: deferred tool onayı (None → CLI stdin, eğer defer_approvals değilse)
    approve_deferred: Callable[[Any], bool] | None = field(default=None)
    #: True → onay çözülmez; DeferredToolRequests caller’a döner (panel kuyruğu)
    defer_approvals: bool = False


# Geriye dönük isim
OrderDeps = AppDeps
