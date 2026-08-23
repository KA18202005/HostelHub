from datetime import datetime, UTC

from sqlalchemy import DateTime
from sqlmodel import Field


class TimestampMixin:
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC)
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "onupdate": lambda: datetime.now(UTC),
        },
    )