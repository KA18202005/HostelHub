from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, Relationship

from app.models.base import BaseModel
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.complaint import Complaint


class ComplaintImage(BaseModel, TimestampMixin, table=True):
    __tablename__ = "complaint_images"

    image_url: str

    complaint_id: UUID = Field(
        foreign_key="complaints.id"
    )

    complaint: "Complaint" = Relationship(
        back_populates="images"
    )