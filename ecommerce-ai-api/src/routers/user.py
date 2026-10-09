from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from api_schemas.auth.user import UserCleanupResponse, UserCreate, UserResponse
from deps.admin_security import admin_security_check
from deps.db import get_db
from deps.rate_limit import admin_bootstrap_rate_limit, api_rate_limit
from deps.require_admin import require_admin
from enums.auth import UserRole
from services.auth.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(db=db)


@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    role: Optional[UserRole] = Query(
        None,
        description="Verilirse yalnızca bu role sahip kullanıcılar döner.",
    ),
    svc: UserService = Depends(get_user_service),
    _: UserResponse = Depends(require_admin),
    __: None = Depends(api_rate_limit("user_list")),
):
    """Kullanıcıları listele - sadece admin; opsiyonel role filtresi."""
    return await svc.get_all_users(role=role)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    svc: UserService = Depends(get_user_service),
    _: UserResponse = Depends(require_admin),
    __: None = Depends(api_rate_limit("user_create")),
):
    """Yeni panel kullanıcısı oluştur (role=user) — sadece admin."""
    return await svc.create_user(user_data)


@router.post("/admin", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(
    user_data: UserCreate,
    svc: UserService = Depends(get_user_service),
    _: bool = Depends(admin_security_check),
    __: None = Depends(admin_bootstrap_rate_limit()),
):
    """Yeni panel admin oluşturma (X-Admin-Key + IP + ADMIN_ENABLED)."""
    return await svc.create_admin(user_data)


@router.put("/{user_id}/toggle-active", response_model=UserResponse)
async def toggle_user_active(
    user_id: int,
    svc: UserService = Depends(get_user_service),
    _: UserResponse = Depends(require_admin),
    __: None = Depends(api_rate_limit("user_toggle_active")),
):
    """Kullanıcı aktiflik durumunu tersine çevir - sadece admin"""
    return await svc.toggle_user_active(user_id)


@router.post(
    "/cleanup",
    response_model=UserCleanupResponse,
    status_code=status.HTTP_200_OK,
)
async def cleanup_users(
    confirm: bool = Query(
        False,
        description="Toplu silmeyi onaylamak için true gönderin.",
    ),
    ids: Optional[List[int]] = Query(
        None,
        max_length=500,
        description="Silinecek kullanıcı id listesi; verilmezse giriş yapan admin hariç tüm kullanıcılar silinir.",
    ),
    svc: UserService = Depends(get_user_service),
    current_user: UserResponse = Depends(require_admin),
    _: None = Depends(api_rate_limit("user_cleanup")),
):
    """Admin: panel kullanıcılarını toplu siler (oturum açmış admin silinmez)."""
    return await svc.cleanup_all(current_user, user_ids=ids, confirm=confirm)
