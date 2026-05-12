"""SQLAlchemy ORM models mirroring Supabase tables."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = (
        UniqueConstraint("email", "location_id", name="uq_subscriptions_email_location"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    email: Mapped[str] = mapped_column(String, nullable=False)
    location_id: Mapped[str] = mapped_column(String, nullable=False)
    hour_local: Mapped[int] = mapped_column(Integer, nullable=False, default=8)
    timezone: Mapped[str] = mapped_column(String, nullable=False, default="Europe/Sofia")
    confirm_token: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    unsubscribe_token: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class SentLog(Base):
    __tablename__ = "sent_log"

    subscription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subscriptions.id", ondelete="CASCADE"),
        primary_key=True,
    )
    send_date: Mapped["datetime.date"] = mapped_column(Date, primary_key=True)  # noqa: F821
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
