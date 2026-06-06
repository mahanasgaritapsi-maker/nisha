from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.db.session import get_db
from app.models.store import Store
from app.schemas.store import StoreResponse, StoreUpdate
from app.services import store_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/store", tags=["seller-store"])


@router.get("", response_model=StoreResponse)
def get_my_store(store: Store = Depends(get_seller_store)) -> Store:
    return store_service.get_store(store)


@router.put("", response_model=StoreResponse)
def update_my_store(
    payload: StoreUpdate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> Store:
    try:
        return store_service.update_store(db, store, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
