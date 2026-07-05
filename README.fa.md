# نیشا (Nisha)

> 🌐 زبان: [English](README.md) | **فارسی**

نیشا یک پلتفرم فروشگاهی مبتنی بر پرداخت دستی (کارت‌به‌کارت) برای فروشگاه‌های آنلاین کوچک است. این پروژه شامل رابط کاربری فارسی و راست‌چین (RTL)، سیستم تم بنفش/مشکی با حالت‌های روشن، تیره و سیستمی، ویترین فروشگاه عمومی، تسویه‌حساب مهمان، ابزارهای فروشنده/ادمین و پورتال مشتری است. رابط کاربری کاملاً فارسی است؛ مستندات به زبان انگلیسی نوشته شده‌اند.

## این مخزن شامل چه چیزهایی است

- ویترین فروشگاه عمومی و تسویه‌حساب
- رهگیری سفارش مهمان و بارگذاری رسید پرداخت
- داشبورد فروشنده، کاتالوگ، روش‌های پرداخت، سفارش‌ها و گفتگو
- پورتال مشتری برای پروفایل، آدرس‌ها، تاریخچه سفارش، نظرات، شکایات، دانلودها و بازیابی حساب
- پنل ادمین برای فروشگاه‌ها، سفارش‌ها، نظرات و گفتگوها
- کنترل‌های مشترک تم و بومی‌سازی

## پشته فناوری

| لایه | فناوری |
|-------|------------|
| فرانت‌اند | Next.js 15 (App Router)، TypeScript، Tailwind CSS |
| بک‌اند | FastAPI، SQLAlchemy 2.x، Alembic |
| پایگاه داده | PostgreSQL 16 |
| احراز هویت | توکن‌های JWT، نشست‌های جداگانه برای فروشنده/ادمین و مشتری |
| استقرار | Docker Compose |

## ساختار مخزن

```
/backend     API مبتنی بر FastAPI، Alembic، تست‌ها و اسکریپت‌ها
/frontend    اپ Next.js، رابط کاربری مشترک، Contextها و Hookها
/nisha_flutter  فضای کاری اپ موبایل Flutter
/docs        مستندات دمو، مهاجرت، پروداکشن و گزارش کار
docker-compose.yml
```

## مستندات

- [راهنمای دمو](docs/DEMO.md)
- [راهنمای مهاجرت مشتری](docs/CUSTOMER_MIGRATION_GUIDE.md)
- [راهنمای استقرار پروداکشن](docs/PRODUCTION_DEPLOYMENT.md)
- [راهنمای پیاده‌سازی Flutter](docs/FLUTTER_IMPLEMENTATION_GUIDE.md)
- [معماری Flutter](docs/FLUTTER_ARCHITECTURE.md)
- [مرجع API برای Flutter](docs/FLUTTER_API_REFERENCE.md)
- [شروع سریع Flutter](docs/FLUTTER_QUICKSTART.md)
- [راهنمای انتشار Flutter](docs/FLUTTER_RELEASE.md)
- [گزارش کار داخلی](docs/WORKLOG.md)

## اپلیکیشن موبایل

کلاینت موبایل در پوشه [`nisha_flutter/`](nisha_flutter/README.md) قرار دارد.
این اپ فارسی‌محور است، به‌صورت پیش‌فرض راست‌چین (RTL) است و از همان API بک‌اند وب‌اپ استفاده می‌کند.

## شروع سریع با Docker

1. فایل‌های محیطی نمونه را کپی کنید:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. استک را اجرا کنید:

```bash
docker compose up --build
```

3. اپ را باز کنید:

| آدرس | توضیح |
|-----|-------------|
| http://localhost:3000 | فرانت‌اند |
| http://localhost:8000/docs | مستندات API |
| http://localhost:8000/api/v1/health | بررسی سلامت |

4. بک‌اند هنگام راه‌اندازی و اتصال به PostgreSQL، مهاجرت‌های Alembic را به‌صورت خودکار اعمال می‌کند.

5. تنها در صورتی که به داده‌های نمونه فروشنده/فروشگاه نیاز دارید، داده‌های دمو را وارد کنید. **اسکریپت seed را در پروداکشن اجرا نکنید.**

```bash
docker compose exec backend python -m scripts.seed
```

6. در صورت نیاز، پایگاه داده محلی را بازنشانی کنید:

```bash
docker compose down -v
```

نکته: فایل‌های Dockerfile موجود در مخزن، پیش‌فرض‌های محیط توسعه هستند (`next dev` و `uvicorn --reload`). برای نکات استقرار روی سرور و بازنویسی دستورات در زمان اجرا، به راهنمای پروداکشن مراجعه کنید.

## توسعه محلی بدون Docker

### بک‌اند

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### فرانت‌اند

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

برای درخواست‌های مرورگر در حین توسعه محلی، مقدار `NEXT_PUBLIC_API_URL=http://localhost:8000` را تنظیم کنید.

## پروداکشن

برای راهنمای استقرار روی VPS لینوکسی با محوریت Docker Compose از [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md) استفاده کنید. این راهنما شامل بازنویسی دستورات پروداکشن، ریورس پروکسی، TLS، پشتیبان‌گیری و تست‌های صحت است.

