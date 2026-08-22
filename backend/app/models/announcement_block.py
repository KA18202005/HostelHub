from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.announcement import Announcement


class AnnouncementBlock(SQLModel, table=True):
    __tablename__ = "announcement_blocks"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    announcement_id: UUID = Field(
        foreign_key="announcements.id"
    )

    block: str = Field(
        max_length=50,
        index=True,
    )

    announcement: "Announcement" = Relationship(
        back_populates="blocks"
    )