from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from api_schemas.product import ProductResponse
from mappers.product import product_to_response
from repositories.product_repository import ProductRepository


class ProductService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = ProductRepository(db)

    async def list_products(self) -> list[ProductResponse]:
        rows = await self._repo.list_all()
        return [product_to_response(row) for row in rows]

    async def get_product(self, product_id: int) -> ProductResponse | None:
        row = await self._repo.get_by_id(product_id)
        if row is None:
            return None
        return product_to_response(row)

    async def create_product(
        self,
        *,
        name: str,
        price: float,
        description: str = "",
    ) -> ProductResponse:
        existing = await self._repo.get_by_name(name)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Bu isimde ürün zaten var",
            )
        row = await self._repo.create(
            name=name,
            price=price,
            description=description,
        )
        return product_to_response(row)

    async def update_product(
        self,
        product_id: int,
        *,
        name: str,
        price: float,
        description: str = "",
    ) -> ProductResponse:
        existing = await self._repo.get_by_name(name)
        if existing is not None and existing.id != product_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Bu isimde ürün zaten var",
            )
        row = await self._repo.update(
            product_id,
            name=name,
            price=price,
            description=description,
        )
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ürün bulunamadı",
            )
        return product_to_response(row)

    async def delete_product(self, product_id: int) -> None:
        deleted = await self._repo.delete(product_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ürün bulunamadı",
            )
