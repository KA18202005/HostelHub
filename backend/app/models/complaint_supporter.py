from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, Relationship

from app.models.base import BaseModel
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.complaint import Complaint
    from app.models.user import User


class ComplaintSupporter(BaseModel, TimestampMixin, table=True):
    __tablename__ = "complaint_supporters"

    complaint_id: UUID = Field(
        foreign_key="complaints.id"
    )

    student_id: UUID = Field(
        foreign_key="users.id"
    )

    complaint: "Complaint" = Relationship(
        back_populates="supporters"
    )

    student: "User" = Relationship(
        back_populates="supported_complaints"
    )