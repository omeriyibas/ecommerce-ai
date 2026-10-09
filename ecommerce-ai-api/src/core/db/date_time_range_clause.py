"""SQLAlchemy tarih/saat aralığı WHERE parçaları."""

from __future__ import annotations

from datetime import date, time
from typing import Any

from sqlalchemy import Time, and_, cast, func


def date_time_range_clause(
    timestamp_column: Any,
    *,
    start_date: date | None,
    end_date: date | None,
    start_time: time | None = None,
    end_time: time | None = None,
):
    clause = None
    if start_date is not None:
        clause = func.date(timestamp_column) >= start_date
    if end_date is not None:
        end_clause = func.date(timestamp_column) <= end_date
        clause = end_clause if clause is None else and_(clause, end_clause)
    if start_time is not None:
        start_time_clause = cast(timestamp_column, Time) >= start_time
        clause = (
            start_time_clause if clause is None else and_(clause, start_time_clause)
        )
    if end_time is not None:
        end_time_clause = cast(timestamp_column, Time) <= end_time
        clause = end_time_clause if clause is None else and_(clause, end_time_clause)
    return clause
