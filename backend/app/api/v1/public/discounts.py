from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.public import (
    PublicDiscountPreviewRequest,
    PublicDiscountPreviewResponse,
)
from app.services import discount_service
from app.services.exceptions import ServiceError
from app.services.public_store_service import get_active_store_by_slug

router = APIRouter(prefix="/stores", tags=["public-discounts"])


@router.post("/{slug}/discount-preview", response_model=PublicDiscountPreviewResponse)
def preview_discount(
    slug: str,
    payload: PublicDiscountPreviewRequest,
    db: Session = Depends(get_db),
) -> PublicDiscountPreviewResponse:
    """Validate a discount code against a cart subtotal before checkout."""
    try:
        store = get_active_store_by_slug(db, slug)
        discount, amount = discount_service.preview_discount(
            db, store.id, payload.code, payload.subtotal
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return PublicDiscountPreviewResponse(
        code=discount.code,
        discount_amount=amount,
        payable_amount=payload.subtotal - amount,
    )
