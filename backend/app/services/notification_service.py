"""Multi-channel notification service (SMS + email).

Design:
- `enqueue_sms` / `enqueue_email` write a row to the `notification_outbox`
  table inside the caller's transaction (transactional outbox pattern).
- A background worker (started from the FastAPI lifespan) polls the outbox
  and delivers due notifications with exponential-backoff retries.
- Delivery goes through pluggable providers selected via settings:
  SMS_PROVIDER = console | kavenegar, EMAIL_PROVIDER = console | smtp.
  The `console` providers just log, so development and CI need no credentials.
"""

from __future__ import annotations

import asyncio
import json
import logging
import smtplib
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from typing import Optional, Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import NotificationOutbox

logger = logging.getLogger(__name__)

CHANNEL_SMS = "sms"
CHANNEL_EMAIL = "email"

STATUS_PENDING = "pending"
STATUS_SENT = "sent"
STATUS_FAILED = "failed"


@dataclass(frozen=True, slots=True)
class NotificationTemplate:
    sms_text: str
    email_subject: str
    email_body: str


# Persian templates. Placeholders are filled from the enqueued payload with
# str.format, so a missing key is treated as a delivery error (and retried
# only until max attempts).
TEMPLATES: dict[str, NotificationTemplate] = {
    "order_placed_buyer": NotificationTemplate(
        sms_text=(
            "\u0646\u06cc\u0634\u0627: \u0633\u0641\u0627\u0631\u0634 {invoice_code} \u062b\u0628\u062a \u0634\u062f \u0648 \u062f\u0631 \u0627\u0646\u062a\u0638\u0627\u0631 \u062a\u0627\u06cc\u06cc\u062f \u067e\u0631\u062f\u0627\u062e\u062a \u0627\u0633\u062a."
        ),
        email_subject="\u062b\u0628\u062a \u0633\u0641\u0627\u0631\u0634 {invoice_code}",
        email_body=(
            "\u0633\u0641\u0627\u0631\u0634 \u0634\u0645\u0627 \u0628\u0627 \u06a9\u062f {invoice_code} \u062f\u0631 \u0641\u0631\u0648\u0634\u06af\u0627\u0647 {store_name} \u062b\u0628\u062a \u0634\u062f \u0648 \u067e\u0633 \u0627\u0632 \u062a\u0627\u06cc\u06cc\u062f \u067e\u0631\u062f\u0627\u062e\u062a \u067e\u0631\u062f\u0627\u0632\u0634 \u0645\u06cc\u200c\u0634\u0648\u062f."
        ),
    ),
    "order_placed_seller": NotificationTemplate(
        sms_text=(
            "\u0646\u06cc\u0634\u0627: \u0633\u0641\u0627\u0631\u0634 \u062c\u062f\u06cc\u062f {invoice_code} \u062f\u0631 \u0641\u0631\u0648\u0634\u06af\u0627\u0647 {store_name} \u062b\u0628\u062a \u0634\u062f."
        ),
        email_subject="\u0633\u0641\u0627\u0631\u0634 \u062c\u062f\u06cc\u062f {invoice_code}",
        email_body=(
            "\u0633\u0641\u0627\u0631\u0634 \u062c\u062f\u06cc\u062f\u06cc \u0628\u0627 \u06a9\u062f {invoice_code} \u062f\u0631 \u0641\u0631\u0648\u0634\u06af\u0627\u0647 {store_name} \u062b\u0628\u062a \u0634\u062f. \u0628\u0631\u0627\u06cc \u0628\u0631\u0631\u0633\u06cc \u0628\u0647 \u067e\u0646\u0644 \u0641\u0631\u0648\u0634\u0646\u062f\u0647 \u0645\u0631\u0627\u062c\u0639\u0647 \u06a9\u0646\u06cc\u062f."
        ),
    ),
    "order_status_changed": NotificationTemplate(
        sms_text=(
            "\u0646\u06cc\u0634\u0627: \u0648\u0636\u0639\u06cc\u062a \u0633\u0641\u0627\u0631\u0634 {invoice_code} \u0628\u0647 \u00ab{status_label}\u00bb \u062a\u063a\u06cc\u06cc\u0631 \u06a9\u0631\u062f."
        ),
        email_subject="\u062a\u063a\u06cc\u06cc\u0631 \u0648\u0636\u0639\u06cc\u062a \u0633\u0641\u0627\u0631\u0634 {invoice_code}",
        email_body=(
            "\u0648\u0636\u0639\u06cc\u062a \u0633\u0641\u0627\u0631\u0634 {invoice_code} \u062f\u0631 \u0641\u0631\u0648\u0634\u06af\u0627\u0647 {store_name} \u0628\u0647 \u00ab{status_label}\u00bb \u062a\u063a\u06cc\u06cc\u0631 \u06a9\u0631\u062f."
        ),
    ),
    "test_message": NotificationTemplate(
        sms_text="\u0646\u06cc\u0634\u0627: \u067e\u06cc\u0627\u0645 \u0622\u0632\u0645\u0627\u06cc\u0634\u06cc {code}",
        email_subject="\u067e\u06cc\u0627\u0645 \u0622\u0632\u0645\u0627\u06cc\u0634\u06cc {code}",
        email_body="\u0627\u06cc\u0646 \u06cc\u06a9 \u067e\u06cc\u0627\u0645 \u0622\u0632\u0645\u0627\u06cc\u0634\u06cc \u0627\u0633\u062a: {code}",
    ),
}


