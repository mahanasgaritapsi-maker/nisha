from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from decimal import Decimal

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.analytics import StoreVisitDaily
from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem
from app.schemas.analytics import (
    AnalyticsDailyPoint,
    AnalyticsTotals,
    SellerAnalyticsResponse,
    TopProductItem,
)

CONFIRMED_STATUSES = {
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
}


def record_store_visit(db: Session, store_id: int) -> None:
    """Increment today's visit counter for a store (UTC day buckets)."""
    today = datetime.now(timezone.utc).date()
    row = db.scalar(
        select(StoreVisitDaily).where(
            StoreVisitDaily.store_id == store_id,
            StoreVisitDaily.visit_date == today,
        )
    )
    if row is None:
        row = StoreVisitDaily(store_id=store_id, visit_date=today, visit_count=1)
        db.add(row)
    else:
        row.visit_count += 1
    db.commit()


def get_seller_analytics(db: Session, store_id: int, *, days: int = 30) -> SellerAnalyticsResponse:
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=days - 1)
    start_dt = datetime.combine(start_date, time.min, tzinfo=timezone.utc)

    order_rows = db.execute(
        select(
            func.date(Order.created_at),
            func.count(Order.id),
            func.coalesce(
                func.sum(
                    case(
                        (Order.status.in_(CONFIRMED_STATUSES), Order.total_amount),
                        else_=0,
                    )
                ),
                0,
            ),
        )
        .where(
            Order.store_id == store_id,
            Order.status != OrderStatus.CANCELLED,
            Order.created_at >= start_dt,
        )
        .group_by(func.date(Order.created_at))
    ).all()
    orders_by_day: dict[str, tuple[int, Decimal]] = {
        str(row[0]): (int(row[1]), Decimal(str(row[2]))) for row in order_rows
    }

    visit_rows = db.execute(
        select(StoreVisitDaily.visit_date, StoreVisitDaily.visit_count).where(
            StoreVisitDaily.store_id == store_id,
            StoreVisitDaily.visit_date >= start_date,
        )
    ).all()
    visits_by_day: dict[str, int] = {str(row[0]): int(row[1]) for row in visit_rows}

    daily: list[AnalyticsDailyPoint] = []
    total_orders = 0
    total_revenue = Decimal("0")
    total_visits = 0
    for offset in range(days):
        day = start_date + timedelta(days=offset)
        key = day.isoformat()
        day_orders, day_revenue = orders_by_day.get(key, (0, Decimal("0")))
        day_visits = visits_by_day.get(key, 0)
        total_orders += day_orders
        total_revenue += day_revenue
        total_visits += day_visits
        daily.append(
            AnalyticsDailyPoint(
                date=key,
                orders=day_orders,
                revenue=day_revenue,
                visits=day_visits,
            )
        )

    conversion_rate = (
        round((total_orders / total_visits) * 100, 1) if total_visits > 0 else 0.0
    )

    top_rows = db.execute(
        select(
            OrderItem.product_id,
            OrderItem.product_title_snapshot,
            func.coalesce(func.sum(OrderItem.quantity), 0),
            func.coalesce(func.sum(OrderItem.total_price), 0),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            Order.store_id == store_id,
            Order.status != OrderStatus.CANCELLED,
            Order.created_at >= start_dt,
        )
        .group_by(OrderItem.product_id, OrderItem.product_title_snapshot)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(10)
    ).all()
    top_products = [
        TopProductItem(
            product_id=row[0],
            title=row[1],
            quantity=int(row[2]),
            revenue=Decimal(str(row[3])),
        )
        for row in top_rows
    ]

    return SellerAnalyticsResponse(
        days=days,
        daily=daily,
        totals=AnalyticsTotals(
            orders=total_orders,
            revenue=total_revenue,
            visits=total_visits,
            conversion_rate=conversion_rate,
        ),
        top_products=top_products,
    )
