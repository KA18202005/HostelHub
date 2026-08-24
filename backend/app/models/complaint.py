from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, Relationship

from app.enums.complaint_category import ComplaintCategory
from app.enums.complaint_priority import ComplaintPriority
from app.enums.complaint_status import ComplaintStatus
from app.models.base import BaseModel
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.room import Room
    from app.models.user import User
    from app.models.complaint_image import ComplaintImage
    from app.models.complaint_supporter import ComplaintSupporter


class Complaint(BaseModel, TimestampMixin, table=True):
    __tablename__ = "complaints"

    title: str = Field(
        max_length=200,
        index=True
    )

    description: str = Field(
        min_length=10
    )

    category: ComplaintCategory

    priority: ComplaintPriority = ComplaintPriority.MEDIUM

    status: ComplaintStatus = ComplaintStatus.OPEN
    
    ai_reason: str | None = None

    room_id: UUID = Field(
        foreign_key="rooms.id"
    )

    reported_by_id: UUID = Field(
        foreign_key="users.id"
    )

    assigned_to_id: UUID | None = Field(
        default=None,
        foreign_key="users.id"
    )

    room: "Room" = Relationship(
        back_populates="complaints"
    )

    reported_by: "User" = Relationship(
        back_populates="reported_complaints",
        sa_relationship_kwargs={
            "foreign_keys": "[Complaint.reported_by_id]"
        }
    )

    assigned_to: "User" = Relationship(
        back_populates="assigned_complaints",
        sa_relationship_kwargs={
            "foreign_keys": "[Complaint.assigned_to_id]"
        }
    )
    
    supporters: list["ComplaintSupporter"] = Relationship(
        back_populates="complaint"
    )