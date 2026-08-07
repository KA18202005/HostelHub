from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel
from app.enums.gender import HostelGender



if TYPE_CHECKING:
    from app.models.room import Room

from app.models.base import BaseModel
from app.models.mixins import TimestampMixin


class Hostel(BaseModel, TimestampMixin, table=True):
    __tablename__ = "hostels"

    name: str = Field(index=True)

    gender: HostelGender

    rooms: list["Room"] = Relationship(back_populates="hostel")