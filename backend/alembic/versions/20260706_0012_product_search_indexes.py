"""Product search indexes for the storefront browser (roadmap task 14).

PostgreSQL only: enables pg_trgm and adds a trigram GIN index on the product
title plus a composite btree index for the common store/active/price filter.
SQLite (used in tests) is skipped entirely.

Revision ID: 20260706_0012
Revises: 20260706_0011
"""

from alembic import op

revision = "20260706_0012"
down_revision = "20260706_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_products_title_trgm "
        "ON products USING gin (lower(title) gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_products_store_active_price "
        "ON products (store_id, is_active, price)"
    )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return
    op.execute("DROP INDEX IF EXISTS ix_products_store_active_price")
    op.execute("DROP INDEX IF EXISTS ix_products_title_trgm")
