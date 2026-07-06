"""Store visit analytics (roadmap task 20)

Revision ID: 20260706_0016
Revises: 20260706_0015
Create Date: 2026-07-06
"""

import sqlalchemy as sa
from alembic import op

revision = "20260706_0016"
down_revision = "20260706_0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "store_visits_daily",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id",
            sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("visit_date", sa.Date(), nullable=False),
        sa.Column("visit_count", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("store_id", "visit_date", name="uq_store_visits_daily_store_date"),
    )
    op.create_index("ix_store_visits_daily_store_id", "store_visits_daily", ["store_id"])
    op.create_index("ix_store_visits_daily_visit_date", "store_visits_daily", ["visit_date"])


def downgrade() -> None:
    op.drop_index("ix_store_visits_daily_visit_date", table_name="store_visits_daily")
    op.drop_index("ix_store_visits_daily_store_id", table_name="store_visits_daily")
    op.drop_table("store_visits_daily")
