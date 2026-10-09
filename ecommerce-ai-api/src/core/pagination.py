"""Sayfalı liste cevapları için ortak yardımcılar."""

import base64
import math
from datetime import datetime
from typing import Awaitable, Callable, List, TypeVar

from api_schemas.pagination import CursorPaginatedResponse, PaginatedResponse

T = TypeVar("T")
Row = TypeVar("Row")


def pagination_offset(page: int, per_page: int) -> int:
    return (page - 1) * per_page


def total_pages_for(total: int, per_page: int) -> int:
    return math.ceil(total / per_page) if total > 0 else 1


def build_paginated_response(
    data: List[T],
    *,
    total: int,
    page: int,
    per_page: int,
) -> PaginatedResponse[T]:
    total_pages = total_pages_for(total, per_page)
    return PaginatedResponse(
        data=data,
        total=total,
        page=page,
        per_page=per_page,
        has_next_page=page < total_pages,
        has_prev_page=page > 1,
        total_pages=total_pages,
    )


def encode_keyset_cursor(captured_at: datetime) -> str:
    raw = captured_at.isoformat()
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii").rstrip("=")


def decode_keyset_cursor(cursor: str) -> datetime:
    padded = cursor + "=" * (-len(cursor) % 4)
    try:
        raw = base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8")
        return datetime.fromisoformat(raw)
    except (ValueError, UnicodeDecodeError) as exc:
        raise ValueError("Geçersiz cursor") from exc


def build_cursor_paginated_response(
    data: List[T],
    *,
    per_page: int,
    has_next_page: bool,
    next_cursor: str | None,
) -> CursorPaginatedResponse[T]:
    return CursorPaginatedResponse(
        data=data,
        per_page=per_page,
        has_next_page=has_next_page,
        next_cursor=next_cursor,
    )


def paginate_in_memory(
    items: List[T],
    *,
    page: int,
    per_page: int,
) -> PaginatedResponse[T]:
    """Hazır listeden sayfa dilimi + PaginatedResponse (DB yok)."""
    total = len(items)
    offset = pagination_offset(page, per_page)
    return build_paginated_response(
        items[offset : offset + per_page],
        total=total,
        page=page,
        per_page=per_page,
    )


async def paginate(
    *,
    page: int,
    per_page: int,
    count: Callable[[], Awaitable[int]],
    fetch: Callable[[int, int], Awaitable[List[Row]]],
    map_item: Callable[[Row], T],
) -> PaginatedResponse[T]:
    """count + offset/limit fetch + map + PaginatedResponse."""
    total = await count()
    rows = await fetch(pagination_offset(page, per_page), per_page)
    return build_paginated_response(
        [map_item(row) for row in rows],
        total=total,
        page=page,
        per_page=per_page,
    )
