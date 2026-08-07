from typing import TYPE_CHECKING
from sqlmodel import Field, Relationship
from uuid import UUID

from app.enums.roles import UserRole
from app.models.base import BaseModel
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.room import Room
    from app.models.complaint import Complaint
    from app.models.complaint_supporter import ComplaintSupporter
    from app.models.notification import Notification
    from app.models.announcement import Announcement


class User(BaseModel, TimestampMixin, table=True):
    __tablename__ = "users"

    name: str

    email: str = Field(index=True, unique=True)

    password_hash: str

    role: UserRole

    phone: str | None = None

    is_active: bool = True

    # NEW FIELD 👇

    room_id: UUID | None = Field(
        default=None,
        foreign_key="rooms.id"
    )

    room: "Room" = Relationship(
        back_populates="students"
    )
    
    reported_complaints: list["Complaint"] = Relationship(
        back_populates="reported_by",
        sa_relationship_kwargs={
            "foreign_keys": "[Complaint.reported_by_id]"
        }
    )

    assigned_complaints: list["Complaint"] = Relationship(
        back_populates="assigned_to",
        sa_relationship_kwargs={
            "foreign_keys": "[Complaint.assigned_to_id]"
        }
    )
    supported_complaints: list["ComplaintSupporter"] = Relationship(
        back_populates="student"
    )
    
    notifications: list["Notification"] = Relationship(
        back_populates="user"
    )
    
    announcements: list["Announcement"] = Relationship(
        back_populates="created_by"
    )