from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import OrderStatus, PaymentMethodType
from app.schemas.product import ProductImageResponse


class PublicStoreProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    phone: str | None
    support_contact: str | None


class PublicProduct(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    price: Decimal
    stock_quantity: int
    images: list[ProductImageResponse]


class PublicPaymentMethod(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: PaymentMethodType
    display_name: str
    card_number: str | None
    wallet_address: str | None
    external_url: str | None
    owner_name: str | None
    instructions: str | None


class PublicStorePageResponse(BaseModel):
    store: PublicStoreProfile
    products: list[PublicProduct]
    payment_methods: list[PublicPaymentMethod]


class OrderItemInput(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)


class GuestOrderCreate(BaseModel):
    buyer_name: str = Field(min_length=1, max_length=255)
    buyer_phone: str = Field(min_length=1, max_length=50)
    buyer_address: str = Field(min_length=1)
    buyer_note: str | None = None
    payment_method_id: int
    items: list[OrderItemInput] = Field(min_length=1)

    @model_validator(mode="after")
    def merge_duplicate_products(self) -> "GuestOrderCreate":
        merged: dict[int, int] = {}
        for item in self.items:
            merged[item.product_id] = merged.get(item.product_id, 0) + item.quantity
        self.items = [
            OrderItemInput(product_id=product_id, quantity=quantity)
            for product_id, quantity in merged.items()
        ]
        return self


class CheckoutOrderItemSummary(BaseModel):
    product_id: int
    product_title: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class CheckoutPaymentInstructions(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: PaymentMethodType
    display_name: str
    card_number: str | None
    wallet_address: str | None
    external_url: str | None
    owner_name: str | None
    instructions: str | None


class CheckoutResponse(BaseModel):
    invoice_code: str
    invoice_edit_password: str
    order_id: int
    status: OrderStatus
    subtotal_amount: Decimal
    total_amount: Decimal
    items: list[CheckoutOrderItemSummary]
    payment_method: CheckoutPaymentInstructions
