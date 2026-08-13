"""add announcement targeting

Revision ID: d50e7c4961b8
Revises: 2cc94b596612
Create Date: 2026-08-13 18:00:46.786486

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd50e7c4961b8'
down_revision: Union[str, Sequence[str], None] = '2cc94b596612'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "announcements",
        sa.Column(
            "hostel_id",
            sa.Uuid(),
            nullable=True,
        ),
    )

    op.add_column(
        "announcements",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    op.create_foreign_key(
        "fk_announcements_hostel_id",
        "announcements",
        "hostels",
        ["hostel_id"],
        ["id"],
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint(
        "fk_announcements_hostel_id",
        "announcements",
        type_="foreignkey",
    )

    op.drop_column(
        "announcements",
        "is_active",
    )

    op.drop_column(
        "announcements",
        "hostel_id",
    )
    # ### end Alembic commands ###
