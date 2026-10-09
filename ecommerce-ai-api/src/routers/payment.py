from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from api_schemas.auth.user import UserResponse
from api_schemas.payment import (
    PaymentCreateRequest,
    PaymentResponse,
    PaymentUpdateRequest,
)
from deps.auth import get_current_user
from deps.db import get_db
from deps.rate_limit import api_rate_limit
from services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["payments"])


def get_payment_service(db: AsyncSession = Depends(get_db)) -> PaymentService:
    return PaymentService(db=db)


@router.get("/", response_model=List[PaymentResponse])
async def list_payments(
    svc: PaymentService = Depends(get_payment_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("payment_list")),
):
    """Giriş yapan kullanıcının ödemeleri."""
    return await svc.list_payments(current_user.id)


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    body: PaymentCreateRequest,
    svc: PaymentService = Depends(get_payment_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("payment_create")),
):
    """Yeni ödeme oluştur — user_id JWT'den."""
    return await svc.create_payment(
        order_id=body.order_id,
        user_id=current_user.id,
        status=body.status,
    )


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: int,
    body: PaymentUpdateRequest,
    svc: PaymentService = Depends(get_payment_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("payment_update")),
):
    """Ödeme güncelle — yalnızca kendi ödemesi."""
    return await svc.update_payment(
        current_user.id,
        payment_id,
        order_id=body.order_id,
        status=body.status,
    )


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(
    payment_id: int,
    svc: PaymentService = Depends(get_payment_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("payment_delete")),
):
    """Ödeme sil — yalnızca kendi ödemesi."""
    await svc.delete_payment(current_user.id, payment_id)
