"""add complaint attachment fields

Revision ID: a9f1eb9247a8
Revises: 27c6bf303eda
Create Date: 2026-08-25 18:25:45.406380

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = 'a9f1eb9247a8'
down_revision: Union[str, Sequence[str], None] = '27c6bf303eda'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "complaints",
        sa.Column(
            "attachment_url",
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=True,
        ),
    )

    op.add_column(
        "complaints",
        sa.Column(
            "attachment_name",
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("complaints", "attachment_name")
    op.drop_column("complaints", "attachment_url")