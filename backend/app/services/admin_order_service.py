from datetime import date, datetime, time, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import OrderStatus
from app.models.order import Order
from app.models.store import Store
from app.schemas.admin import AdminOrderListItem
from app.services.exceptions import ServiceError


def _admin_orders_query(
    *,
    store_id: int | None = None,
    status: OrderStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    query = (
        select(
            Order,
            Store.name.label("store_name"),
            Store.slug.label("store_slug"),
        )
        .join(Store, Order.store_id == Store.id)
    )
    if store_id is not None:
        query = query.where(Order.store_id == store_id)
    if status is not None:
        query = query.where(Order.status == status)
    if date_from is not None:
        start = datetime.combine(date_from, time.min, tzinfo=timezone.utc)
        query = query.where(Order.created_at >= start)
    if date_to is not None:
        end = datetime.combine(date_to, time.max, tzinfo=timezone.utc)
        query = query.where(Order.created_at <= end)
    return query.order_by(Order.created_at.desc())


def _rows_to_admin_order_items(rows) -> list[AdminOrderListItem]:
    return [
        AdminOrderListItem(
            id=order.id,
            invoice_code=order.invoice_code,
            status=order.status,
            buyer_name=order.buyer_name,
            buyer_phone=order.buyer_phone,
            total_amount=order.total_amount,
            store_id=order.store_id,
            store_name=store_name,
            store_slug=store_slug,
            created_at=order.created_at,
        )
        for order, store_name, store_slug in rows
    ]


def list_orders(
    db: Session,
    *,
    store_id: int | None = None,
    status: OrderStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[AdminOrderListItem]:
    rows = db.execute(
        _admin_orders_query(
            store_id=store_id,
            status=status,
            date_from=date_from,
            date_to=date_to,
        )
    ).all()
    return _rows_to_admin_order_items(rows)


def list_orders_paginated(
    db: Session,
    *,
    page: int,
    page_size: int,
    store_id: int | None = None,
    status: OrderStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> tuple[list[AdminOrderListItem], int]:
    base = select(Order).join(Store, Order.store_id == Store.id)
    if store_id is not None:
        base = base.where(Order.store_id == store_id)
    if status is not None:
        base = base.where(Order.status == status)
    if date_from is not None:
        start = datetime.combine(date_from, time.min, tzinfo=timezone.utc)
        base = base.where(Order.created_at >= start)
    if date_to is not None:
        end = datetime.combine(date_to, time.max, tzinfo=timezone.utc)
        base = base.where(Order.created_at <= end)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    offset = (page - 1) * page_size
    rows = db.execute(
        _admin_orders_query(
            store_id=store_id,
            status=status,
            date_from=date_from,
            date_to=date_to,
        )
        .offset(offset)
        .limit(page_size)
    ).all()
    return _rows_to_admin_order_items(rows), total


def get_order_by_id(db: Session, order_id: int) -> tuple[Order, Store]:
    order = db.scalar(
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.payment_proofs),
            selectinload(Order.payment_method),
            selectinload(Order.status_history),
            selectinload(Order.store),
        )
        .where(Order.id == order_id)
    )
    if order is None or order.store is None:
        raise ServiceError("Order not found", status_code=404)
    return order, order.store
