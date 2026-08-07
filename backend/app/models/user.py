from typing import TYPE_CHECKING
from sqlmodel import Field, Relationship
from uuid import UUID

from app.enums.roles import UserRole
from app.models.base import BaseModel
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.room import Room


class User(BaseModel, TimestampMixin, table=True):
    __tablename__ = "users"

    name: str

    email: str = Field(index=True, unique=True)

    password_hash: str

    role: UserRole

    phone: str | None = None

    is_active: bool = True

    # NEW FIELD 👇

    room_id: UUID | None = Field(
        default=None,
        foreign_key="rooms.id"
    )

    room: "Room" = Relationship(
        back_populates="students"
    )