from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.conversation import Conversation
from app.models.customer_account import CustomerAccount
from app.models.enums import SenderType
from app.models.message import Message
from app.models.order import Order
from app.models.store import Store
from app.models.user import User
from app.schemas.chat import (
    ConversationDetailResponse,
    ConversationListItem,
    MessageCreate,
    MessageResponse,
)
from app.services.exceptions import ServiceError


def _message_to_response(message: Message) -> MessageResponse:
    return MessageResponse.model_validate(message)


def _conversation_list_item(
    conversation: Conversation,
    *,
    store_name: str,
    store_slug: str,
    customer_name: str,
    invoice_code: str | None,
    unread_count: int,
    last_message: Message | None,
) -> ConversationListItem:
    return ConversationListItem(
        id=conversation.id,
        store_id=conversation.store_id,
        store_name=store_name,
        store_slug=store_slug,
        customer_id=conversation.customer_id,
        customer_name=customer_name,
        order_id=conversation.order_id,
        invoice_code=invoice_code,
        unread_count=unread_count,
        last_message_body=last_message.body if last_message else None,
        last_message_at=last_message.created_at if last_message else None,
        updated_at=conversation.updated_at,
    )


def _get_invoice_code(db: Session, order_id: int | None) -> str | None:
    if order_id is None:
        return None
    order = db.get(Order, order_id)
    return order.invoice_code if order else None


def conversation_to_list_item_for_customer(
    db: Session,
    conversation: Conversation,
) -> ConversationListItem:
    store = db.get(Store, conversation.store_id)
    customer = db.get(CustomerAccount, conversation.customer_id)
    if store is None or customer is None:
        raise ServiceError("Conversation not found", status_code=404)
    last_msg = _last_message(db, conversation.id)
    return _conversation_list_item(
        conversation,
        store_name=store.name,
        store_slug=store.slug,
        customer_name=customer.full_name,
        invoice_code=_get_invoice_code(db, conversation.order_id),
        unread_count=_unread_count(db, conversation.id, for_sender_type=SenderType.SELLER),
        last_message=last_msg,
    )


def get_or_create_conversation(
    db: Session,
    *,
    customer_id: int,
    store_id: int,
    order_id: int | None = None,
) -> Conversation:
    store = db.get(Store, store_id)
    if store is None or not store.is_active:
        raise ServiceError("Store not found", status_code=404)

    if order_id is not None:
        order = db.get(Order, order_id)
        if order is None or order.store_id != store_id:
            raise ServiceError("Order not found", status_code=404)

    conversation = db.scalar(
        select(Conversation).where(
            Conversation.store_id == store_id,
            Conversation.customer_id == customer_id,
        )
    )
    if conversation is None:
        conversation = Conversation(
            store_id=store_id,
            customer_id=customer_id,
            order_id=order_id,
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    elif order_id is not None and conversation.order_id is None:
        conversation.order_id = order_id
        db.commit()
        db.refresh(conversation)

    return conversation


def _unread_count(
    db: Session,
    conversation_id: int,
    *,
    for_sender_type: SenderType,
) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(Message)
            .where(
                Message.conversation_id == conversation_id,
                Message.sender_type == for_sender_type,
                Message.is_read.is_(False),
            )
        )
        or 0
    )


def _last_message(db: Session, conversation_id: int) -> Message | None:
    return db.scalar(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(1)
    )


def list_customer_conversations(
    db: Session,
    customer_id: int,
) -> list[ConversationListItem]:
    conversations = db.scalars(
        select(Conversation)
        .where(Conversation.customer_id == customer_id)
        .order_by(Conversation.updated_at.desc())
    ).all()

    items: list[ConversationListItem] = []
    for conv in conversations:
        store = db.get(Store, conv.store_id)
        customer = db.get(CustomerAccount, conv.customer_id)
        if store is None or customer is None:
            continue
        last_msg = _last_message(db, conv.id)
        items.append(
            _conversation_list_item(
                conv,
                store_name=store.name,
                store_slug=store.slug,
                customer_name=customer.full_name,
                invoice_code=_get_invoice_code(db, conv.order_id),
                unread_count=_unread_count(db, conv.id, for_sender_type=SenderType.SELLER),
                last_message=last_msg,
            )
        )
    return items