## پیکربندی

### متغیرهای محیطی بک‌اند

| متغیر | پیش‌فرض | توضیح |
|----------|---------|-------------|
| `ENVIRONMENT` | `development` | مقدار `development` یا `production` |
| `DATABASE_URL` | الزامی | رشته اتصال PostgreSQL |
| `CORS_ORIGINS` | `http://localhost:3000` | مبداهای مجاز، جداشده با ویرگول |
| `UPLOAD_DIR` | `./uploads` | پوشه بارگذاری تصاویر محصول و رسیدهای پرداخت |
| `PAYMENT_PROOF_SUBDIR` | `payment-proofs` | زیرپوشه‌ای درون `UPLOAD_DIR` |
| `MAX_UPLOAD_SIZE_BYTES` | `5242880` | حداکثر حجم بارگذاری به بایت |
| `LOW_STOCK_THRESHOLD` | `5` | آستانه هشدار کمبود موجودی در داشبورد فروشنده |
| `JWT_SECRET_KEY` | الزامی | در پروداکشن یک کلید قوی تنظیم کنید |
| `JWT_ALGORITHM` | `HS256` | الگوریتم JWT |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | مدت اعتبار توکن به دقیقه |
| `LOG_LEVEL` | `INFO` | سطح لاگ |

### متغیرهای محیطی فرانت‌اند

| متغیر | توضیح |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | آدرس بک‌اند برای درخواست‌های مرورگر |
| `API_URL` | آدرس اختیاری سمت سرور برای SSR در Docker (در Compose برابر `http://backend:8000`) |

نکات مهم:

- درخواست‌های مرورگر از `NEXT_PUBLIC_API_URL` استفاده می‌کنند.
- کامپوننت‌های سرور داخل Docker در صورت تنظیم بودن، از `API_URL` استفاده می‌کنند.
- مقدار `CORS_ORIGINS` را با مبدأ عمومی فرانت‌اند هماهنگ نگه دارید.

## مسیرها

### عمومی

- `/`
- `/track-order`
- `/store/[slug]`
- `/store/[slug]/products/[productId]`
- `/store/[slug]/checkout`
- `/invoice/[invoiceCode]`

### مشتری

- `/customer/login`
- `/customer/register`
- `/customer/recover`
- `/customer/dashboard`
- `/customer/profile`
- `/customer/addresses`
- `/customer/orders`
- `/customer/orders/[id]`
- `/customer/conversations`
- `/customer/conversations/[id]`
- `/customer/downloads`
- `/customer/reviews`
- `/customer/complaints`

### فروشنده

- `/seller/login`
- `/seller/register`
- `/seller/onboarding`
- `/seller/dashboard`
- `/seller/store`
- `/seller/products`
- `/seller/products/new`
- `/seller/products/[id]/edit`
- `/seller/orders`
- `/seller/orders/[id]`
- `/seller/payment-methods`
- `/seller/conversations`
- `/seller/conversations/[id]`

### ادمین

- `/admin/login`
- `/admin/dashboard`
- `/admin/stores`
- `/admin/stores/[id]`
- `/admin/stores/[id]/badges`
- `/admin/orders`
- `/admin/orders/[id]`
- `/admin/reviews`
- `/admin/chats`
- `/admin/chats/[id]`

## API و رفتار سیستم

- خطاهای قابل‌خواندن بک‌اند پیش از رسیدن به فرانت‌اند بومی‌سازی می‌شوند. رابط کاربری مقدار `ApiError.detail` را عیناً نمایش می‌دهد.
- اندپوینت‌های فهرستی، JSON صفحه‌بندی‌شده با فیلدهای `items`، `total`، `page`، `page_size` و `total_pages` برمی‌گردانند.
- فایل‌های بارگذاری‌شده از مسیر `/uploads/...` سرو می‌شوند.
- حساب‌های فروشنده/ادمین از توکن bearer فروشنده/ادمین استفاده می‌کنند. حساب‌های مشتری توکن جداگانه‌ای دارند.
- رابط کاربری کاملاً فارسی و راست‌چین است.
- ترجیح تم برای هر دستگاه ذخیره می‌شود و می‌تواند از حالت روشن، تیره یا سیستمی پیروی کند.

## اطلاعات ورود دمو

پس از اجرای `python -m scripts.seed`:

| نقش | ایمیل | رمز عبور |
|------|-------|----------|
| ادمین | `admin@example.com` | `admin123456` |
| فروشنده | `seller@example.com` | `seller123456` |

فروشگاه دمو:

- `http://localhost:3000/store/demo-store`

## راستی‌آزمایی

```bash
cd backend && python -m pytest -v
cd frontend && npm run build
cd frontend && npm run lint
```

## نکات امنیتی

- پیش از هر استقرار پروداکشن، یک `JWT_SECRET_KEY` قوی تنظیم کنید.
- در پروداکشن، فایل‌های بارگذاری‌شده را روی فضای ذخیره‌سازی پایدار نگه دارید.
- پورت‌های محیط توسعه را مستقیماً در اینترنت در معرض دسترسی قرار ندهید.
- برای راه‌اندازی ریورس پروکسی و TLS از راهنمای استقرار پروداکشن استفاده کنید.
