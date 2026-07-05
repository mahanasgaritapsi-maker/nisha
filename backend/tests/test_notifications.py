from datetime import datetime, timezone

import pytest
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.notification_service import (
    STATUS_FAILED,
    STATUS_PENDING,
    STATUS_SENT,
    deliver_pending,
    enqueue_email,
    enqueue_sms,
)


class RecordingSmsProvider:
    def __init__(self) -> None:
        self.sent: list[tuple[str, str]] = []

    def send(self, to: str, text: str) -> None:
        self.sent.append((to, text))


class RecordingEmailProvider:
    def __init__(self) -> None:
        self.sent: list[tuple[str, str, str]] = []

    def send(self, to: str, subject: str, body: str) -> None:
        self.sent.append((to, subject, body))


class FailingSmsProvider:
    def send(self, to: str, text: str) -> None:
        raise RuntimeError("provider down")


def test_enqueue_and_deliver_sms(db: Session) -> None:
    notification = enqueue_sms(
        db,
        "+989121000000",
        "order_placed_buyer",
        {"invoice_code": "INV-1001", "store_name": "Store A"},
    )
    db.commit()
    assert notification.status == STATUS_PENDING

    sms = RecordingSmsProvider()
    email = RecordingEmailProvider()
    delivered = deliver_pending(db, sms_provider=sms, email_provider=email)

    assert delivered == 1
    assert len(sms.sent) == 1
    assert sms.sent[0][0] == "+989121000000"
    assert "INV-1001" in sms.sent[0][1]
    assert email.sent == []

    db.refresh(notification)
    assert notification.status == STATUS_SENT
    assert notification.attempts == 1
    assert notification.sent_at is not None


def test_enqueue_and_deliver_email(db: Session) -> None:
    notification = enqueue_email(
        db,
        "buyer@example.com",
        "order_status_changed",
        {
            "invoice_code": "INV-2002",
            "store_name": "Store B",
            "status_label": "ارسال شد",
        },
    )
    db.commit()

    sms = RecordingSmsProvider()
    email = RecordingEmailProvider()
    delivered = deliver_pending(db, sms_provider=sms, email_provider=email)

    assert delivered == 1
    assert len(email.sent) == 1
    to, subject, body = email.sent[0]
    assert to == "buyer@example.com"
    assert "INV-2002" in subject
    assert "INV-2002" in body
    assert "ارسال شد" in body

    db.refresh(notification)
    assert notification.status == STATUS_SENT


def test_failed_delivery_retries_then_fails(db: Session) -> None:
    notification = enqueue_sms(
        db,
        "+989121000001",
        "order_placed_buyer",
        {"invoice_code": "INV-3003", "store_name": "Store C"},
    )
    db.commit()

    failing = FailingSmsProvider()
    email = RecordingEmailProvider()

    for attempt in range(settings.NOTIFY_MAX_ATTEMPTS):
        notification.next_attempt_at = datetime.now(timezone.utc)
        db.commit()
        delivered = deliver_pending(db, sms_provider=failing, email_provider=email)
        assert delivered == 0
        db.refresh(notification)
        assert notification.attempts == attempt + 1

    assert notification.status == STATUS_FAILED
    assert "provider down" in (notification.last_error or "")


def test_retry_is_scheduled_in_future(db: Session) -> None:
    notification = enqueue_sms(
        db,
        "+989121000002",
        "test_message",
        {"code": "1234"},
    )
    db.commit()

    deliver_pending(
        db, sms_provider=FailingSmsProvider(), email_provider=RecordingEmailProvider()
    )
    db.refresh(notification)

    assert notification.status == STATUS_PENDING
    assert notification.attempts == 1
    assert notification.next_attempt_at is not None

    # Not due yet, so another delivery pass must not pick it up.
    delivered = deliver_pending(
        db, sms_provider=FailingSmsProvider(), email_provider=RecordingEmailProvider()
    )
    assert delivered == 0
    db.refresh(notification)
    assert notification.attempts == 1


def test_unknown_template_rejected(db: Session) -> None:
    with pytest.raises(ValueError):
        enqueue_sms(db, "+989121000003", "no_such_template", {})
