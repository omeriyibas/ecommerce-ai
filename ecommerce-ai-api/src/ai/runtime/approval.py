from pydantic_ai import Agent, DeferredToolRequests, DeferredToolResults

from ai.deps import AppDeps


async def resolve_approvals(
    agent: Agent,
    result,
    *,
    deps: AppDeps,
):
    """DeferredToolRequests varsa onaylayıp devam eder.

    - `deps.defer_approvals`: çözme; sonucu olduğu gibi bırak (panel kuyruğu).
    - `deps.approve_deferred` verilmişse onu kullanır.
    - Aksi halde terminalden e/h sorar (CLI).
    """
    while isinstance(result.output, DeferredToolRequests):
        if deps.defer_approvals:
            return result

        approvals: dict[str, bool] = {}

        for request in result.output.approvals:
            if deps.approve_deferred is not None:
                approvals[request.tool_call_id] = bool(
                    deps.approve_deferred(request)
                )
            else:
                print(f"\nOnay gerekli: {request.tool_name}")
                print(f"Args: {request.args}")
                answer = input("Bu işlemi onaylıyor musun? (e/h): ").strip().lower()
                approvals[request.tool_call_id] = answer == "e"

        result = await agent.run(
            message_history=result.all_messages(),
            deferred_tool_results=DeferredToolResults(approvals=approvals),
            deps=deps,
        )

    return result
