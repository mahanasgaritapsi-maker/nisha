from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import AdminStoreActionResponse, AdminStoreListItem
from app.schemas.pagination import PaginatedResponse, build_paginated_response
from app.services import admin_store_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/stores", tags=["admin-stores"])


@router.get("", response_model=PaginatedResponse[AdminStoreListItem])
def list_stores(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> PaginatedResponse[AdminStoreListItem]:
    items, total = admin_store_service.list_stores_paginated(db, page=page, page_size=page_size)
    return build_paginated_response(items, total, page, page_size)


@router.patch("/{store_id}/activate", response_model=AdminStoreActionResponse)
def activate_store(
    store_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminStoreActionResponse:
    try:
        store = admin_store_service.set_store_active(db, store_id, is_active=True)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return AdminStoreActionResponse(message="Store activated", store=store)


@router.patch("/{store_id}/deactivate", response_model=AdminStoreActionResponse)
def deactivate_store(
    store_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminStoreActionResponse:
    try:
        store = admin_store_service.set_store_active(db, store_id, is_active=False)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return AdminStoreActionResponse(message="Store deactivated", store=store)
