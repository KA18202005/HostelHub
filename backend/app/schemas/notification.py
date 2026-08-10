from datetime import datetime
from uuid import UUID

from sqlmodel import SQLModel


class NotificationRead(SQLModel):
    id: UUID
    title: str
    message: str
    is_read: bool
    user_id: UUID
    created_at: datetime