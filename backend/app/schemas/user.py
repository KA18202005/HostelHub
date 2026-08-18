from uuid import UUID

from sqlmodel import SQLModel

from app.enums.roles import UserRole


class UserRead(SQLModel):
    id: UUID
    name: str
    email: str
    role: UserRole
    phone: str | None = None
    is_active: bool


class UserRoleUpdate(SQLModel):
    role: UserRole