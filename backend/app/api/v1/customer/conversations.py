from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_customer
from app.db.session import get_db
from app.models.customer_account import CustomerAccount
from app.schemas.chat import (
    ConversationCreate,
    ConversationDetailResponse,
    ConversationListItem,
    MessageCreate,
    MessageResponse,
)
from app.services import chat_service

router = APIRouter(prefix="/conversations", tags=["customer-conversations"])


@router.post("", response_model=ConversationListItem, status_code=201)
def create_conversation(
    payload: ConversationCreate,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> ConversationListItem:
    conversation = chat_service.get_or_create_conversation(
        db,
        customer_id=customer.id,
        store_id=payload.store_id,
        order_id=payload.order_id,
    )
    return chat_service.conversation_to_list_item_for_customer(db, conversation)


@router.get("", response_model=list[ConversationListItem])
def list_conversations(
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> list[ConversationListItem]:
    return chat_service.list_customer_conversations(db, customer.id)


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: int,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> ConversationDetailResponse:
    return chat_service.get_customer_conversation_detail(db, conversation_id, customer.id)


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
def send_message(
    conversation_id: int,
    payload: MessageCreate,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> MessageResponse:
    return chat_service.send_customer_message(db, conversation_id, customer.id, payload)
