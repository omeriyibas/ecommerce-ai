from dataclasses import dataclass, field
from typing import Any

from pydantic_ai import DeferredToolRequests

from ai.ai_schemas.orchestrator import OrchestratorReply
from ai.ai_schemas.order import OrderReply
from ai.ai_schemas.payment import PaymentReply
from ai.ai_schemas.rag import AssistantReply
from ai.ai_schemas.research import ProductResearchReply


@dataclass
class SupportState:
    question: str = ""
    route: str = ""  # order | payment | both | research | rag | general | error
    general_message: str | None = None
    order_reply: OrderReply | None = None
    payment_reply: PaymentReply | None = None
    research_reply: ProductResearchReply | None = None
    rag_reply: AssistantReply | None = None
    reply: OrchestratorReply | None = None
    error: str | None = None
    notes: list[str] = field(default_factory=list)
    #: Önceki turların kullanıcı/asistan mesajları (ModelMessage)
    message_history: list[Any] = field(default_factory=list)
    #: Onay bekleyen tool çağrıları (panel kuyruğu)
    deferred_approvals: DeferredToolRequests | None = None

