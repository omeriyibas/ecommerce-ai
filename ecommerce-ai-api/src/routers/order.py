from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from api_schemas.auth.user import UserResponse
from api_schemas.order import (
    OrderCreateRequest,
    OrderResponse,
    OrderUpdateRequest,
)
from deps.auth import get_current_user
from deps.db import get_db
from deps.rate_limit import api_rate_limit
from services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["orders"])


def get_order_service(db: AsyncSession = Depends(get_db)) -> OrderService:
    return OrderService(db=db)


@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    svc: OrderService = Depends(get_order_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("order_list")),
):
    """Giriş yapan kullanıcının siparişleri."""
    return await svc.list_orders(current_user.id)


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    body: OrderCreateRequest,
    svc: OrderService = Depends(get_order_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("order_create")),
):
    """Yeni sipariş oluştur — user_id JWT'den."""
    return await svc.create_order(
        user_id=current_user.id,
        product_id=body.product_id,
        status=body.status,
    )


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    body: OrderUpdateRequest,
    svc: OrderService = Depends(get_order_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("order_update")),
):
    """Sipariş güncelle — yalnızca kendi siparişi."""
    return await svc.update_order(
        current_user.id,
        order_id,
        product_id=body.product_id,
        status=body.status,
    )


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    svc: OrderService = Depends(get_order_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("order_delete")),
):
    """Sipariş sil — yalnızca kendi siparişi."""
    await svc.delete_order(current_user.id, order_id)
