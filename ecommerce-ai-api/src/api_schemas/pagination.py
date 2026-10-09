from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    total: int
    page: int
    per_page: int
    has_next_page: bool
    has_prev_page: bool
    total_pages: int


class CursorPaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    per_page: int
    has_next_page: bool
    next_cursor: Optional[str] = None
