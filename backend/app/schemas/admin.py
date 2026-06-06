from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.enums import OrderStatus
from app.schemas.guest_order import OrderStatusHistoryResponse, PaymentProofResponse
from app.schemas.payment_method import PaymentMethodResponse
from app.schemas.seller_order import SellerOrderItemResponse


class AdminRecentOrderItem(BaseModel):
    id: int
    invoice_code: str
    status: OrderStatus
    total_amount: Decimal
    store_name: str
    store_slug: str
    buyer_name: str
    created_at: datetime


class AdminDashboardResponse(BaseModel):
    total_stores: int
    active_stores: int
    inactive_stores: int
    total_sellers: int
    total_products: int
    total_orders: int
    confirmed_revenue: Decimal
    pending_revenue: Decimal
    recent_orders: list[AdminRecentOrderItem]


class AdminStoreListItem(BaseModel):
    id: int
    name: str
    slug: str
    owner_email: str
    is_active: bool
    product_count: int
    order_count: int
    created_at: datetime


class AdminStoreActionResponse(BaseModel):
    message: str
    store: AdminStoreListItem


class AdminOrderListItem(BaseModel):
    id: int
    invoice_code: str
    status: OrderStatus
    buyer_name: str
    buyer_phone: str
    total_amount: Decimal
    store_id: int
    store_name: str
    store_slug: str
    created_at: datetime


class AdminOrderDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_code: str
    status: OrderStatus
    buyer_name: str
    buyer_phone: str
    buyer_address: str
    buyer_note: str | None
    subtotal_amount: Decimal
    total_amount: Decimal
    stock_restored: bool
    store_id: int
    store_name: str
    store_slug: str
    created_at: datetime
    updated_at: datetime
    items: list[SellerOrderItemResponse]
    payment_method: PaymentMethodResponse
    payment_proofs: list[PaymentProofResponse]
    status_history: list[OrderStatusHistoryResponse]
