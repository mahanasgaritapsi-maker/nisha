# 📘 راهنمای راه‌اندازی و بهره‌برداری نیشا (Runbook)

این سند خلاصه همه کارهایی است که تا الان روی زیرساخت و فازهای نقشه راه انجام شده، به‌علاوه **چک‌لیست دقیق کارهایی که خودت باید انجام بدهی** تا سیستم بدون مشکل بالا بیاید. هر بخش به سند فنی کامل‌ترش لینک شده است.

> آخرین به‌روزرسانی: تیر ۱۴۰۵ (ژوئیه ۲۰۲۶) — تا پایان تسک ۱۲ نقشه راه

---

## ۱. معماری در یک نگاه

- **بک‌اند:** FastAPI + SQLAlchemy + Alembic (پوشه `backend/`)
- **فرانت‌اند:** Next.js (پوشه `frontend/`)
- **دیتابیس:** PostgreSQL (در پروداکشن) / SQLite (در تست‌ها)
- **اجرا:** Docker Compose — فایل `docker-compose.prod.yml` برای پروداکشن و `docker-compose.staging.yml` برای استیجینگ
- مایگریشن‌های دیتابیس **به‌صورت خودکار** موقع بالا آمدن بک‌اند اجرا می‌شوند (فقط روی PostgreSQL).
- سلامت سرویس: `GET /api/v1/health`

---

## ۲. چه چیزهایی تا الان ساخته شده

| تسک | چه چیزی ساخته شد | سند کامل |
| --- | --- | --- |
| ۱ — CI/CD | گیت‌هاب اکشنز با ۴ جاب: تست بک‌اند، لینت و بیلد فرانت، بیلد داکر، ممیزی امنیتی (pip-audit + npm audit) | فایل `.github/workflows/ci.yml` |
| ۲ — استیجینگ | کانفیگ استیجینگ جدا با `docker-compose.staging.yml` و `.env.staging.example` | `docs/staging.md` |
| ۳ — تست و کاورج | pytest-cov، `backend/pytest.ini`، اسکلت تست E2E با Playwright در `e2e/` | `docs/testing.md` |
| ۴ — مانیتورینگ | Sentry (با متغیر `SENTRY_DSN` فعال می‌شود) + لاگ JSON با request-id | `docs/monitoring.md` |
| ۵ — هدرهای امنیتی | میدل‌ور هدرهای امنیتی (CSP, HSTS و...) | `docs/monitoring.md` |
| ۶ — بکاپ | سرویس `db-backup` در کامپوز پروداکشن + دستور ریستور | `docs/backup.md` |
| ۷ — آبجکت استوریج | لایه استوریج با دو بک‌اند `local` و `s3` (سازگار با هر سرویس S3-compatible مثل آروان/لیارا) | `docs/object-storage.md` |
| ۹ — لاگ ساختاریافته | لاگ JSON + شناسه درخواست در همه لاگ‌ها | `docs/monitoring.md` |
| ۱۰ — تست بار | اسکریپت‌های k6 (اسموک و بار) | `docs/load-testing.md` |
| ۱۱ — سرویس نوتیفیکیشن | صف نوتیفیکیشن (outbox) + ورکر پس‌زمینه + پیامک کاوه‌نگار + ایمیل SMTP + قالب‌های فارسی | `docs/notifications.md` |
| ۱۲ — نوتیفیکیشن چرخه سفارش | پیامک به خریدار و ایمیل به فروشنده در ثبت سفارش، ثبت رسید پرداخت و هر تغییر وضعیت | `docs/notifications.md` |

---

## ۳. چک‌لیست راه‌اندازی پروداکشن (گام‌به‌گام)

### گام ۱ — آماده‌سازی سرور

1. یک سرور لینوکسی (Ubuntu 22.04 یا جدیدتر) با حداقل ۲ گیگ رم تهیه کن.
2. Docker و Docker Compose را نصب کن.
3. ریپازیتوری را کلون کن:

```bash
git clone <آدرس ریپو>
cd nisha
```

