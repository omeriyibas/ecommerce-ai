"""Servis katmanı: HTTPException yardımcıları (404, 409, commit)."""

from typing import Protocol, TypeVar

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

T = TypeVar("T")


class HasId(Protocol):
    id: int


def require_found(
    row: T | None,
    *,
    detail: str,
    status_code: int = status.HTTP_404_NOT_FOUND,
) -> T:
    if row is None:
        raise HTTPException(status_code=status_code, detail=detail)
    return row


def assert_no_id_conflict(
    existing: HasId | None,
    *,
    exclude_id: int | None = None,
    detail: str,
) -> None:
    if existing is None:
        return
    if exclude_id is not None and existing.id == exclude_id:
        return
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)


async def commit_or_integrity_conflict(
    db: AsyncSession,
    *,
    detail: str,
    status_code: int = status.HTTP_409_CONFLICT,
) -> None:
    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(status_code=status_code, detail=detail) from e
