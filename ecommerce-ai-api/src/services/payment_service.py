from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import HTTP_404_NOT_FOUND, HTTP_409_CONFLICT

from api_schemas.payment import PaymentResponse
from api_schemas.support_views import PaymentStatusView
from mappers.order import order_to_response
from mappers.payment import payment_to_response
from repositories.order_repository import OrderRepository
from repositories.payment_repository import PaymentRepository


class PaymentService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = PaymentRepository(db)
        self._orders = OrderRepository(db)

    @staticmethod
    def _amount_from_order(order) -> float:
        if order.product is None:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="Sipariş ürünü bulunamadı",
            )
        return float(order.product.price)

    async def list_payments(self, user_id: int) -> list[PaymentResponse]:
        rows = await self._repo.list_by_user(user_id)
        return [payment_to_response(row) for row in rows]

    async def get_by_order(
        self,
        user_id: int,
        order_id: int,
    ) -> PaymentResponse | None:
        row = await self._repo.get_by_order_for_user(user_id, order_id)
        if row is None:
            return None
        return payment_to_response(row)

    async def _status_view(
        self,
        user_id: int,
        payment: PaymentResponse,
    ) -> PaymentStatusView:
        order = await self._orders.get_by_id_for_user(user_id, payment.order_id)
        product = ""
        if order is not None:
            product = order_to_response(order).product
        return PaymentStatusView(
            order_id=payment.order_id,
            product=product,
            status=payment.status,
        )

    async def list_payment_statuses(
        self,
        user_id: int,
    ) -> list[PaymentStatusView]:
        payments = await self.list_payments(user_id)
        return [await self._status_view(user_id, p) for p in payments]

    async def get_payment_status(
        self,
        user_id: int,
        order_id: int,
    ) -> PaymentStatusView | None:
        payment = await self.get_by_order(user_id, order_id)
        if payment is None:
            return None
        return await self._status_view(user_id, payment)

    async def get_latest_payment_status(
        self,
        user_id: int,
    ) -> PaymentStatusView | None:
        order = await self._orders.get_latest_for_user(user_id)
        if order is None:
            return None
        return await self.get_payment_status(user_id, order.id)

    async def pay_for_order(
        self,
        user_id: int,
        order_id: int,
        *,
        status: str = "paid",
    ) -> PaymentStatusView:
        """Sipariş ödemesini paid yapar; kayıt yoksa oluşturur, varsa günceller."""
        order = await self._orders.get_by_id_for_user(user_id, order_id)
        if order is None:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="Sipariş bulunamadı",
            )
        existing = await self._repo.get_by_order_for_user(user_id, order_id)
        if existing is not None:
            if existing.status == status:
                return await self._status_view(
                    user_id,
                    payment_to_response(existing),
                )
            updated = await self._repo.update(
                user_id,
                existing.id,
                order_id=order_id,
                amount=self._amount_from_order(order),
                status=status,
            )
            if updated is None:
                raise HTTPException(
                    status_code=HTTP_404_NOT_FOUND,
                    detail="Ödeme bulunamadı",
                )
            return await self._status_view(user_id, payment_to_response(updated))

        payment = await self.create_payment(
            order_id=order_id,
            user_id=user_id,
            status=status,
        )
        return await self._status_view(user_id, payment)

    async def create_payment(
        self,
        *,
        order_id: int,
        user_id: int,
        amount: float | None = None,
        status: str = "pending",
    ) -> PaymentResponse:
        order = await self._orders.get_by_id_for_user(user_id, order_id)
        if order is None:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="Sipariş bulunamadı",
            )
        existing = await self._repo.get_by_order_for_user(user_id, order_id)
        if existing is not None:
            raise HTTPException(
                status_code=HTTP_409_CONFLICT,
                detail="Bu sipariş için ödeme zaten var",
            )
        resolved_amount = (
            amount if amount is not None else self._amount_from_order(order)
        )
        row = await self._repo.create(
            order_id=order_id,
            user_id=user_id,
            amount=resolved_amount,
            status=status,
        )
        return payment_to_response(row)

    async def update_payment(
        self,
        user_id: int,
        payment_id: int,
        *,
        order_id: int,
        status: str,
        amount: float | None = None,
    ) -> PaymentResponse:
        order = await self._orders.get_by_id_for_user(user_id, order_id)
        if order is None:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="Sipariş bulunamadı",
            )
        other = await self._repo.get_by_order_for_user(user_id, order_id)
        if other is not None and other.id != payment_id:
            raise HTTPException(
                status_code=HTTP_409_CONFLICT,
                detail="Bu sipariş için ödeme zaten var",
            )
        resolved_amount = (
            amount if amount is not None else self._amount_from_order(order)
        )
        row = await self._repo.update(
            user_id,
            payment_id,
            order_id=order_id,
            amount=resolved_amount,
            status=status,
        )
        if row is None:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="Ödeme bulunamadı",
            )
        return payment_to_response(row)

    async def delete_payment(self, user_id: int, payment_id: int) -> None:
        deleted = await self._repo.delete(user_id, payment_id)
        if not deleted:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="Ödeme bulunamadı",
            )
