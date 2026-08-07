from typing import TYPE_CHECKING
from uuid import UUID, uuid4
from app.models.base import BaseModel
from app.models.mixins import TimestampMixin
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.hostel import Hostel
    from app.models.user import User

class Room(BaseModel, TimestampMixin, table=True):
    __tablename__ = "rooms"

    number: str

    floor: int = Field(ge=0)

    capacity: int = Field(gt=0)

    hostel_id: UUID = Field(foreign_key="hostels.id")

    hostel: "Hostel" = Relationship(back_populates="rooms")

    students: list["User"] = Relationship(back_populates="room")