### گام ۲ — ساخت فایل `.env`

کنار `docker-compose.prod.yml` یک فایل `.env` بساز. **متغیرهای الزامی:**

```env
# --- الزامی ---
POSTGRES_PASSWORD=یک-رمز-قوی-و-تصادفی
JWT_SECRET_KEY=یک-کلید-تصادفی-حداقل-۳۲-کاراکتر
CORS_ORIGINS=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com
```

**متغیرهای اختیاری (سرویس‌ها را فعال می‌کنند):**

```env
# --- مانیتورینگ خطا (بخش ۴.۱) ---
SENTRY_DSN=

# --- آبجکت استوریج به‌جای دیسک لوکال (بخش ۴.۲) ---
STORAGE_BACKEND=local        # یا s3
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ENDPOINT_URL=             # برای آروان/لیارا الزامی
S3_PUBLIC_BASE_URL=          # اختیاری، مثل آدرس CDN

# --- پیامک (بخش ۴.۳) ---
SMS_PROVIDER=console         # یا kavenegar
KAVENEGAR_API_KEY=
SMS_SENDER=

# --- ایمیل (بخش ۴.۴) ---
EMAIL_PROVIDER=console       # یا smtp
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
EMAIL_FROM=
```

⚠️ تا وقتی `SMS_PROVIDER` و `EMAIL_PROVIDER` روی `console` باشند، هیچ پیام واقعی ارسال نمی‌شود و پیام‌ها فقط در لاگ ثبت می‌شوند — برای تست بی‌خطر است.

### گام ۳ — بالا آوردن سرویس‌ها

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

- مایگریشن‌های دیتابیس خودکار اجرا می‌شوند.
- بک‌اند روی `127.0.0.1:9000` و فرانت روی `127.0.0.1:3000` گوش می‌دهند؛ جلوی آن‌ها یک reverse proxy مثل Nginx یا Caddy با SSL بگذار.

### گام ۴ — بررسی سلامت

```bash
curl http://127.0.0.1:9000/api/v1/health
docker compose -f docker-compose.prod.yml logs backend --tail 50
```

در لاگ باید پیام `Notification worker started` را ببینی (یعنی ورکر نوتیفیکیشن فعال است).

---

## ۴. فعال‌سازی سرویس‌های جانبی

### ۴.۱ — Sentry (رصد خطاها)

