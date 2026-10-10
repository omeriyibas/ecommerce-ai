from __future__ import annotations

from collections.abc import AsyncIterable

from pydantic_ai import (
    AgentStreamEvent,
    DeferredToolRequests,
    PartDeltaEvent,
    PartStartEvent,
    RunContext,
    ThinkingPart,
    ThinkingPartDelta,
)
from pydantic_graph import GraphBuilder, StepContext, TypeExpression

from ai.agents.order import order_agent
from ai.agents.payment import payment_agent
from ai.agents.rag import get_rag_agent
from ai.agents.research import research_agent
from ai.agents.router import router_agent
from ai.ai_schemas.orchestrator import OrchestratorReply
from ai.ai_schemas.order import OrderReply
from ai.ai_schemas.payment import PaymentReply
from ai.deps import AppDeps
from ai.graph.state import SupportState
from ai.runtime.approval import resolve_approvals
from ai.runtime.errors import RecoverableError, record_step_error
from ai.runtime.iter_run import run_with_iter


def _deferred_labels(deferred: DeferredToolRequests) -> list[str]:
    labels: list[str] = []
    for part in deferred.approvals:
        args = part.args if isinstance(part.args, dict) else {}
        oid = args.get("order_id")
        if part.tool_name == "cancel_order" and oid is not None:
            labels.append(f"Sipariş #{oid} iptal")
        elif part.tool_name == "pay_for_order" and oid is not None:
            labels.append(f"Sipariş #{oid} ödeme")
        else:
            labels.append(part.tool_name)
    return labels


async def _print_thinking(
    _ctx: RunContext[AppDeps],
    events: AsyncIterable[AgentStreamEvent],
) -> None:
    """Model thinking/reasoning deltalarını konsola yazar."""
    async for event in events:
        if isinstance(event, PartStartEvent) and isinstance(
            event.part, ThinkingPart
        ):
            print('\n[thinking] ', end='', flush=True)
            if event.part.content:
                print(event.part.content, end='', flush=True)
        elif (
            isinstance(event, PartDeltaEvent)
            and isinstance(event.delta, ThinkingPartDelta)
            and event.delta.content_delta
        ):
            print(event.delta.content_delta, end='', flush=True)


g = GraphBuilder(
    state_type=SupportState,
    deps_type=AppDeps,
    input_type=str,
    output_type=OrchestratorReply,
)


_GENERAL_GREETINGS = frozenset(
    {
        "merhaba",
        "merhaba!",
        "selam",
        "selam!",
        "selamlar",
        "hey",
        "hi",
        "hello",
        "günaydın",
        "iyi günler",
        "iyi akşamlar",
        "nasılsın",
        "nasilsin",
        "teşekkürler",
        "tesekkurler",
        "teşekkür ederim",
        "sağ ol",
        "sag ol",
    }
)


def _is_general_greeting(text: str) -> bool:
    cleaned = " ".join(text.strip().lower().split())
    if cleaned in _GENERAL_GREETINGS:
        return True
    # çok kısa, tek kelime ve soru/işlem işareti yok
    if len(cleaned) <= 20 and cleaned.rstrip("!.?") in {
        "merhaba",
        "selam",
        "selamlar",
        "hey",
        "hi",
        "hello",
    }:
        return True
    return False


@g.step
async def classify(
    ctx: StepContext[SupportState, AppDeps, str],
) -> str:
    """Soruyu order / payment / both / research / rag / general olarak sınıflandırır."""
    ctx.state.question = ctx.inputs
    # Takip mesajlarında ("2 numaralı" vb.) heuristic atlanır
    if not ctx.state.message_history and _is_general_greeting(ctx.state.question):
        ctx.state.route = "general"
        ctx.state.notes.append("route=general (greeting heuristic)")
        return "general"
    try:
        result = await run_with_iter(
            router_agent,
            ctx.state.question,
            message_history=ctx.state.message_history or None,
        )
    except RecoverableError as exc:
        record_step_error(ctx.state, exc, step="Yönlendirme")
        ctx.state.route = "error"
        return "error"
    route_value = result.output.value
    ctx.state.route = route_value
    ctx.state.notes.append(f"route={route_value}")
    return route_value


