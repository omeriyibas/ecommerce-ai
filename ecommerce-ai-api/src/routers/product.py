from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from api_schemas.auth.user import UserResponse
from api_schemas.product import ProductCreate, ProductResponse
from deps.auth import get_current_user
from deps.db import get_db
from deps.rate_limit import api_rate_limit
from services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["products"])


def get_product_service(db: AsyncSession = Depends(get_db)) -> ProductService:
    return ProductService(db=db)


@router.get("/", response_model=List[ProductResponse])
async def list_products(
    svc: ProductService = Depends(get_product_service),
    _: UserResponse = Depends(get_current_user),
    __: None = Depends(api_rate_limit("product_list")),
):
    """Ürün kataloğunu listele — giriş yapmış kullanıcılar."""
    return await svc.list_products()


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreate,
    svc: ProductService = Depends(get_product_service),
    _: UserResponse = Depends(get_current_user),
    __: None = Depends(api_rate_limit("product_create")),
):
    """Yeni ürün ekle — giriş yapmış kullanıcılar."""
    return await svc.create_product(
        name=body.name,
        price=body.price,
        description=body.description,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    svc: ProductService = Depends(get_product_service),
    _: UserResponse = Depends(get_current_user),
    __: None = Depends(api_rate_limit("product_get")),
):
    """Tek ürün detayı — giriş yapmış kullanıcılar."""
    product = await svc.get_product(product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ürün bulunamadı",
        )
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    body: ProductCreate,
    svc: ProductService = Depends(get_product_service),
    _: UserResponse = Depends(get_current_user),
    __: None = Depends(api_rate_limit("product_update")),
):
    """Ürün güncelle — giriş yapmış kullanıcılar."""
    return await svc.update_product(
        product_id,
        name=body.name,
        price=body.price,
        description=body.description,
    )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    svc: ProductService = Depends(get_product_service),
    _: UserResponse = Depends(get_current_user),
    __: None = Depends(api_rate_limit("product_delete")),
):
    """Ürün sil — giriş yapmış kullanıcılar."""
    await svc.delete_product(product_id)
