from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.store import Store
from app.schemas.store import StoreUpdate
from app.services.exceptions import ServiceError
from app.utils.slug import is_slug_taken, slugify


def get_store(store: Store) -> Store:
    return store


def update_store(db: Session, store: Store, data: StoreUpdate) -> Store:
    update_data = data.model_dump(exclude_unset=True)

    if "slug" in update_data:
        update_data["slug"] = slugify(update_data["slug"])
        if is_slug_taken(db, update_data["slug"], exclude_store_id=store.id):
            raise ServiceError("Slug already taken", status_code=409)

    for field, value in update_data.items():
        setattr(store, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError("Slug already taken", status_code=409) from exc

    db.refresh(store)
    return store
