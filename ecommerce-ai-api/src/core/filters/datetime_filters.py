"""Panel listeleri için tarih/saat aralığı parse ve eşleştirme."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time
from typing import Any, Optional

from fastapi import HTTPException
from starlette import status


def parse_time_or_422(
    raw: Optional[str],
    field_name: str,
    *,
    allow_end_2400: bool = False,
) -> Optional[time]:
    if raw is None:
        return None
    value = raw.strip()
    if not value:
        return None
    if allow_end_2400 and value == "24:00":
        return time(23, 59, 59, 999999)
    try:
        return datetime.strptime(value, "%H:%M").time()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} HH:MM formatında olmalıdır.",
        ) from exc


@dataclass(frozen=True, slots=True)
class DateTimeRangeFilter:
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None

    @classmethod
    def from_query_strings(
        cls,
        *,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
    ) -> DateTimeRangeFilter:
        return cls(
            start_date=start_date,
            end_date=end_date,
            start_time=parse_time_or_422(start_time, "start_time"),
            end_time=parse_time_or_422(end_time, "end_time", allow_end_2400=True),
        )

    def as_repo_kwargs(self) -> dict[str, Any]:
        return {
            "start_date": self.start_date,
            "end_date": self.end_date,
            "start_time": self.start_time,
            "end_time": self.end_time,
        }

    def matches(self, dt: datetime) -> bool:
        if self.start_date is not None and dt.date() < self.start_date:
            return False
        if self.end_date is not None and dt.date() > self.end_date:
            return False
        if self.start_time is not None and dt.time() < self.start_time:
            return False
        if self.end_time is not None and dt.time() > self.end_time:
            return False
        return True
