from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    sort_order: int


class ProductCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    price: Decimal = Field(gt=0)
    stock_quantity: int = Field(ge=0, default=0)
    is_active: bool = True
    image_urls: list[str] | None = None


class ProductUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    image_urls: list[str] | None = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: int
    title: str
    description: str | None
    price: Decimal
    stock_quantity: int
    is_active: bool
    images: list[ProductImageResponse]
    created_at: datetime
    updated_at: datetime
