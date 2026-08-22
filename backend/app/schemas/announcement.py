from datetime import datetime
from uuid import UUID

from sqlmodel import SQLModel


class AnnouncementCreate(SQLModel):
    title: str
    message: str
    blocks: list[str] = []


class AnnouncementRead(SQLModel):
    id: UUID
    title: str
    message: str
    hostel_id: UUID | None
    created_by_id: UUID
    is_active: bool
    created_at: datetime
    blocks: list[str] = []