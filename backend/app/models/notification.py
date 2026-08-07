from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, Relationship

from app.models.base import BaseModel
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Notification(BaseModel, TimestampMixin, table=True):
    __tablename__ = "notifications"

    title: str = Field(max_length=200)

    message: str

    is_read: bool = False

    user_id: UUID = Field(
        foreign_key="users.id"
    )

    user: "User" = Relationship(
        back_populates="notifications"
    )