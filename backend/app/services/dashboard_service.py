from datetime import datetime, time, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import OrderStatus
from app.models.order import Order
from app.models.product import Product
from app.models.store import Store
from app.schemas.dashboard import (
    LowStockProductItem,
    RecentOrderItem,
    SellerDashboardResponse,
)

CONFIRMED_STATUSES = {
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
}
PENDING_STATUSES = {OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_UPLOADED}


def get_dashboard(db: Session, store: Store) -> SellerDashboardResponse:
    store_id = store.id

    total_orders = db.scalar(
        select(func.count()).select_from(Order).where(Order.store_id == store_id)
    ) or 0

    pending_orders = db.scalar(
        select(func.count())
        .select_from(Order)
        .where(Order.store_id == store_id, Order.status == OrderStatus.PENDING_PAYMENT)
    ) or 0

    payment_uploaded_orders = db.scalar(
        select(func.count())
        .select_from(Order)
        .where(Order.store_id == store_id, Order.status == OrderStatus.PAYMENT_UPLOADED)
    ) or 0

    confirmed_orders = db.scalar(
        select(func.count())
        .select_from(Order)
        .where(Order.store_id == store_id, Order.status.in_(CONFIRMED_STATUSES))
    ) or 0

    confirmed_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.store_id == store_id, Order.status.in_(CONFIRMED_STATUSES))
    ) or Decimal("0")

    pending_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.store_id == store_id, Order.status.in_(PENDING_STATUSES))
    ) or Decimal("0")

    today_start = datetime.combine(
        datetime.now(timezone.utc).date(),
        time.min,
        tzinfo=timezone.utc,
    )
    today_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(
            Order.store_id == store_id,
            Order.status.in_(CONFIRMED_STATUSES),
            Order.created_at >= today_start,
        )
    ) or Decimal("0")

    low_stock_products = list(
        db.scalars(
            select(Product)
            .where(
                Product.store_id == store_id,
                Product.is_active.is_(True),
                Product.stock_quantity <= settings.LOW_STOCK_THRESHOLD,
            )
            .order_by(Product.stock_quantity.asc(), Product.id.asc())
        ).all()
    )

    recent_orders = list(
        db.scalars(
            select(Order)
            .where(Order.store_id == store_id)
            .order_by(Order.created_at.desc())
            .limit(10)
        ).all()
    )

    return SellerDashboardResponse(
        total_orders=total_orders,
        pending_orders=pending_orders,
        payment_uploaded_orders=payment_uploaded_orders,
        confirmed_orders=confirmed_orders,
        confirmed_revenue=confirmed_revenue,
        pending_revenue=pending_revenue,
        today_revenue=today_revenue,
        low_stock_products=[LowStockProductItem.model_validate(p) for p in low_stock_products],
        recent_orders=[
            RecentOrderItem(
                id=order.id,
                invoice_code=order.invoice_code,
                status=order.status,
                buyer_name=order.buyer_name,
                total_amount=order.total_amount,
                created_at=order.created_at,
            )
            for order in recent_orders
        ],
    )