@g.step
async def run_general(
    ctx: StepContext[SupportState, AppDeps, str],
) -> str:
    """Selamlama / genel sohbet — araştırma veya domain agent çalıştırmaz."""
    ctx.state.general_message = (
        "Merhaba! Siparişleriniz, ödemeleriniz veya bir ürün hakkında "
        "araştırma yapmamı isterseniz yardımcı olabilirim. Nasıl yardımcı olayım?"
    )
    return "general_done"


@g.step
async def run_order(
    ctx: StepContext[SupportState, AppDeps, str],
) -> str:
    """Sipariş agent'ını iter ile çalıştırır; dönüşte route bilgisini iletir."""
    try:
        result = await run_with_iter(
            order_agent,
            ctx.state.question,
            deps=ctx.deps,
            message_history=ctx.state.message_history or None,
        )
        result = await resolve_approvals(order_agent, result, deps=ctx.deps)
        if isinstance(result.output, DeferredToolRequests):
            ctx.state.deferred_approvals = result.output
            labels = _deferred_labels(result.output)
            ctx.state.order_reply = OrderReply(
                message=(
                    "Bu işlem onay gerektiriyor: "
                    + ", ".join(labels)
                    + ". Onaylar sayfasından onaylayın veya reddedin."
                )
            )
        else:
            ctx.state.order_reply = result.output
    except RecoverableError as exc:
        record_step_error(ctx.state, exc, step="Sipariş")
    # Onay beklerken payment adımına geçme
    if ctx.state.deferred_approvals is not None:
        return "order"
    # 'order' -> compose, 'both' -> run_payment
    return ctx.state.route


@g.step
async def run_payment(
    ctx: StepContext[SupportState, AppDeps, str],
) -> str:
    """Ödeme agent'ını iter ile çalıştırır."""
    try:
        result = await run_with_iter(
            payment_agent,
            ctx.state.question,
            deps=ctx.deps,
            message_history=ctx.state.message_history or None,
        )
        result = await resolve_approvals(payment_agent, result, deps=ctx.deps)
        if isinstance(result.output, DeferredToolRequests):
            ctx.state.deferred_approvals = result.output
            labels = _deferred_labels(result.output)
            ctx.state.payment_reply = PaymentReply(
                message=(
                    "Bu işlem onay gerektiriyor: "
                    + ", ".join(labels)
                    + ". Onaylar sayfasından onaylayın veya reddedin."
                )
            )
        else:
            ctx.state.payment_reply = result.output
    except RecoverableError as exc:
        record_step_error(ctx.state, exc, step="Ödeme")
    return "payment_done"


@g.step
async def run_research(
    ctx: StepContext[SupportState, AppDeps, str],
) -> str:
    """Ürün araştırma agent'ını stream ederek çalıştırır (thinking + output)."""
    try:
        stream_kwargs: dict = {
            "deps": ctx.deps,
            "event_stream_handler": _print_thinking,
        }
        if ctx.state.message_history:
            stream_kwargs["message_history"] = ctx.state.message_history
        async with research_agent.run_stream(
            ctx.state.question,
            **stream_kwargs,
        ) as stream:
            # stream_output biriken (cumulative) partial verir; konsola yalnız delta bas
            printed = ''
            print('\n[research] ', end='', flush=True)
            async for partial in stream.stream_output(debounce_by=0.05):
                message = partial.message or ''
                if message.startswith(printed):
                    print(message[len(printed) :], end='', flush=True)
                    printed = message
                elif message != printed:
                    print(f'\n{message}', end='', flush=True)
                    printed = message
            print()
            ctx.state.research_reply = await stream.get_output()
    except RecoverableError as exc:
        record_step_error(ctx.state, exc, step='Araştırma')
    return 'research_done'


