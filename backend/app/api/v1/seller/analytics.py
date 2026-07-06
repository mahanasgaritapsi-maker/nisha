from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.db.session import get_db
from app.models.store import Store
from app.schemas.analytics import SellerAnalyticsResponse
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["seller-analytics"])


@router.get("", response_model=SellerAnalyticsResponse)
def get_analytics(
    days: int = Query(default=30, ge=1, le=90),
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> SellerAnalyticsResponse:
    return analytics_service.get_seller_analytics(db, store.id, days=days)
