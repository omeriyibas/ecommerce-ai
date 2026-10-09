from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from api_schemas.approval import ApprovalListResponse, ApprovalResolveResponse
from api_schemas.auth.user import UserResponse
from api_schemas.support import (
    SupportChatRequest,
    SupportChatResponse,
    SupportConversationCreateResponse,
    SupportConversationListResponse,
    SupportHistoryResponse,
)
from deps.auth import get_current_user
from deps.db import get_db
from deps.rate_limit import api_rate_limit
from services.approval_service import ApprovalService
from services.support_service import SupportService

router = APIRouter(prefix="/support", tags=["support"])


def get_support_service(db: AsyncSession = Depends(get_db)) -> SupportService:
    return SupportService(db=db)


def get_approval_service(db: AsyncSession = Depends(get_db)) -> ApprovalService:
    return ApprovalService(db=db)


@router.get("/conversations", response_model=SupportConversationListResponse)
async def list_conversations(
    svc: SupportService = Depends(get_support_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("support_list")),
):
    """Kullanıcının sohbet listesi."""
    conversations = await svc.list_conversations(user_id=current_user.id)
    return SupportConversationListResponse(conversations=conversations)


@router.post(
    "/conversations",
    response_model=SupportConversationCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    svc: SupportService = Depends(get_support_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("support_create")),
):
    """Yeni sohbet kaydı oluştur."""
    conversation_id = await svc.create_conversation(user_id=current_user.id)
    return SupportConversationCreateResponse(conversation_id=conversation_id)


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_conversation(
    conversation_id: str,
    svc: SupportService = Depends(get_support_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("support_delete")),
):
    """Sohbeti ve mesajlarını sil — yalnızca kendi sohbeti."""
    await svc.delete_conversation(
        user_id=current_user.id,
        conversation_id=conversation_id,
    )


@router.get("/approvals", response_model=ApprovalListResponse)
async def list_approvals(
    svc: ApprovalService = Depends(get_approval_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("support_approvals_list")),
):
    """Onay bekleyen işlemler."""
    approvals = await svc.list_pending(user_id=current_user.id)
    return ApprovalListResponse(approvals=approvals)


@router.post(
    "/approvals/{approval_id}/approve",
    response_model=ApprovalResolveResponse,
)
async def approve_action(
    approval_id: str,
    svc: ApprovalService = Depends(get_approval_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("support_approvals_resolve")),
):
    """Bekleyen tool çağrısını onayla; batch tamamsa işlemi çalıştır."""
    return await svc.resolve(
        user_id=current_user.id,
        approval_id=approval_id,
        approved=True,
    )


@router.post(
    "/approvals/{approval_id}/reject",
    response_model=ApprovalResolveResponse,
)
async def reject_action(
    approval_id: str,
    svc: ApprovalService = Depends(get_approval_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("support_approvals_resolve")),
):
    """Bekleyen tool çağrısını reddet."""
    return await svc.resolve(
        user_id=current_user.id,
        approval_id=approval_id,
        approved=False,
    )


@router.post("/chat", response_model=SupportChatResponse)
async def support_chat(
    body: SupportChatRequest,
    svc: SupportService = Depends(get_support_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("support_chat")),
):
    """Destek asistanına mesaj gönder — giriş yapmış kullanıcı."""
    return await svc.chat(
        user_id=current_user.id,
        message=body.message,
        conversation_id=body.conversation_id,
    )


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=SupportHistoryResponse,
)
async def support_history(
    conversation_id: str,
    svc: SupportService = Depends(get_support_service),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("support_history")),
):
    """Konuşma geçmişini getir — yalnızca kendi sohbeti."""
    messages = await svc.get_history(
        user_id=current_user.id,
        conversation_id=conversation_id,
    )
    return SupportHistoryResponse(
        conversation_id=conversation_id,
        messages=messages,
    )
