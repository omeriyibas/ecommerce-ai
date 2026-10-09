from pydantic import TypeAdapter
from pydantic_ai.messages import ModelMessage
from sqlalchemy.ext.asyncio import AsyncSession

from models.conversation import Conversation
from repositories.conversation_repository import ConversationRepository

_message_adapter = TypeAdapter(ModelMessage)

DEFAULT_TITLE = "Yeni sohbet"


def _title_from_text(text: str) -> str:
    cleaned = text.strip()
    if not cleaned:
        return DEFAULT_TITLE
    return cleaned if len(cleaned) <= 48 else f"{cleaned[:45]}…"


class ConversationService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = ConversationRepository(db)

    async def create(
        self,
        *,
        conversation_id: str,
        user_id: int,
        title: str = DEFAULT_TITLE,
    ) -> Conversation:
        return await self._repo.create(
            conversation_id=conversation_id,
            user_id=user_id,
            title=title,
        )

    async def get_for_user(
        self,
        conversation_id: str,
        user_id: int,
    ) -> Conversation | None:
        return await self._repo.get_for_user(conversation_id, user_id)

    async def list_for_user(self, user_id: int) -> list[Conversation]:
        return await self._repo.list_for_user(user_id)

    async def load_history(self, conversation_id: str) -> list[ModelMessage]:
        rows = await self._repo.list_by_conversation(conversation_id)
        return [_message_adapter.validate_json(row.payload) for row in rows]

    async def append_history(
        self,
        conversation_id: str,
        new_messages: list[ModelMessage],
        *,
        title_hint: str | None = None,
    ) -> None:
        """Yeni mesajları ekler; ilk turda başlığı günceller."""
        if not new_messages:
            return

        start = await self._repo.count(conversation_id)
        items = [
            (start + offset, _message_adapter.dump_json(message))
            for offset, message in enumerate(new_messages)
        ]
        await self._repo.add_many(conversation_id, items)

        conv = await self._repo.get_by_id(conversation_id)
        if conv is None:
            return

        if (
            start == 0
            and title_hint
            and (not conv.title or conv.title == DEFAULT_TITLE)
        ):
            await self._repo.update_title(
                conversation_id,
                _title_from_text(title_hint),
            )
        else:
            await self._repo.touch(conversation_id)

    async def delete_for_user(
        self,
        conversation_id: str,
        user_id: int,
    ) -> bool:
        conv = await self._repo.get_for_user(conversation_id, user_id)
        if conv is None:
            return False
        return await self._repo.delete_conversation(conversation_id)
