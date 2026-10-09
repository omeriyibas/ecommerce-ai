from datetime import datetime, timezone

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.conversation import Conversation, ConversationMessage


class ConversationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(
        self,
        *,
        conversation_id: str,
        user_id: int,
        title: str = "Yeni sohbet",
    ) -> Conversation:
        row = Conversation(
            id=conversation_id,
            user_id=user_id,
            title=title,
        )
        self._db.add(row)
        await self._db.commit()
        await self._db.refresh(row)
        return row

    async def get_by_id(self, conversation_id: str) -> Conversation | None:
        result = await self._db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def get_for_user(
        self,
        conversation_id: str,
        user_id: int,
    ) -> Conversation | None:
        result = await self._db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: int) -> list[Conversation]:
        stmt = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc(), Conversation.id.desc())
        )
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def update_title(self, conversation_id: str, title: str) -> None:
        await self._db.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(
                title=title,
                updated_at=datetime.now(timezone.utc),
            )
        )
        await self._db.commit()

    async def touch(self, conversation_id: str) -> None:
        await self._db.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(updated_at=datetime.now(timezone.utc))
        )
        await self._db.commit()

    async def list_by_conversation(
        self,
        conversation_id: str,
    ) -> list[ConversationMessage]:
        stmt = (
            select(ConversationMessage)
            .where(ConversationMessage.conversation_id == conversation_id)
            .order_by(ConversationMessage.seq)
        )
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def count(self, conversation_id: str) -> int:
        stmt = select(func.count()).where(
            ConversationMessage.conversation_id == conversation_id
        )
        result = await self._db.execute(stmt)
        return int(result.scalar_one())

    async def delete_conversation(self, conversation_id: str) -> bool:
        row = await self.get_by_id(conversation_id)
        if row is None:
            return False
        # FK CASCADE DB’de olmayabilir (eski tablo); mesajları açıkça sil
        await self._db.execute(
            delete(ConversationMessage).where(
                ConversationMessage.conversation_id == conversation_id
            )
        )
        await self._db.delete(row)
        await self._db.commit()
        return True

    async def add_many(
        self,
        conversation_id: str,
        items: list[tuple[int, bytes]],
    ) -> None:
        for seq, payload in items:
            self._db.add(
                ConversationMessage(
                    conversation_id=conversation_id,
                    seq=seq,
                    payload=payload,
                )
            )
        await self._db.commit()
