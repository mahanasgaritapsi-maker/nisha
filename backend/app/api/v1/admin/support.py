from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_admin
from app.core.security import create_access_token, create_refresh_token
from app.db.session import get_db
from app.models.store import Store
from app.models.user import User
from app.schemas.auth import TokenResponse
from app.schemas.user_mapper import user_to_response
from app.services.admin_audit_service import record_admin_action

router = APIRouter(prefix="/stores", tags=["admin-support"])


@router.post("/{store_id}/impersonate", response_model=TokenResponse)
def impersonate_store_owner(
    store_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Issue seller tokens for a store owner so support can debug their account.

    Every use is recorded in the admin audit log.
    """
    store = db.scalar(
        select(Store).options(selectinload(Store.owner)).where(Store.id == store_id)
    )
    if store is None:
        raise HTTPException(status_code=404, detail="فروشگاه پیدا نشد")
    owner = store.owner
    if owner is None or not owner.is_active:
        raise HTTPException(status_code=400, detail="مالک فروشگاه فعال نیست")

    record_admin_action(
        db,
        admin=admin,
        entity_type="store",
        entity_id=store.id,
        action="IMPERSONATE",
        entity_label=store.name,
        details={"owner_id": owner.id, "owner_email": owner.email},
    )
    db.commit()

    token = create_access_token(user_id=owner.id, role=owner.role.value)
    refresh_token = create_refresh_token(user_id=owner.id, role=owner.role.value)
    return TokenResponse(
        access_token=token,
        refresh_token=refresh_token,
        user=user_to_response(owner),
    )
