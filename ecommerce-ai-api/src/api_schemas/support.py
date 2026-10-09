from typing import Literal

from pydantic import BaseModel, Field

from api_schemas.support_views import OrderChoice, PaymentStatusView


class SupportChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: str | None = Field(
        default=None,
        max_length=36,
        description="Sohbet kimliği (opsiyonel; yoksa yeni sohbet açılır).",
    )


class SupportPendingApproval(BaseModel):
    id: str
    summary: str
    tool_name: str


class SupportChatResponse(BaseModel):
    conversation_id: str
    message: str
    route: str = ""
    order_items: list[OrderChoice] = Field(default_factory=list)
    payment_items: list[PaymentStatusView] = Field(default_factory=list)
    pending_approvals: list[SupportPendingApproval] = Field(default_factory=list)


class SupportHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class SupportHistoryResponse(BaseModel):
    conversation_id: str
    messages: list[SupportHistoryMessage] = Field(default_factory=list)


class SupportConversationSummary(BaseModel):
    conversation_id: str
    title: str


class SupportConversationListResponse(BaseModel):
    conversations: list[SupportConversationSummary] = Field(default_factory=list)


class SupportConversationCreateResponse(BaseModel):
    conversation_id: str
