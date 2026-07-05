<<<<<<< HEAD
from fastapi import APIRouter, Depends, Query
=======
from fastapi import APIRouter, Depends
>>>>>>> 11bf578476c05d667376c7b9fff2f0778bebdd66
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store, require_seller
from app.db.session import get_db
from app.models.store import Store
from app.models.user import User
from app.schemas.chat import (
    ConversationDetailResponse,
    ConversationListItem,
<<<<<<< HEAD
    ConversationListResponse,
=======
>>>>>>> 11bf578476c05d667376c7b9fff2f0778bebdd66
    MessageCreate,
    MessageResponse,
)
from app.services import chat_service

router = APIRouter(prefix="/conversations", tags=["seller-conversations"])


<<<<<<< HEAD
@router.get("", response_model=ConversationListResponse)
def list_conversations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> ConversationListResponse:
    return chat_service.list_seller_conversations(
        db,
        store.id,
        page=page,
        page_size=page_size,
    )
=======
@router.get("", response_model=list[ConversationListItem])
def list_conversations(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> list[ConversationListItem]:
    return chat_service.list_seller_conversations(db, store.id)
>>>>>>> 11bf578476c05d667376c7b9fff2f0778bebdd66


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: int,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> ConversationDetailResponse:
    return chat_service.get_seller_conversation_detail(db, conversation_id, store.id)


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
def send_message(
    conversation_id: int,
    payload: MessageCreate,
    store: Store = Depends(get_seller_store),
    seller: User = Depends(require_seller),
    db: Session = Depends(get_db),
) -> MessageResponse:
    return chat_service.send_seller_message(db, conversation_id, store.id, seller, payload)
