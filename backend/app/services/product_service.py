from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.product import Product, ProductImage
from app.models.store import Store
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.exceptions import ServiceError


def _attach_images(db: Session, product: Product, image_urls: list[str]) -> None:
    for index, image_url in enumerate(image_urls):
        db.add(
            ProductImage(
                product_id=product.id,
                image_url=image_url,
                sort_order=index,
            )
        )


def _replace_images(db: Session, product: Product, image_urls: list[str]) -> None:
    for image in list(product.images):
        db.delete(image)
    db.flush()
    _attach_images(db, product, image_urls)


def _products_base_query(store: Store):
    return (
        select(Product)
        .options(selectinload(Product.images))
        .where(Product.store_id == store.id)
    )


def list_products(db: Session, store: Store) -> list[Product]:
    return list(
        db.scalars(_products_base_query(store).order_by(Product.id)).all()
    )


def list_products_paginated(
    db: Session,
    store: Store,
    *,
    page: int,
    page_size: int,
) -> tuple[list[Product], int]:
    base = select(Product).where(Product.store_id == store.id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    offset = (page - 1) * page_size
    items = list(
        db.scalars(
            _products_base_query(store).order_by(Product.id).offset(offset).limit(page_size)
        ).all()
    )
    return items, total


def get_product(db: Session, store: Store, product_id: int) -> Product:
    product = db.scalar(
        select(Product)
        .options(selectinload(Product.images))
        .where(Product.id == product_id, Product.store_id == store.id)
    )
    if product is None:
        raise ServiceError("Product not found", status_code=404)
    return product


def create_product(db: Session, store: Store, data: ProductCreate) -> Product:
    product = Product(
        store_id=store.id,
        title=data.title,
        description=data.description,
        price=data.price,
        stock_quantity=data.stock_quantity,
        is_active=data.is_active,
    )
    db.add(product)
    db.flush()

    if data.image_urls:
        _attach_images(db, product, data.image_urls)

    db.commit()
    db.refresh(product)
    return get_product(db, store, product.id)


def update_product(
    db: Session,
    store: Store,
    product_id: int,
    data: ProductUpdate,
) -> Product:
    product = get_product(db, store, product_id)
    update_data = data.model_dump(exclude_unset=True)

    image_urls = update_data.pop("image_urls", None)
    for field, value in update_data.items():
        setattr(product, field, value)

    if image_urls is not None:
        _replace_images(db, product, image_urls)

    db.commit()
    return get_product(db, store, product_id)


def delete_product(db: Session, store: Store, product_id: int) -> None:
    product = get_product(db, store, product_id)
    db.delete(product)
    db.commit()
