from collections.abc import Sequence
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.security import hash_password
from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem
from app.models.payment_method import PaymentMethod
from app.models.product import Product
from app.models.store import Store
from app.schemas.public import (
    CheckoutOrderItemSummary,
    CheckoutResponse,
    GuestOrderCreate,
    OrderItemInput,
)
from app.services.exceptions import ServiceError
from app.services.public_store_service import get_active_store_by_slug
from app.utils.invoice import generate_invoice_code, generate_invoice_password


@dataclass
class LineItem:
    product_id: int
    quantity: int
    product: Product
    unit_price: Decimal
    total_price: Decimal


def _get_payment_method(
    db: Session,
    store_id: int,
    payment_method_id: int,
) -> PaymentMethod:
    method = db.scalar(
        select(PaymentMethod).where(
            PaymentMethod.id == payment_method_id,
            PaymentMethod.store_id == store_id,
            PaymentMethod.is_active.is_(True),
        )
    )
    if method is None:
        raise ServiceError("Payment method not found", status_code=404)
    return method


def _load_products_for_update(
    db: Session,
    store_id: int,
    items: Sequence[OrderItemInput],
) -> dict[int, Product]:
    product_ids = [item.product_id for item in items]
    products = list(
        db.scalars(
            select(Product)
            .where(Product.id.in_(product_ids), Product.store_id == store_id)
            .with_for_update()
        ).all()
    )
    return {product.id: product for product in products}


def _build_line_items(
    items: Sequence[OrderItemInput],
    products_by_id: dict[int, Product],
) -> list[LineItem]:
    line_items: list[LineItem] = []

    for item in items:
        product = products_by_id.get(item.product_id)
        if product is None:
            raise ServiceError("Product not found", status_code=404)
        if not product.is_active:
            raise ServiceError(
                f"Product is not available: {product.title}",
                status_code=422,
            )
        if item.quantity > product.stock_quantity:
            raise ServiceError(
                f"Insufficient stock for {product.title}",
                status_code=422,
            )

        unit_price = Decimal(product.price)
        line_items.append(
            LineItem(
                product_id=product.id,
                quantity=item.quantity,
                product=product,
                unit_price=unit_price,
                total_price=unit_price * item.quantity,
            )
        )

    return line_items


def _decrement_stock(db: Session, line_items: Sequence[LineItem]) -> None:
    for line in line_items:
        result = db.execute(
            update(Product)
            .where(
                Product.id == line.product_id,
                Product.stock_quantity >= line.quantity,
            )
            .values(stock_quantity=Product.stock_quantity - line.quantity)
        )
        if result.rowcount != 1:
            raise ServiceError(
                f"Insufficient stock for {line.product.title}",
                status_code=422,
            )


def create_guest_order(
    db: Session,
    slug: str,
    data: GuestOrderCreate,
) -> CheckoutResponse:
    store = get_active_store_by_slug(db, slug)
    payment_method = _get_payment_method(db, store.id, data.payment_method_id)

    try:
        products_by_id = _load_products_for_update(db, store.id, data.items)
        line_items = _build_line_items(data.items, products_by_id)
        _decrement_stock(db, line_items)

        subtotal = sum((line.total_price for line in line_items), Decimal("0"))
        plain_password = generate_invoice_password()
        invoice_code = generate_invoice_code(db)

        order = Order(
            store_id=store.id,
            invoice_code=invoice_code,
            invoice_password_hash=hash_password(plain_password),
            buyer_name=data.buyer_name.strip(),
            buyer_phone=data.buyer_phone.strip(),
            buyer_address=data.buyer_address.strip(),
            buyer_note=data.buyer_note,
            payment_method_id=payment_method.id,
            status=OrderStatus.PENDING_PAYMENT,
            subtotal_amount=subtotal,
            total_amount=subtotal,
            stock_restored=False,
        )
        db.add(order)
        db.flush()

        for line in line_items:
            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=line.product_id,
                    product_title_snapshot=line.product.title,
                    unit_price_snapshot=line.unit_price,
                    quantity=line.quantity,
                    total_price=line.total_price,
                )
            )

        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError("Could not create order", status_code=409) from exc
    except ServiceError:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.payment_method))
        .where(Order.id == order.id)
    )

    return CheckoutResponse(
        invoice_code=invoice_code,
        invoice_edit_password=plain_password,
        order_id=order.id,
        status=order.status,
        subtotal_amount=order.subtotal_amount,
        total_amount=order.total_amount,
        items=[
            CheckoutOrderItemSummary(
                product_id=item.product_id,
                product_title=item.product_title_snapshot,
                quantity=item.quantity,
                unit_price=item.unit_price_snapshot,
                total_price=item.total_price,
            )
            for item in order.items
        ],
        payment_method=order.payment_method,
    )
