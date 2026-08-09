from uuid import UUID

from sqlmodel import SQLModel


class RoomCreate(SQLModel):
    block: str
    room_number: str
    floor: int
    capacity: int
    hostel_id: UUID


class RoomRead(SQLModel):
    id: UUID
    block: str
    room_number: str
    floor: int
    capacity: int
    hostel_id: UUID