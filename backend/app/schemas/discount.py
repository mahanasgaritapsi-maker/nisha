from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

DiscountType = Literal["PERCENT", "FIXED"]


class DiscountCodeBase(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    description: str | None = Field(default=None, max_length=255)
    discount_type: DiscountType
    percent_off: Decimal | None = Field(default=None, gt=0, le=100)
    amount_off: Decimal | None = Field(default=None, gt=0)
    min_order_amount: Decimal | None = Field(default=None, ge=0)
    max_uses: int | None = Field(default=None, ge=1)
    starts_at: datetime | None = None
    expires_at: datetime | None = None
    is_active: bool = True


class DiscountCodeCreate(DiscountCodeBase):
    @model_validator(mode="after")
    def validate_type_fields(self) -> "DiscountCodeCreate":
        if self.discount_type == "PERCENT" and self.percent_off is None:
            raise ValueError("percent_off is required for PERCENT discounts")
        if self.discount_type == "FIXED" and self.amount_off is None:
            raise ValueError("amount_off is required for FIXED discounts")
        return self


class DiscountCodeUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=50)
    description: str | None = Field(default=None, max_length=255)
    discount_type: DiscountType | None = None
    percent_off: Decimal | None = Field(default=None, gt=0, le=100)
    amount_off: Decimal | None = Field(default=None, gt=0)
    min_order_amount: Decimal | None = Field(default=None, ge=0)
    max_uses: int | None = Field(default=None, ge=1)
    starts_at: datetime | None = None
    expires_at: datetime | None = None
    is_active: bool | None = None


class DiscountCodeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    description: str | None
    discount_type: str
    percent_off: Decimal | None
    amount_off: Decimal | None
    min_order_amount: Decimal | None
    max_uses: int | None
    used_count: int
    starts_at: datetime | None
    expires_at: datetime | None
    is_active: bool
    created_at: datetime
