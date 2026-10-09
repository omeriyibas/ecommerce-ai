from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import HTTP_404_NOT_FOUND

from api_schemas.order import OrderResponse
from api_schemas.support_views import OrderChoice, OrderStatusView
from mappers.order import order_to_response
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository


class OrderService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = OrderRepository(db)
        self._products = ProductRepository(db)

    @staticmethod
    def _to_choice(order: OrderResponse) -> OrderChoice:
        return OrderChoice(
            id=order.id,
            product=order.product,
            amount=order.amount,
        )

    @staticmethod
    def _to_status(order: OrderResponse) -> OrderStatusView:
        return OrderStatusView(
            id=order.id,
            product=order.product,
            status=order.status,
        )

    async def list_orders(self, user_id: int) -> list[OrderResponse]:
        rows = await self._repo.list_by_user(user_id)
        return [order_to_response(row) for row in rows]

    async def list_order_choices(self, user_id: int) -> list[OrderChoice]:
        orders = await self.list_orders(user_id)
        return [self._to_choice(o) for o in orders]

    async def list_unpaid_order_choices(self, user_id: int) -> list[OrderChoice]:
        orders = await self.list_orders_without_payment(user_id=user_id)
        return [self._to_choice(o) for o in orders]

    async def get_order_status(
        self,
        user_id: int,
        order_id: int,
    ) -> OrderStatusView | None:
        order = await self.get_order(user_id, order_id)
        if order is None:
            return None
        return self._to_status(order)

    async def get_latest_order_status(
        self,
        user_id: int,
    ) -> OrderStatusView | None:
        order = await self.get_latest_order(user_id)
        if order is None:
            return None
        return self._to_status(order)

    async def cancel_order_status(
        self,
        user_id: int,
        order_id: int,
    ) -> OrderStatusView | None:
        order = await self.cancel_order(user_id, order_id)
        if order is None:
            return None
        return self._to_status(order)

    async def list_orders_without_payment(
        self,
        user_id: int | None = None,
    ) -> list[OrderResponse]:
        rows = await self._repo.list_without_payment(user_id)
        return [order_to_response(row) for row in rows]

    async def get_order(self, user_id: int, order_id: int) -> OrderResponse | None:
        row = await self._repo.get_by_id_for_user(user_id, order_id)
        if row is None:
            return None
        return order_to_response(row)

    async def get_latest_order(self, user_id: int) -> OrderResponse | None:
        row = await self._repo.get_latest_for_user(user_id)
        if row is None:
            return None
        return order_to_response(row)


    async def cancel_order(self, user_id: int, order_id: int) -> OrderResponse | None:
        row = await self._repo.cancel(user_id, order_id)
        if row is None:
            return None
        return order_to_response(row)

    async def create_order(
        self,
        *,
        user_id: int,
        product_id: int,
        status: str = "pending",
    ) -> OrderResponse:
        product = await self._products.get_by_id(product_id)
        if product is None:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="Ürün bulunamadı",
            )
        row = await self._repo.create(
            user_id=user_id,
            product_id=product_id,
            status=status,
        )
        return order_to_response(row)

    async def update_order(
        self,
        user_id: int,
        order_id: int,
        *,
        product_id: int,
        status: str,
    ) -> OrderResponse:
        product = await self._products.get_by_id(product_id)
        if product is None:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="Ürün bulunamadı",
            )
        row = await self._repo.update(
            user_id,
            order_id,
            product_id=product_id,
            status=status,
        )
        if row is None:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="Sipariş bulunamadı",
            )
        return order_to_response(row)

    async def delete_order(self, user_id: int, order_id: int) -> None:
        deleted = await self._repo.delete(user_id, order_id)
        if not deleted:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="Sipariş bulunamadı",
            )
