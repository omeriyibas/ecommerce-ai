from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.payment import Payment


class PaymentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_by_user(self, user_id: int) -> list[Payment]:
        stmt = (
            select(Payment)
            .where(Payment.user_id == user_id)
            .order_by(Payment.id)
        )
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id_for_user(
        self,
        user_id: int,
        payment_id: int,
    ) -> Payment | None:
        stmt = select(Payment).where(
            Payment.user_id == user_id,
            Payment.id == payment_id,
        )
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_order_for_user(
        self,
        user_id: int,
        order_id: int,
    ) -> Payment | None:
        stmt = select(Payment).where(
            Payment.user_id == user_id,
            Payment.order_id == order_id,
        )
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        order_id: int,
        user_id: int,
        amount: float,
        status: str = "pending",
    ) -> Payment:
        row = Payment(
            order_id=order_id,
            user_id=user_id,
            amount=amount,
            status=status,
        )
        self._db.add(row)
        await self._db.commit()
        await self._db.refresh(row)
        return row

    async def update(
        self,
        user_id: int,
        payment_id: int,
        *,
        order_id: int,
        amount: float,
        status: str,
    ) -> Payment | None:
        row = await self.get_by_id_for_user(user_id, payment_id)
        if row is None:
            return None
        row.order_id = order_id
        row.amount = amount
        row.status = status
        await self._db.commit()
        await self._db.refresh(row)
        return row

    async def delete(self, user_id: int, payment_id: int) -> bool:
        row = await self.get_by_id_for_user(user_id, payment_id)
        if row is None:
            return False
        await self._db.delete(row)
        await self._db.commit()
        return True