1. در [sentry.io](https://sentry.io) حساب رایگان بساز و یک پروژه Python/FastAPI ایجاد کن.
2. مقدار DSN را در `.env` بگذار (`SENTRY_DSN=...`) و کانتینر بک‌اند را ری‌استارت کن.
3. جزئیات بیشتر: `docs/monitoring.md`

### ۴.۲ — آبجکت استوریج (S3)

1. از آروان‌کلاد / لیارا / هر سرویس S3-compatible یک باکت **عمومی (public-read)** بساز.
2. کلیدها و `S3_ENDPOINT_URL` را در `.env` بگذار و `STORAGE_BACKEND=s3` کن.
3. جزئیات و نکات مهاجرت فایل‌های قدیمی: `docs/object-storage.md`

### ۴.۳ — پیامک کاوه‌نگار

1. در [kavenegar.com](https://kavenegar.com) حساب بساز و API Key بگیر.
2. در `.env` مقدار `SMS_PROVIDER=kavenegar` و `KAVENEGAR_API_KEY=...` را بگذار (و در صورت داشتن خط اختصاصی، `SMS_SENDER`).
3. ری‌استارت کن — از این لحظه پیامک‌های چرخه سفارش واقعی ارسال می‌شوند.

### ۴.۴ — ایمیل SMTP

1. یک سرویس SMTP (مثل ایمیل هاست یا Mailgun/Zoho) آماده کن.
2. `EMAIL_PROVIDER=smtp` + مقادیر `SMTP_*` و `EMAIL_FROM` را تنظیم کن.

### نوتیفیکیشن‌های خودکار سفارش (تسک ۱۲)

| رویداد | گیرنده | کانال |
| --- | --- | --- |
| ثبت سفارش جدید | خریدار | پیامک |
| ثبت سفارش جدید | فروشنده (ایمیل حساب) | ایمیل |
| آپلود رسید پرداخت | فروشنده | ایمیل |
| تایید/رد پرداخت، آماده‌سازی، ارسال، تحویل، لغو | خریدار | پیامک |

خطا در صف نوتیفیکیشن **هرگز ثبت سفارش را خراب نمی‌کند**؛ ارسال‌های ناموفق تا ۵ بار با فاصله تلاش مجدد می‌شوند. مدیریت صف: `docs/notifications.md` بخش Operations.

---

## ۵. بکاپ و بازیابی

- سرویس `db-backup` هر شب از دیتابیس بکاپ می‌گیرد (پوشه `backups/`).
- 🔴 **حتما یک بار تمرین بازیابی (restore drill) انجام بده** تا مطمئن شوی بکاپ‌ها سالم‌اند — دستورش در `docs/backup.md` است.
- از پوشه `uploads/` (یا باکت S3) هم جدا بکاپ بگیر.

---

## ۶. کارهایی که فقط خودت می‌توانی انجام بدهی (چک‌لیست لانچ)

- [ ] سرور + دامنه + SSL (گام‌های بخش ۳)
- [ ] مقداردهی `.env` پروداکشن با رمزهای قوی
- [ ] ساخت حساب Sentry و گذاشتن `SENTRY_DSN`
- [ ] ساخت باکت S3 و گذاشتن کلیدها (یا آگاهانه با `local` ادامه بده)
- [ ] حساب کاوه‌نگار + `KAVENEGAR_API_KEY`
- [ ] تنظیم SMTP برای ایمیل
- [ ] یک بار بالا آوردن محیط استیجینگ (`docs/staging.md`)
- [ ] اجرای تست بار k6 روی استیجینگ (`docs/load-testing.md`)
- [ ] تمرین بازیابی بکاپ (`docs/backup.md`)
- [ ] یک خرید آزمایشی کامل: ثبت سفارش → آپلود رسید → تایید فروشنده → بررسی رسیدن پیامک/ایمیل

---

## ۷. عیب‌یابی سریع

| مشکل | اولین کار |
| --- | --- |
| سایت بالا نمی‌آید | `docker compose -f docker-compose.prod.yml ps` و بعد `logs backend` |
| خطای ۵۰۰ | لاگ JSON بک‌اند را ببین؛ `request_id` خطا را دنبال کن؛ اگر Sentry فعال است همان‌جا جزئیات هست |
| پیامک/ایمیل نمی‌رسد | ۱) مطمئن شو provider روی `console` نیست ۲) جدول صف را چک کن: `SELECT * FROM notification_outbox ORDER BY id DESC LIMIT 20;` ستون `last_error` علت را می‌گوید |
| تصاویر آپلود نمی‌شوند | اگر `STORAGE_BACKEND=s3` است، کلیدها و دسترسی public-read باکت را چک کن (`docs/object-storage.md`) |
| دیتابیس خراب شد | از آخرین بکاپ در `backups/` طبق `docs/backup.md` بازیابی کن |

---

## ۸. نقشه اسناد

| سند | موضوع |
| --- | --- |
| `docs/RUNBOOK.fa.md` | همین سند — نقطه شروع |
| `docs/staging.md` | محیط استیجینگ |
| `docs/testing.md` | تست‌ها، کاورج و E2E |
| `docs/monitoring.md` | Sentry، لاگ‌ها و هدرهای امنیتی |
| `docs/backup.md` | بکاپ و بازیابی |
| `docs/object-storage.md` | استوریج فایل‌ها (local/S3) |
| `docs/load-testing.md` | تست بار با k6 |
| `docs/notifications.md` | سرویس نوتیفیکیشن و هوک‌های سفارش |

> از این به بعد هر تسک جدیدی که انجام شود، هم سند فنی خودش به‌روز می‌شود و هم جدول بخش ۲ و چک‌لیست بخش ۶ همین سند.
