from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class ApprovalItem(BaseModel):
    id: str
    conversation_id: str
    tool_name: str
    summary: str
    args: dict[str, Any] = Field(default_factory=dict)
    status: Literal["pending", "approved", "rejected"]
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ApprovalListResponse(BaseModel):
    approvals: list[ApprovalItem] = Field(default_factory=list)


class ApprovalResolveResponse(BaseModel):
    approval_id: str
    status: Literal["approved", "rejected"]
    conversation_id: str
    message: str = ""
