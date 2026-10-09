from fastapi import APIRouter, Body, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth_cookies import (
    clear_refresh_cookie,
    is_refresh_persistent,
    resolve_refresh_token,
    set_refresh_cookie,
)
from core.client_ip import get_client_ip
from deps.auth import get_current_user
from deps.db import get_db
from api_schemas.auth.change_password import ChangePasswordRequest
from api_schemas.auth.forgot_password import ForgotPasswordRequest, ForgotPasswordResponse
from api_schemas.auth.token import LogoutResponse, Token, TokenResult
from deps.rate_limit import (
    api_rate_limit,
    auth_forgot_password_rate_limit,
    auth_login_rate_limit,
)
from api_schemas.auth.user import (
    UserResponse,
    UserWithEmail,
    LoginResponse,
)
from services.auth.auth_service import (
    logout_all_refresh_tokens,
    logout_refresh_token,
    rotate_refresh_token,
)
from services.auth.user_service import UserService


router = APIRouter(prefix="/auth", tags=["users"])


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(db=db)


@router.post("/login")
async def login(
    user: UserWithEmail,
    request: Request,
    response: Response,
    svc: UserService = Depends(get_user_service),
    _: None = Depends(auth_login_rate_limit()),
):
    client_ip = get_client_ip(request) or "unknown"
    result = await svc.login(user, client_ip=client_ip)
    set_refresh_cookie(
        response,
        result.token.refresh_token,
        persistent=bool(user.remember_me),
    )
    return LoginResponse(user=result.user, token=result.token)


@router.post("/refresh", response_model=TokenResult)
async def refresh_token(
    request: Request,
    response: Response,
    token: Token = Body(default_factory=Token),
    _: None = Depends(api_rate_limit("auth_refresh")),
):
    raw = resolve_refresh_token(request, body_refresh=token.refresh_token)
    result = await rotate_refresh_token(raw)
    # Body refresh (mobile): kalıcı cookie harmless; panel cookie: persist flag korunur
    persistent = (
        True
        if (token.refresh_token or "").strip()
        else is_refresh_persistent(request)
    )
    set_refresh_cookie(response, result.refresh_token, persistent=persistent)
    return result


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    request: Request,
    response: Response,
    token: Token = Body(default_factory=Token),
    _: None = Depends(api_rate_limit("auth_logout")),
):
    """Mevcut refresh oturumunu sonlandırır."""
    raw = resolve_refresh_token(request, body_refresh=token.refresh_token)
    await logout_refresh_token(raw)
    clear_refresh_cookie(response)
    return LogoutResponse(message="Oturum sonlandırıldı")


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    svc: UserService = Depends(get_user_service),
    _: None = Depends(auth_forgot_password_rate_limit()),
):
    await svc.forgot_password(str(body.email))
    return ForgotPasswordResponse(
        message="Kayıtlı bir hesap varsa şifre sıfırlama e-postası gönderildi.",
    )


@router.post("/change-password", response_model=LogoutResponse)
async def change_password(
    body: ChangePasswordRequest,
    response: Response,
    user: UserResponse = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
    _: None = Depends(api_rate_limit("auth_change_password")),
):
    """Şifreyi günceller ve tüm cihazlardaki oturumları sonlandırır."""
    revoked = await svc.change_password(user, body)
    clear_refresh_cookie(response)
    return LogoutResponse(
        message="Şifre güncellendi; tüm oturumlar sonlandırıldı",
        revoked_sessions=revoked,
    )


@router.post("/logout-all", response_model=LogoutResponse)
async def logout_all(
    response: Response,
    user=Depends(get_current_user),
    _: None = Depends(api_rate_limit("auth_logout_all")),
):
    """Tüm cihazlardaki refresh oturumlarını iptal eder."""
    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    revoked = await logout_all_refresh_tokens(user.id, role)
    clear_refresh_cookie(response)
    return LogoutResponse(
        message="Tüm oturumlar sonlandırıldı",
        revoked_sessions=revoked,
    )


@router.get("/me", response_model=UserResponse)
def me(
    user=Depends(get_current_user),
    _: None = Depends(api_rate_limit("auth_me")),
):
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
    )
