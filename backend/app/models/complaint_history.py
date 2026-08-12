from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, Relationship

from app.models.base import BaseModel
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.complaint import Complaint
    from app.models.user import User


class ComplaintHistory(BaseModel, TimestampMixin, table=True):
    __tablename__ = "complaint_history"

    complaint_id: UUID = Field(
        foreign_key="complaints.id"
    )

    user_id: UUID = Field(
        foreign_key="users.id"
    )

    action: str = Field(max_length=100)

    old_value: str | None = None

    new_value: str | None = None

    complaint: "Complaint" = Relationship()

    user: "User" = Relationship()