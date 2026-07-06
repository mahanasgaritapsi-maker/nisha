from decimal import Decimal

from pydantic import BaseModel, Field


class AnalyticsDailyPoint(BaseModel):
    date: str
    orders: int
    revenue: Decimal
    visits: int


class AnalyticsTotals(BaseModel):
    orders: int
    revenue: Decimal
    visits: int
    conversion_rate: float


class TopProductItem(BaseModel):
    product_id: int | None
    title: str
    quantity: int
    revenue: Decimal


class SellerAnalyticsResponse(BaseModel):
    days: int
    daily: list[AnalyticsDailyPoint] = Field(default_factory=list)
    totals: AnalyticsTotals
    top_products: list[TopProductItem] = Field(default_factory=list)
