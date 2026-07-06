from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.store import Store
from app.services import analytics_service

router = APIRouter(prefix="/stores", tags=["public-visits"])


@router.post("/{slug}/visit", status_code=status.HTTP_204_NO_CONTENT)
def record_store_visit(slug: str, db: Session = Depends(get_db)) -> None:
    store = db.scalar(
        select(Store).where(Store.slug == slug, Store.is_active.is_(True))
    )
    if store is None:
        raise HTTPException(status_code=404, detail="فروشگاه پیدا نشد")
    analytics_service.record_store_visit(db, store.id)
