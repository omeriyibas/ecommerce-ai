from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.tool_approval import ToolApproval


class ToolApprovalRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def add_many(self, rows: list[ToolApproval]) -> list[ToolApproval]:
        for row in rows:
            self._db.add(row)
        await self._db.commit()
        for row in rows:
            await self._db.refresh(row)
        return rows

    async def get_for_user(
        self,
        approval_id: str,
        user_id: int,
    ) -> ToolApproval | None:
        result = await self._db.execute(
            select(ToolApproval).where(
                ToolApproval.id == approval_id,
                ToolApproval.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_pending_for_user(self, user_id: int) -> list[ToolApproval]:
        stmt = (
            select(ToolApproval)
            .where(
                ToolApproval.user_id == user_id,
                ToolApproval.status == "pending",
            )
            .order_by(ToolApproval.created_at.desc(), ToolApproval.id.desc())
        )
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def set_status(
        self,
        approval_id: str,
        status: str,
    ) -> ToolApproval | None:
        row = await self._db.get(ToolApproval, approval_id)
        if row is None:
            return None
        row.status = status
        row.resolved_at = datetime.now(timezone.utc)
        await self._db.commit()
        await self._db.refresh(row)
        return row