def list_seller_conversations(db: Session, store_id: int) -> list[ConversationListItem]:
    conversations = db.scalars(
        select(Conversation)
        .where(Conversation.store_id == store_id)
        .order_by(Conversation.updated_at.desc())
    ).all()

    items: list[ConversationListItem] = []
    for conv in conversations:
        store = db.get(Store, conv.store_id)
        customer = db.get(CustomerAccount, conv.customer_id)
        if store is None or customer is None:
            continue
        last_msg = _last_message(db, conv.id)
        items.append(
            _conversation_list_item(
                conv,
                store_name=store.name,
                store_slug=store.slug,
                customer_name=customer.full_name,
                invoice_code=_get_invoice_code(db, conv.order_id),
                unread_count=_unread_count(db, conv.id, for_sender_type=SenderType.CUSTOMER),
                last_message=last_msg,
            )
        )
    return items


def _load_conversation(db: Session, conversation_id: int) -> Conversation:
    conversation = db.scalar(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id)
    )
    if conversation is None:
        raise ServiceError("Conversation not found", status_code=404)
    return conversation


def _mark_messages_read(
    db: Session,
    conversation_id: int,
    *,
    reader_is_customer: bool,
) -> None:
    sender_to_mark = SenderType.SELLER if reader_is_customer else SenderType.CUSTOMER
    messages = db.scalars(
        select(Message).where(
            Message.conversation_id == conversation_id,
            Message.sender_type == sender_to_mark,
            Message.is_read.is_(False),
        )
    ).all()
    for message in messages:
        message.is_read = True
    if messages:
        db.commit()


def get_customer_conversation_detail(
    db: Session,
    conversation_id: int,
    customer_id: int,
) -> ConversationDetailResponse:
    conversation = _load_conversation(db, conversation_id)
    if conversation.customer_id != customer_id:
        raise ServiceError("Conversation not found", status_code=404)

    store = db.get(Store, conversation.store_id)
    customer = db.get(CustomerAccount, conversation.customer_id)
    if store is None or customer is None:
        raise ServiceError("Conversation not found", status_code=404)

    _mark_messages_read(db, conversation_id, reader_is_customer=True)
    conversation = _load_conversation(db, conversation_id)

    return ConversationDetailResponse(
        id=conversation.id,
        store_id=conversation.store_id,
        store_name=store.name,
        store_slug=store.slug,
        customer_id=conversation.customer_id,
        customer_name=customer.full_name,
        order_id=conversation.order_id,
        invoice_code=_get_invoice_code(db, conversation.order_id),
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[_message_to_response(m) for m in conversation.messages],
    )


def get_seller_conversation_detail(
    db: Session,
    conversation_id: int,
    store_id: int,
) -> ConversationDetailResponse:
    conversation = _load_conversation(db, conversation_id)
    if conversation.store_id != store_id:
        raise ServiceError("Conversation not found", status_code=404)

    store = db.get(Store, conversation.store_id)
    customer = db.get(CustomerAccount, conversation.customer_id)
    if store is None or customer is None:
        raise ServiceError("Conversation not found", status_code=404)

    _mark_messages_read(db, conversation_id, reader_is_customer=False)
    conversation = _load_conversation(db, conversation_id)

    return ConversationDetailResponse(
        id=conversation.id,
        store_id=conversation.store_id,
        store_name=store.name,
        store_slug=store.slug,
        customer_id=conversation.customer_id,
        customer_name=customer.full_name,
        order_id=conversation.order_id,
        invoice_code=_get_invoice_code(db, conversation.order_id),
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[_message_to_response(m) for m in conversation.messages],
    )


def send_customer_message(
    db: Session,
    conversation_id: int,
    customer_id: int,
    payload: MessageCreate,
) -> MessageResponse:
    conversation = db.get(Conversation, conversation_id)
    if conversation is None or conversation.customer_id != customer_id:
        raise ServiceError("Conversation not found", status_code=404)

    message = Message(
        conversation_id=conversation_id,
        sender_type=SenderType.CUSTOMER,
        sender_user_id=None,
        body=payload.body.strip(),
        attachment_url=payload.attachment_url,
        is_read=False,
    )
    conversation.updated_at = datetime.now(UTC)
    conversation.updated_at = datetime.now(UTC)
    db.add(message)
    db.commit()
    db.refresh(message)
    return _message_to_response(message)


def send_seller_message(
    db: Session,
    conversation_id: int,
    store_id: int,
    seller: User,
    payload: MessageCreate,
) -> MessageResponse:
    conversation = db.get(Conversation, conversation_id)
    if conversation is None or conversation.store_id != store_id:
        raise ServiceError("Conversation not found", status_code=404)

    message = Message(
        conversation_id=conversation_id,
        sender_type=SenderType.SELLER,
        sender_user_id=seller.id,
        body=payload.body.strip(),
        attachment_url=payload.attachment_url,
        is_read=False,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return _message_to_response(message)
