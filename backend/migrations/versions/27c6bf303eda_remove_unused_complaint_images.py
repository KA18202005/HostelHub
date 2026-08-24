"""remove unused complaint images

Revision ID: 27c6bf303eda
Revises: 19005eb028ad
Create Date: 2026-08-24 18:51:53.868557

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '27c6bf303eda'
down_revision: Union[str, Sequence[str], None] = '19005eb028ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("complaint_images")


def downgrade() -> None:
    # Recreate only if rollback support is required.
    pass
