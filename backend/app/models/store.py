from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.order import Order
    from app.models.payment_method import PaymentMethod
    from app.models.product import Product
    from app.models.user import User


class Store(TimestampMixin, Base):
    __tablename__ = "stores"
    __table_args__ = (UniqueConstraint("owner_id", name="uq_stores_owner_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    support_contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    owner: Mapped["User"] = relationship("User", back_populates="store")
    products: Mapped[list["Product"]] = relationship(
        "Product",
        back_populates="store",
        cascade="all, delete-orphan",
    )
    payment_methods: Mapped[list["PaymentMethod"]] = relationship(
        "PaymentMethod",
        back_populates="store",
        cascade="all, delete-orphan",
    )
    orders: Mapped[list["Order"]] = relationship(
        "Order",
        back_populates="store",
        cascade="all, delete-orphan",
    )
    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation",
        back_populates="store",
        cascade="all, delete-orphan",
    )
