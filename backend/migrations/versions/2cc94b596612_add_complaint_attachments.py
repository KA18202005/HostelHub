"""add complaint attachments

Revision ID: 2cc94b596612
Revises: 3ef660d26fe2
Create Date: 2026-08-12 11:10:05.593969

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2cc94b596612"
down_revision: Union[str, Sequence[str], None] = "3ef660d26fe2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "complaint_attachments",
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
        ),
        sa.Column(
            "id",
            sa.UUID(),
            nullable=False,
        ),
        sa.Column(
            "complaint_id",
            sa.UUID(),
            nullable=False,
        ),
        sa.Column(
            "uploaded_by_id",
            sa.UUID(),
            nullable=False,
        ),
        sa.Column(
            "filename",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "stored_filename",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "content_type",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "file_size",
            sa.Integer(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["complaint_id"],
            ["complaints.id"],
        ),
        sa.ForeignKeyConstraint(
            ["uploaded_by_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("complaint_attachments")