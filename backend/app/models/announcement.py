from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, Relationship

from app.models.base import BaseModel
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Announcement(BaseModel, TimestampMixin, table=True):
    __tablename__ = "announcements"

    title: str = Field(
        max_length=200,
        index=True
    )

    message: str

    created_by_id: UUID = Field(
        foreign_key="users.id"
    )

    created_by: "User" = Relationship(
        back_populates="announcements"
    )