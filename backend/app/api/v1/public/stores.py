from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.product import ProductImageResponse
from app.schemas.public import (
    GuestOrderCreate,
    PublicPaymentMethod,
    PublicProduct,
    PublicStorePageResponse,
    PublicStoreProfile,
    CheckoutResponse,
)
from app.services import checkout_service, public_store_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/stores", tags=["public-stores"])


@router.get("/{slug}", response_model=PublicStorePageResponse)
def get_public_store(slug: str, db: Session = Depends(get_db)) -> PublicStorePageResponse:
    try:
        store, products, payment_methods = public_store_service.get_store_page(db, slug)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    return PublicStorePageResponse(
        store=PublicStoreProfile.model_validate(store),
        products=[
            PublicProduct(
                id=product.id,
                title=product.title,
                description=product.description,
                price=product.price,
                stock_quantity=product.stock_quantity,
                images=[ProductImageResponse.model_validate(img) for img in product.images],
            )
            for product in products
        ],
        payment_methods=[PublicPaymentMethod.model_validate(m) for m in payment_methods],
    )


@router.get("/{slug}/products", response_model=list[PublicProduct])
def list_public_products(slug: str, db: Session = Depends(get_db)) -> list[PublicProduct]:
    try:
        store = public_store_service.get_active_store_by_slug(db, slug)
        products = public_store_service.list_available_products(db, store.id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    return [
        PublicProduct(
            id=product.id,
            title=product.title,
            description=product.description,
            price=product.price,
            stock_quantity=product.stock_quantity,
            images=[ProductImageResponse.model_validate(img) for img in product.images],
        )
        for product in products
    ]


@router.post(
    "/{slug}/orders",
    response_model=CheckoutResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_guest_order(
    slug: str,
    payload: GuestOrderCreate,
    db: Session = Depends(get_db),
) -> CheckoutResponse:
    try:
        return checkout_service.create_guest_order(db, slug, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
