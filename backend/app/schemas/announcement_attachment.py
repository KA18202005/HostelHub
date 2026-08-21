from datetime import datetime
from uuid import UUID

from sqlmodel import SQLModel


class AnnouncementAttachmentRead(SQLModel):
    id: UUID

    announcement_id: UUID

    uploaded_by_id: UUID

    filename: str

    stored_filename: str

    content_type: str

    file_size: int

    created_at: datetime