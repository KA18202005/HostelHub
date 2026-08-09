from uuid import UUID

from sqlmodel import SQLModel


class HostelCreate(SQLModel):
    name: str
    gender: str


class HostelRead(SQLModel):
    id: UUID
    name: str
    gender: str