class SmsProvider(Protocol):
    def send(self, to: str, text: str) -> None: ...


class EmailProvider(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...


class ConsoleSmsProvider:
    """Logs the SMS instead of sending it. Default in development/CI."""

    def send(self, to: str, text: str) -> None:
        logger.info("SMS (console provider) to %s: %s", to, text)


class KavenegarSmsProvider:
    """Sends SMS through the Kavenegar REST API."""

    def send(self, to: str, text: str) -> None:
        import httpx

        if not settings.KAVENEGAR_API_KEY:
            raise RuntimeError("KAVENEGAR_API_KEY is not configured")
        url = (
            "https://api.kavenegar.com/v1/"
            + settings.KAVENEGAR_API_KEY
            + "/sms/send.json"
        )
        data = {"receptor": to, "message": text}
        if settings.SMS_SENDER:
            data["sender"] = settings.SMS_SENDER
        response = httpx.post(url, data=data, timeout=15)
        response.raise_for_status()


class ConsoleEmailProvider:
    """Logs the email instead of sending it. Default in development/CI."""

    def send(self, to: str, subject: str, body: str) -> None:
        logger.info("Email (console provider) to %s [%s]: %s", to, subject, body)


class SmtpEmailProvider:
    """Sends email through a standard SMTP server."""

    def send(self, to: str, subject: str, body: str) -> None:
        if not settings.SMTP_HOST:
            raise RuntimeError("SMTP_HOST is not configured")
        message = MIMEText(body, "plain", "utf-8")
        message["Subject"] = subject
        message["From"] = settings.EMAIL_FROM or settings.SMTP_USERNAME
        message["To"] = to
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)


def get_sms_provider() -> SmsProvider:
    if settings.SMS_PROVIDER == "kavenegar":
        return KavenegarSmsProvider()
    return ConsoleSmsProvider()


def get_email_provider() -> EmailProvider:
    if settings.EMAIL_PROVIDER == "smtp":
        return SmtpEmailProvider()
    return ConsoleEmailProvider()


