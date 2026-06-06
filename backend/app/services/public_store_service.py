from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.payment_method import PaymentMethod
from app.models.product import Product
from app.models.store import Store
from app.services.exceptions import ServiceError


def get_active_store_by_slug(db: Session, slug: str) -> Store:
    store = db.scalar(select(Store).where(Store.slug == slug))
    if store is None or not store.is_active:
        raise ServiceError("Store not found", status_code=404)
    return store


def list_available_products(db: Session, store_id: int) -> list[Product]:
    return list(
        db.scalars(
            select(Product)
            .options(selectinload(Product.images))
            .where(
                Product.store_id == store_id,
                Product.is_active.is_(True),
                Product.stock_quantity > 0,
            )
            .order_by(Product.id)
        ).all()
    )


def list_active_payment_methods(db: Session, store_id: int) -> list[PaymentMethod]:
    return list(
        db.scalars(
            select(PaymentMethod)
            .where(
                PaymentMethod.store_id == store_id,
                PaymentMethod.is_active.is_(True),
            )
            .order_by(PaymentMethod.id)
        ).all()
    )


def get_store_page(db: Session, slug: str) -> tuple[Store, list[Product], list[PaymentMethod]]:
    store = get_active_store_by_slug(db, slug)
    products = list_available_products(db, store.id)
    payment_methods = list_active_payment_methods(db, store.id)
    return store, products, payment_methods
