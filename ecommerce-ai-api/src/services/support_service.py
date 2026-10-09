from __future__ import annotations

import logging
import uuid

from fastapi import HTTPException
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    UserPromptPart,
)
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from ai.deps import AppDeps
from ai.runtime.errors import RecoverableError, format_agent_error
from ai.runtime.observability import setup_logfire
from api_schemas.support import (
    SupportChatResponse,
    SupportConversationSummary,
    SupportHistoryMessage,
    SupportPendingApproval,
)
from services.approval_service import ApprovalService
from services.conversation_service import ConversationService
from services.order_service import OrderService
from services.payment_service import PaymentService
from services.product_service import ProductService

logger = logging.getLogger(__name__)

_logfire_ready = False


def _ensure_logfire() -> None:
    global _logfire_ready
    if _logfire_ready:
        return
    setup_logfire()
    _logfire_ready = True


def _turn_messages(user_text: str, assistant_text: str) -> list[ModelMessage]:
    return [
        ModelRequest(parts=[UserPromptPart(content=user_text)]),
        ModelResponse(parts=[TextPart(content=assistant_text)]),
    ]


def _format_try(amount: float) -> str:
    return f"{amount:,.2f} ₺".replace(",", "X").replace(".", ",").replace("X", ".")


def _history_body(
    message: str,
    *,
    order_items: list,
    payment_items: list,
) -> str:
    """Geçmişte de okunaklı kalsın diye kısa liste satırları ekler."""
    parts = [message.strip()] if message.strip() else []
    if order_items:
        lines = [
            f"#{o.id}  {o.product}  {_format_try(float(o.amount))}"
            for o in order_items
        ]
        parts.append("\n".join(lines))
    if payment_items:
        lines = [
            f"#{p.order_id}  {p.product or '—'}  {p.status}"
            for p in payment_items
        ]
        parts.append("\n".join(lines))
    return "\n\n".join(parts)


def _history_to_api(messages: list[ModelMessage]) -> list[SupportHistoryMessage]:
    out: list[SupportHistoryMessage] = []
    for msg in messages:
        if isinstance(msg, ModelRequest):
            texts = [
                p.content
                for p in msg.parts
                if isinstance(p, UserPromptPart) and isinstance(p.content, str)
            ]
            if texts:
                out.append(
                    SupportHistoryMessage(role="user", content="\n".join(texts))
                )
        elif isinstance(msg, ModelResponse):
            texts = [
                p.content
                for p in msg.parts
                if isinstance(p, TextPart) and isinstance(p.content, str)
            ]
            if texts:
                out.append(
                    SupportHistoryMessage(
                        role="assistant",
                        content="\n".join(texts),
                    )
                )
    return out


class SupportService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._conversations = ConversationService(db)

    async def create_conversation(self, *, user_id: int) -> str:
        conversation_id = str(uuid.uuid4())
        await self._conversations.create(
            conversation_id=conversation_id,
            user_id=user_id,
        )
        return conversation_id

    async def list_conversations(
        self,
        *,
        user_id: int,
    ) -> list[SupportConversationSummary]:
        rows = await self._conversations.list_for_user(user_id)
        return [
            SupportConversationSummary(
                conversation_id=row.id,
                title=row.title,
            )
            for row in rows
        ]

    async def get_history(
        self,
        *,
        user_id: int,
        conversation_id: str,
    ) -> list[SupportHistoryMessage]:
        conv = await self._conversations.get_for_user(conversation_id, user_id)
        if conv is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sohbet bulunamadı",
            )
        messages = await self._conversations.load_history(conversation_id)
        return _history_to_api(messages)

    async def delete_conversation(
        self,
        *,
        user_id: int,
        conversation_id: str,
    ) -> None:
        deleted = await self._conversations.delete_for_user(
            conversation_id,
            user_id,
        )
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sohbet bulunamadı",
            )

    async def chat(
        self,
        *,
        user_id: int,
        message: str,
        conversation_id: str | None = None,
    ) -> SupportChatResponse:
        from ai.graph import SupportState, support_workflow

        _ensure_logfire()
        text = message.strip()
        if not text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mesaj boş olamaz",
            )

        if conversation_id and conversation_id.strip():
            conv_id = conversation_id.strip()
            conv = await self._conversations.get_for_user(conv_id, user_id)
            if conv is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Sohbet bulunamadı",
                )
        else:
            conv_id = await self.create_conversation(user_id=user_id)

        history = await self._conversations.load_history(conv_id)

        deps = AppDeps(
            order_service=OrderService(self._db),
            payment_service=PaymentService(self._db),
            product_service=ProductService(self._db),
            user_id=user_id,
            defer_approvals=True,
        )
        state = SupportState(message_history=list(history))

        try:
            reply = await support_workflow.run(
                state=state,
                deps=deps,
                inputs=text,
            )
        except RecoverableError as exc:
            msg = format_agent_error(exc, step="Destek")
            logger.warning(
                "[support] recoverable user_id=%s route=%s err=%s",
                user_id,
                state.route,
                msg,
            )
            await self._conversations.append_history(
                conv_id,
                _turn_messages(text, msg),
                title_hint=text,
            )
            return SupportChatResponse(
                conversation_id=conv_id,
                message=msg,
                route=state.route or "error",
            )
        except Exception:
            logger.exception("[support] unexpected user_id=%s", user_id)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Destek asistanı şu an yanıt veremiyor. Lütfen tekrar deneyin.",
            ) from None

        pending_items: list[SupportPendingApproval] = []
        if state.deferred_approvals is not None:
            created = await ApprovalService(self._db).create_from_deferred(
                user_id=user_id,
                conversation_id=conv_id,
                deferred=state.deferred_approvals,
            )
            pending_items = [
                SupportPendingApproval(
                    id=item.id,
                    summary=item.summary,
                    tool_name=item.tool_name,
                )
                for item in created
            ]

        history_text = _history_body(
            reply.message,
            order_items=reply.order_items,
            payment_items=reply.payment_items,
        )
        await self._conversations.append_history(
            conv_id,
            _turn_messages(text, history_text),
            title_hint=text,
        )

        return SupportChatResponse(
            conversation_id=conv_id,
            message=reply.message,
            route=state.route or "",
            order_items=list(reply.order_items),
            payment_items=list(reply.payment_items),
            pending_approvals=pending_items,
        )
