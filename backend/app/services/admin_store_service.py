from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.product import Product
from app.models.store import Store
from app.models.user import User
from app.schemas.admin import AdminStoreListItem
from app.services.exceptions import ServiceError


def _store_list_item_from_row(row) -> AdminStoreListItem:
    return AdminStoreListItem(
        id=row.id,
        name=row.name,
        slug=row.slug,
        owner_email=row.email,
        is_active=row.is_active,
        product_count=row.product_count,
        order_count=row.order_count,
        created_at=row.created_at,
    )


def _stores_query():
    product_counts = (
        select(Product.store_id, func.count(Product.id).label("product_count"))
        .group_by(Product.store_id)
        .subquery()
    )
    order_counts = (
        select(Order.store_id, func.count(Order.id).label("order_count"))
        .group_by(Order.store_id)
        .subquery()
    )
    return (
        select(
            Store.id,
            Store.name,
            Store.slug,
            Store.is_active,
            Store.created_at,
            User.email,
            func.coalesce(product_counts.c.product_count, 0).label("product_count"),
            func.coalesce(order_counts.c.order_count, 0).label("order_count"),
        )
        .join(User, Store.owner_id == User.id)
        .outerjoin(product_counts, Store.id == product_counts.c.store_id)
        .outerjoin(order_counts, Store.id == order_counts.c.store_id)
        .order_by(Store.created_at.desc())
    )


def list_stores(db: Session) -> list[AdminStoreListItem]:
    rows = db.execute(_stores_query()).all()
    return [_store_list_item_from_row(row) for row in rows]


def list_stores_paginated(
    db: Session,
    *,
    page: int,
    page_size: int,
) -> tuple[list[AdminStoreListItem], int]:
    count_q = select(func.count()).select_from(Store)
    total = db.scalar(count_q) or 0
    offset = (page - 1) * page_size
    rows = db.execute(_stores_query().offset(offset).limit(page_size)).all()
    return [_store_list_item_from_row(row) for row in rows], total


def get_store_by_id(db: Session, store_id: int) -> Store:
    store = db.get(Store, store_id)
    if store is None:
        raise ServiceError("Store not found", status_code=404)
    return store


def set_store_active(db: Session, store_id: int, *, is_active: bool) -> AdminStoreListItem:
    store = get_store_by_id(db, store_id)
    store.is_active = is_active
    db.commit()
    db.refresh(store)

    product_count = (
        db.scalar(
            select(func.count()).select_from(Product).where(Product.store_id == store.id)
        )
        or 0
    )
    order_count = (
        db.scalar(select(func.count()).select_from(Order).where(Order.store_id == store.id))
        or 0
    )
    owner_email = db.scalar(select(User.email).where(User.id == store.owner_id)) or ""

    return AdminStoreListItem(
        id=store.id,
        name=store.name,
        slug=store.slug,
        owner_email=owner_email,
        is_active=store.is_active,
        product_count=product_count,
        order_count=order_count,
        created_at=store.created_at,
    )
