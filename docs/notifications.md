# Notifications (SMS + Email)

Nisha uses a **transactional outbox** for notifications:

1. Business code enqueues a notification (`enqueue_sms` / `enqueue_email` in
   `backend/app/services/notification_service.py`) inside the same DB
   transaction as the change itself.
2. A background worker (started with the API process) polls the
   `notification_outbox` table every `NOTIFY_POLL_INTERVAL_SECONDS` and
   delivers due rows.
3. Failures are retried with exponential backoff (1m, 4m, 16m, ...) up to
   `NOTIFY_MAX_ATTEMPTS`, then marked `failed` with the last error stored on
   the row.

Templates are Persian and live in `TEMPLATES` in the service module. Current
templates: `order_placed_buyer`, `order_placed_seller`, `order_status_changed`,
`test_message`.

## Providers

Providers are selected via environment variables. The default `console`
providers only log the message, so **development, tests and CI need no
credentials** and nothing is actually sent.

### SMS

| Variable | Values | Notes |
| --- | --- | --- |
| `SMS_PROVIDER` | `console` (default), `kavenegar` | |
| `KAVENEGAR_API_KEY` | string | required for `kavenegar` |
| `SMS_SENDER` | string | optional dedicated sender line |

To use another Iranian SMS gateway (SMS.ir, Melipayamak, ...), add a small
provider class implementing `send(to, text)` and extend `get_sms_provider`.

### Email

| Variable | Values | Notes |
| --- | --- | --- |
| `EMAIL_PROVIDER` | `console` (default), `smtp` | |
| `SMTP_HOST` / `SMTP_PORT` | host / port (default 587) | |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | credentials | optional for open relays |
| `SMTP_USE_TLS` | `true` (default) / `false` | STARTTLS |
| `EMAIL_FROM` | address | falls back to `SMTP_USERNAME` |

## Worker

| Variable | Default | Notes |
| --- | --- | --- |
| `NOTIFY_WORKER_ENABLED` | `true` | worker only runs against PostgreSQL |
| `NOTIFY_POLL_INTERVAL_SECONDS` | `15` | |
| `NOTIFY_MAX_ATTEMPTS` | `5` | then the row is marked `failed` |

All variables are passed through in `docker-compose.prod.yml`; set them in the
server `.env` file.

## Enqueuing from code

```python
from app.services.notification_service import enqueue_sms

enqueue_sms(
    db,
    order.buyer_phone,
    "order_status_changed",
    {
        "invoice_code": order.invoice_code,
        "store_name": store.name,
        "status_label": "ارسال شد",
    },
)
# the surrounding service commits; the worker delivers it asynchronously
```

Order-lifecycle hooks (enqueue on order placement and status changes) are
implemented separately as roadmap task 12.

## Operations

- Failed rows: `SELECT * FROM notification_outbox WHERE status = 'failed';`
- Re-queue a failed row:
  `UPDATE notification_outbox SET status = 'pending', attempts = 0, next_attempt_at = now() WHERE id = <id>;`
