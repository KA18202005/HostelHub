from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.complaint import Complaint
    from app.models.hostel import Hostel
    from app.models.user import User


class Room(SQLModel, table=True):
    __tablename__ = "rooms"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    block: str = Field(
        max_length=50,
        index=True,
    )

    room_number: str = Field(
        max_length=20,
    )

    floor: int

    capacity: int

    hostel_id: UUID = Field(
        foreign_key="hostels.id"
    )

    hostel: "Hostel" = Relationship(
        back_populates="rooms"
    )

    students: list["User"] = Relationship(
        back_populates="room"
    )
    complaints: list["Complaint"] = Relationship(
        back_populates="room"
    )