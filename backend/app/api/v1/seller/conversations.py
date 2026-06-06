from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store, require_seller
from app.db.session import get_db
from app.models.store import Store
from app.models.user import User
from app.schemas.chat import (
    ConversationDetailResponse,
    ConversationListItem,
    MessageCreate,
    MessageResponse,
)
from app.services import chat_service

router = APIRouter(prefix="/conversations", tags=["seller-conversations"])


@router.get("", response_model=list[ConversationListItem])
def list_conversations(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> list[ConversationListItem]:
    return chat_service.list_seller_conversations(db, store.id)


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
