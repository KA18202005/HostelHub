from datetime import datetime

from app.models.mixins import TimestampMixin
from sqlmodel import Field

from app.enums.roles import UserRole
from app.models.base import BaseModel


class User(
    BaseModel,
    TimestampMixin,
    table=True,
):
    __tablename__ = "users"

    name: str
    email: str = Field(index=True, unique=True)
    password_hash: str

    role: UserRole

    phone: str | None = None

    is_active: bool = True