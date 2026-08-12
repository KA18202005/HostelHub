from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, Relationship

from app.models.base import BaseModel
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.complaint import Complaint
    from app.models.user import User


class ComplaintAttachment(BaseModel, TimestampMixin, table=True):
    __tablename__ = "complaint_attachments"

    complaint_id: UUID = Field(
        foreign_key="complaints.id"
    )

    uploaded_by_id: UUID = Field(
        foreign_key="users.id"
    )

    filename: str = Field(max_length=255)

    stored_filename: str = Field(max_length=255)

    content_type: str = Field(max_length=100)

    file_size: int

    complaint: "Complaint" = Relationship()

    uploaded_by: "User" = Relationship()