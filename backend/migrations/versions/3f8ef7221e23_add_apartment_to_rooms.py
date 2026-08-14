"""add apartment to rooms

Revision ID: 3f8ef7221e23
Revises: d50e7c4961b8
Create Date: 2026-08-14 19:10:43.644556
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3f8ef7221e23"
down_revision: Union[str, Sequence[str], None] = "d50e7c4961b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rooms",
        sa.Column(
            "apartment",
            sa.String(length=10),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("rooms", "apartment")