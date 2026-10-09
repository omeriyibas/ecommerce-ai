from pydantic_ai import FunctionToolset, RunContext
from pydantic_ai.messages import ModelRequest, UserPromptPart

from ai.deps import AppDeps


def _user_prompts_from_messages(messages: list) -> list[str]:
    prompts: list[str] = []
    for msg in messages:
        if not isinstance(msg, ModelRequest):
            continue
        for part in msg.parts:
            if isinstance(part, UserPromptPart):
                content = part.content
                if isinstance(content, str) and content.strip():
                    prompts.append(content.strip())
    return prompts


history_toolset = FunctionToolset[AppDeps](
    id='conversation-history',
    instructions=(
        'Önceki mesaj / “en son ne istedim” sorularında '
        'get_recent_user_messages kullan; sipariş tool’larına gitme.'
    ),
)


@history_toolset.tool
async def get_recent_user_messages(
    ctx: RunContext[AppDeps],
    limit: int = 5,
) -> list[str]:
    """Önceki kullanıcı mesajlarını kronolojik döndürür (şu anki soru hariç).

    Listenin son elemanı en son kullanıcı isteğidir.
    """
    prompts = _user_prompts_from_messages(ctx.messages)
    previous = prompts[:-1] if len(prompts) > 1 else prompts
    if limit < 1:
        limit = 1
    return previous[-limit:]
