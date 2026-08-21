from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, Relationship

from app.models.base import BaseModel
from app.models.mixins import TimestampMixin


if TYPE_CHECKING:
    from app.models.announcement import Announcement
    from app.models.user import User


class AnnouncementAttachment(
    BaseModel,
    TimestampMixin,
    table=True,
):
    __tablename__ = "announcement_attachments"

    announcement_id: UUID = Field(
        foreign_key="announcements.id"
    )

    uploaded_by_id: UUID = Field(
        foreign_key="users.id"
    )

    filename: str = Field(max_length=255)

    stored_filename: str = Field(max_length=255)

    content_type: str = Field(max_length=100)

    file_size: int

    announcement: "Announcement" = Relationship()

    uploaded_by: "User" = Relationship()