def _enqueue(
    db: Session,
    *,
    channel: str,
    recipient: str,
    template: str,
    payload: Optional[dict] = None,
) -> NotificationOutbox:
    if template not in TEMPLATES:
        raise ValueError("Unknown notification template: " + template)
    row = NotificationOutbox(
        channel=channel,
        recipient=recipient,
        template=template,
        payload_json=json.dumps(payload or {}, ensure_ascii=False),
        status=STATUS_PENDING,
        attempts=0,
        next_attempt_at=datetime.now(timezone.utc),
    )
    db.add(row)
    db.flush()
    return row


def enqueue_sms(
    db: Session, phone: str, template: str, payload: Optional[dict] = None
) -> NotificationOutbox:
    return _enqueue(
        db, channel=CHANNEL_SMS, recipient=phone, template=template, payload=payload
    )


def enqueue_email(
    db: Session, email: str, template: str, payload: Optional[dict] = None
) -> NotificationOutbox:
    return _enqueue(
        db, channel=CHANNEL_EMAIL, recipient=email, template=template, payload=payload
    )


def deliver_pending(
    db: Session,
    *,
    limit: int = 20,
    sms_provider: Optional[SmsProvider] = None,
    email_provider: Optional[EmailProvider] = None,
) -> int:
    """Deliver due pending notifications. Returns the number delivered.

    Failures increment `attempts` and schedule an exponential-backoff retry
    (1min, 4min, 16min, ...) until NOTIFY_MAX_ATTEMPTS, then mark `failed`.
    """
    now = datetime.now(timezone.utc)
    rows = db.scalars(
        select(NotificationOutbox)
        .where(NotificationOutbox.status == STATUS_PENDING)
        .where(NotificationOutbox.next_attempt_at <= now)
        .order_by(NotificationOutbox.id)
        .limit(limit)
    ).all()
    if not rows:
        return 0

    sms_provider = sms_provider or get_sms_provider()
    email_provider = email_provider or get_email_provider()
    delivered = 0

    for row in rows:
        template = TEMPLATES.get(row.template)
        try:
            if template is None:
                raise RuntimeError("Unknown template: " + row.template)
            payload = json.loads(row.payload_json or "{}")
            if row.channel == CHANNEL_SMS:
                sms_provider.send(row.recipient, template.sms_text.format(**payload))
            elif row.channel == CHANNEL_EMAIL:
                email_provider.send(
                    row.recipient,
                    template.email_subject.format(**payload),
                    template.email_body.format(**payload),
                )
            else:
                raise RuntimeError("Unknown channel: " + row.channel)
        except Exception as exc:  # noqa: BLE001 - any provider error is retryable
            row.attempts += 1
            row.last_error = str(exc)[:500]
            if row.attempts >= settings.NOTIFY_MAX_ATTEMPTS:
                row.status = STATUS_FAILED
                logger.error(
                    "Notification %s permanently failed after %s attempts: %s",
                    row.id,
                    row.attempts,
                    row.last_error,
                )
            else:
                backoff_seconds = 60 * (4 ** (row.attempts - 1))
                row.next_attempt_at = now + timedelta(seconds=backoff_seconds)
                logger.warning(
                    "Notification %s failed (attempt %s), retrying in %ss: %s",
                    row.id,
                    row.attempts,
                    backoff_seconds,
                    row.last_error,
                )
        else:
            row.attempts += 1
            row.status = STATUS_SENT
            row.sent_at = now
            row.last_error = None
            delivered += 1

    db.commit()
    return delivered


async def notification_worker_loop(stop_event: asyncio.Event) -> None:
    """Background loop that periodically delivers pending notifications."""
    from app.db.session import SessionLocal

    logger.info("Notification worker started")
    while not stop_event.is_set():
        try:
            with SessionLocal() as db:
                deliver_pending(db)
        except Exception:  # noqa: BLE001 - keep the worker alive
            logger.exception("Notification worker iteration failed")
        try:
            await asyncio.wait_for(
                stop_event.wait(), timeout=settings.NOTIFY_POLL_INTERVAL_SECONDS
            )
        except (asyncio.TimeoutError, TimeoutError):
            pass
    logger.info("Notification worker stopped")
