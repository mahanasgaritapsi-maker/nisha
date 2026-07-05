"""notification_outbox

Revision ID: 20260706_0011
Revises: 20260705_0010
Create Date: 2026-07-06
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260706_0011"
down_revision: Union[str, None] = "20260705_0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification_outbox",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("channel", sa.String(length=10), nullable=False),
        sa.Column("recipient", sa.String(length=255), nullable=False),
        sa.Column("template", sa.String(length=100), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=True),
        sa.Column(
            "status", sa.String(length=20), nullable=False, server_default="pending"
        ),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_notification_outbox_status_next_attempt",
        "notification_outbox",
        ["status", "next_attempt_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_notification_outbox_status_next_attempt",
        table_name="notification_outbox",
    )
    op.drop_table("notification_outbox")
