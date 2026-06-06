from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    phone: str | None
    support_contact: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class StoreUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    logo_url: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=50)
    support_contact: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "StoreUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self
