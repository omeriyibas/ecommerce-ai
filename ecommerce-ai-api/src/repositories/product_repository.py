from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from models.product import Product


class ProductRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_all(self) -> list[Product]:
        result = await self._db.execute(select(Product).order_by(Product.id))
        return list(result.scalars().all())

    async def get_by_id(self, product_id: int) -> Product | None:
        result = await self._db.execute(
            select(Product).where(Product.id == product_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Product | None:
        result = await self._db.execute(
            select(Product).where(Product.name == name)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        name: str,
        price: float,
        description: str = "",
    ) -> Product:
        row = Product(name=name, price=price, description=description)
        self._db.add(row)
        await self._db.commit()
        await self._db.refresh(row)
        return row

    async def update(
        self,
        product_id: int,
        *,
        name: str,
        price: float,
        description: str = "",
    ) -> Product | None:
        row = await self.get_by_id(product_id)
        if row is None:
            return None
        row.name = name
        row.price = price
        row.description = description
        await self._db.commit()
        await self._db.refresh(row)
        return row

    async def delete(self, product_id: int) -> bool:
        row = await self.get_by_id(product_id)
        if row is None:
            return False
        try:
            await self._db.delete(row)
            await self._db.commit()
        except IntegrityError as e:
            await self._db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Ürün silinemedi; bağlı siparişler olabilir.",
            ) from e
        return True
