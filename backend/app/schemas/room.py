from uuid import UUID

from sqlmodel import SQLModel


class RoomCreate(SQLModel):
    block: str
    room_number: str
    floor: int
    capacity: int
    hostel_id: UUID
    apartment: str | None = None


class RoomRead(SQLModel):
    id: UUID
    block: str
    room_number: str
    floor: int
    capacity: int
    hostel_id: UUID
    apartment: str | None


class RoomOptionRead(SQLModel):
    id: UUID
    block: str
    floor: int
    apartment: str | None = None
    room_number: str
    capacity: int