@g.step
async def run_rag(
    ctx: StepContext[SupportState, AppDeps, str],
) -> str:
    """Mağaza belgesi (hybrid RAG) agent'ı."""
    from ai.ai_schemas.rag import AssistantReply

    try:
        if ctx.deps.rag_index is None:
            ctx.state.rag_reply = AssistantReply(
                answer=(
                    "Bu sohbet için mağaza belgesi yüklenmemiş. "
                    "Önce PDF ingest edin (cli_rag.py)."
                )
            )
            return "rag_done"

        result = await run_with_iter(
            get_rag_agent(),
            ctx.state.question,
            deps=ctx.deps,
            message_history=ctx.state.message_history or None,
        )
        ctx.state.rag_reply = result.output
    except RecoverableError as exc:
        record_step_error(ctx.state, exc, step="RAG")
    return "rag_done"


@g.step
async def compose(
    ctx: StepContext[SupportState, AppDeps, str],
) -> OrchestratorReply:
    """Uzman cevaplarını tek OrchestratorReply'ta birleştirir."""
    parts: list[str] = []

    if ctx.state.order_reply is not None:
        parts.append(ctx.state.order_reply.message)

    if ctx.state.payment_reply is not None:
        parts.append(ctx.state.payment_reply.message)

    if ctx.state.research_reply is not None:
        parts.append(ctx.state.research_reply.message)
        if ctx.state.research_reply.sources:
            parts.append(
                "Kaynaklar: " + ", ".join(ctx.state.research_reply.sources)
            )

    if ctx.state.rag_reply is not None:
        parts.append(ctx.state.rag_reply.answer)

    if ctx.state.general_message:
        parts.append(ctx.state.general_message)

    if ctx.state.error:
        parts.append(ctx.state.error)

    order_items = (
        list(ctx.state.order_reply.items)
        if ctx.state.order_reply is not None
        else []
    )
    payment_items: list = []
    if ctx.state.payment_reply is not None:
        payment_items = list(ctx.state.payment_reply.items)
        if ctx.state.payment_reply.unpaid_orders and not order_items:
            order_items = list(ctx.state.payment_reply.unpaid_orders)

    reply = OrchestratorReply(
        message=" ".join(parts).strip() or "İşlem tamamlandı.",
        order_items=order_items,
        payment_items=payment_items,
    )
    ctx.state.reply = reply
    return reply


g.add(
    g.edge_from(g.start_node).to(classify),
    g.edge_from(classify).to(
        g.decision()
        .branch(
            g.match(
                TypeExpression[str],
                matches=lambda route: route == 'order',
            ).to(run_order)
        )
        .branch(
            g.match(
                TypeExpression[str],
                matches=lambda route: route == 'payment',
            ).to(run_payment)
        )
        .branch(
            g.match(
                TypeExpression[str],
                matches=lambda route: route == 'both',
            ).to(run_order)
        )
        .branch(
            g.match(
                TypeExpression[str],
                matches=lambda route: route == "research",
            ).to(run_research)
        )
        .branch(
            g.match(
                TypeExpression[str],
                matches=lambda route: route == "rag",
            ).to(run_rag)
        )
        .branch(
            g.match(
                TypeExpression[str],
                matches=lambda route: route == "general",
            ).to(run_general)
        )
        .branch(
            g.match(
                TypeExpression[str],
                matches=lambda route: route == "error",
            ).to(compose)
        )
    ),
    g.edge_from(run_order).to(
        g.decision()
        .branch(
            g.match(
                TypeExpression[str],
                matches=lambda route: route == "order",
            ).to(compose)
        )
        .branch(
            g.match(
                TypeExpression[str],
                matches=lambda route: route == "both",
            ).to(run_payment)
        )
    ),
    g.edge_from(run_payment).to(compose),
    g.edge_from(run_research).to(compose),
    g.edge_from(run_rag).to(compose),
    g.edge_from(run_general).to(compose),
    g.edge_from(compose).to(g.end_node),
)

support_workflow = g.build()
