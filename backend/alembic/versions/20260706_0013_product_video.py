"""Product gallery video columns (roadmap task 15).

Adds optional video_url / video_mime_type columns to products so each
product can carry one short video alongside its image gallery.

Revision ID: 20260706_0013
Revises: 20260706_0012
"""

import sqlalchemy as sa
from alembic import op

revision = "20260706_0013"
down_revision = "20260706_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("video_url", sa.String(length=500), nullable=True))
    op.add_column("products", sa.Column("video_mime_type", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "video_mime_type")
    op.drop_column("products", "video_url")
