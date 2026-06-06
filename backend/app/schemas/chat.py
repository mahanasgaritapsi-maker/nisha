from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import SenderType


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)
    attachment_url: str | None = Field(default=None, max_length=500)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_type: SenderType
    sender_user_id: int | None
    body: str
    attachment_url: str | None
    is_read: bool
    created_at: datetime


class ConversationCreate(BaseModel):
    store_id: int
    order_id: int | None = None


class ConversationListItem(BaseModel):
    id: int
    store_id: int
    store_name: str
    store_slug: str
    customer_id: int
    customer_name: str
    order_id: int | None
    invoice_code: str | None
    unread_count: int
    last_message_body: str | None
    last_message_at: datetime | None
    updated_at: datetime


class ConversationDetailResponse(BaseModel):
    id: int
    store_id: int
    store_name: str
    store_slug: str
    customer_id: int
    customer_name: str
    order_id: int | None
    invoice_code: str | None
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse]
