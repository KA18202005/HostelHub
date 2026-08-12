from datetime import datetime
from uuid import UUID

from sqlmodel import SQLModel


class ComplaintAttachmentRead(SQLModel):
    id: UUID
    complaint_id: UUID
    uploaded_by_id: UUID
    filename: str
    content_type: str
    file_size: int
    created_at: datetime