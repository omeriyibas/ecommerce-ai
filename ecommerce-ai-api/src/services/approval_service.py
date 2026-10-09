from __future__ import annotations

import json
import logging
import uuid
from typing import Any

from fastapi import HTTPException
from pydantic_ai.messages import ModelMessage, ModelResponse, TextPart, ToolCallPart
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from api_schemas.approval import ApprovalItem, ApprovalResolveResponse
from models.tool_approval import ToolApproval
from repositories.tool_approval_repository import ToolApprovalRepository
from services.conversation_service import ConversationService
from services.order_service import OrderService
from services.payment_service import PaymentService

logger = logging.getLogger(__name__)


def _summary_for(tool_name: str, args: dict[str, Any]) -> str:
    order_id = args.get("order_id")
    if tool_name == "cancel_order":
        return f"Sipariş #{order_id} iptal" if order_id is not None else "Sipariş iptal"
    if tool_name == "pay_for_order":
        return f"Sipariş #{order_id} ödeme" if order_id is not None else "Ödeme"
    return tool_name


def _args_dict(part: ToolCallPart) -> dict[str, Any]:
    raw = part.args
    if isinstance(raw, dict):
        return dict(raw)
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {"_raw": raw}
        except json.JSONDecodeError:
            return {"_raw": raw}
    return {}


def _assistant_only(text: str) -> list[ModelMessage]:
    return [ModelResponse(parts=[TextPart(content=text)])]


class ApprovalService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = ToolApprovalRepository(db)
        self._conversations = ConversationService(db)
        self._orders = OrderService(db)
        self._payments = PaymentService(db)

    def _to_item(self, row: ToolApproval) -> ApprovalItem:
        try:
            args = json.loads(row.args_json) if row.args_json else {}
        except json.JSONDecodeError:
            args = {}
        if not isinstance(args, dict):
            args = {}
        return ApprovalItem(
            id=row.id,
            conversation_id=row.conversation_id,
            tool_name=row.tool_name,
            summary=row.summary,
            args=args,
            status=row.status,  # type: ignore[arg-type]
            created_at=row.created_at,
        )

    async def list_pending(self, user_id: int) -> list[ApprovalItem]:
        rows = await self._repo.list_pending_for_user(user_id)
        return [self._to_item(r) for r in rows]

    async def create_from_deferred(
        self,
        *,
        user_id: int,
        conversation_id: str,
        deferred,
    ) -> list[ApprovalItem]:
        if not deferred.approvals:
            return []
        rows: list[ToolApproval] = []
        for part in deferred.approvals:
            args = _args_dict(part)
            rows.append(
                ToolApproval(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    conversation_id=conversation_id,
                    tool_name=part.tool_name,
                    args_json=json.dumps(args, ensure_ascii=False),
                    summary=_summary_for(part.tool_name, args),
                    status="pending",
                )
            )
        saved = await self._repo.add_many(rows)
        return [self._to_item(r) for r in saved]

    async def resolve(
        self,
        *,
        user_id: int,
        approval_id: str,
        approved: bool,
    ) -> ApprovalResolveResponse:
        row = await self._repo.get_for_user(approval_id, user_id)
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Onay kaydı bulunamadı",
            )
        if row.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Bu onay zaten sonuçlandırılmış",
            )

        if approved:
            # Önce işlemi çalıştır; başarısızsa onay pending kalsın
            message = await self._execute(row, user_id=user_id)
            await self._repo.set_status(approval_id, "approved")
            new_status: str = "approved"
        else:
            message = f"{row.summary} reddedildi; işlem yapılmadı."
            await self._repo.set_status(approval_id, "rejected")
            new_status = "rejected"

        await self._conversations.append_history(
            row.conversation_id,
            _assistant_only(message),
        )
        return ApprovalResolveResponse(
            approval_id=approval_id,
            status=new_status,  # type: ignore[arg-type]
            conversation_id=row.conversation_id,
            message=message,
        )

    async def _execute(self, row: ToolApproval, *, user_id: int) -> str:
        try:
            args = json.loads(row.args_json) if row.args_json else {}
        except json.JSONDecodeError:
            args = {}
        if not isinstance(args, dict):
            args = {}

        if row.tool_name == "cancel_order":
            order_id = args.get("order_id")
            if order_id is None:
                return "İptal için sipariş numarası eksik."
            view = await self._orders.cancel_order_status(user_id, int(order_id))
            if view is None:
                return f"Sipariş #{order_id} iptal edilemedi."
            return f"Sipariş #{view.id} ({view.product}) iptal edildi."

        if row.tool_name == "pay_for_order":
            order_id = args.get("order_id")
            if order_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ödeme için sipariş numarası eksik.",
                )
            view = await self._payments.pay_for_order(
                user_id,
                int(order_id),
                status="paid",
            )
            return (
                f"Sipariş #{view.order_id}"
                + (f" ({view.product})" if view.product else "")
                + f" ödemesi tamamlandı ({view.status})."
            )

        logger.warning("[approval] unsupported tool=%s", row.tool_name)
        return f"Bu işlem ({row.tool_name}) henüz desteklenmiyor."
