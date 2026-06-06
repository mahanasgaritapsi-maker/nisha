from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.db.session import get_db
from app.models.store import Store
from app.schemas.pagination import PaginatedResponse, build_paginated_response
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services import product_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/products", tags=["seller-products"])


@router.get("", response_model=PaginatedResponse[ProductResponse])
def list_my_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> PaginatedResponse[ProductResponse]:
    products, total = product_service.list_products_paginated(
        db, store, page=page, page_size=page_size
    )
    items = [ProductResponse.model_validate(product) for product in products]
    return build_paginated_response(items, total, page, page_size)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> ProductResponse:
    try:
        product = product_service.create_product(db, store, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return ProductResponse.model_validate(product)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> ProductResponse:
    try:
        product = product_service.get_product(db, store, product_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> ProductResponse:
    try:
        product = product_service.update_product(db, store, product_id, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> Response:
    try:
        product_service.delete_product(db, store, product_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
