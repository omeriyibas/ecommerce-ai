from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.order import Order


class OrderRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_by_user(self, user_id: int) -> list[Order]:
        stmt = (
            select(Order)
            .options(selectinload(Order.product))
            .where(Order.user_id == user_id)
            .order_by(Order.id)
        )
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def list_without_payment(self, user_id: int | None = None) -> list[Order]:
        from models.payment import Payment

        stmt = (
            select(Order)
            .options(selectinload(Order.product))
            .outerjoin(Payment, Payment.order_id == Order.id)
            .where(Payment.id.is_(None))
            .order_by(Order.id)
        )
        if user_id is not None:
            stmt = stmt.where(Order.user_id == user_id)
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id_for_user(self, user_id: int, order_id: int) -> Order | None:
        stmt = (
            select(Order)
            .options(selectinload(Order.product))
            .where(
                Order.id == order_id,
                Order.user_id == user_id,
            )
        )
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_latest_for_user(self, user_id: int) -> Order | None:
        stmt = (
            select(Order)
            .options(selectinload(Order.product))
            .where(Order.user_id == user_id)
            .order_by(Order.id.desc())
            .limit(1)
        )
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()


    async def create(
        self,
        *,
        user_id: int,
        product_id: int,
        status: str = 'pending',
    ) -> Order:
        row = Order(user_id=user_id, product_id=product_id, status=status)
        self._db.add(row)
        await self._db.commit()
        await self._db.refresh(row)
        # relationship yükle
        return await self.get_by_id_for_user(user_id, row.id) or row

    async def cancel(self, user_id: int, order_id: int) -> Order | None:
        row = await self.get_by_id_for_user(user_id, order_id)
        if row is None:
            return None
        row.status = "cancelled"
        await self._db.commit()
        await self._db.refresh(row)
        return row

    async def update(
        self,
        user_id: int,
        order_id: int,
        *,
        product_id: int,
        status: str,
    ) -> Order | None:
        row = await self.get_by_id_for_user(user_id, order_id)
        if row is None:
            return None
        row.product_id = product_id
        row.status = status
        await self._db.commit()
        await self._db.refresh(row)
        return await self.get_by_id_for_user(user_id, order_id)

    async def delete(self, user_id: int, order_id: int) -> bool:
        row = await self.get_by_id_for_user(user_id, order_id)
        if row is None:
            return False
        await self._db.delete(row)
        await self._db.commit()
        return True
