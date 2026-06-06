# Nisha MVP — 5-minute demo script

Prerequisites: `docker compose up --build`, migrations, and seed (see [README.md](../README.md)).

## 1. Customer shops (2 min)

1. Open **http://localhost:3000** → **Browse demo store** (or go to `/store/demo-store`).
2. Add products to cart → **Checkout**.
3. Fill buyer details, pick a payment method, submit.
4. **Save** the invoice code and password shown once.
5. Note payment instructions → upload a payment proof image.
6. Open **Track order** (`/track-order`) with code + password — confirm status and proofs list.
7. Optional: open `/invoice/{invoiceCode}`, enter password, print invoice.

## 2. Seller fulfills (2 min)

1. Log in at **/seller/login** — `seller@example.com` / `seller123456`.
2. **Dashboard** — metrics, low stock, recent orders. Use **View your store** to open the public page.
3. **Orders** — find the guest order → open detail.
4. **Confirm payment** (or reject to restore stock).
5. Advance status: Preparing → Shipped → Delivered.

## 3. Admin overview (1 min)

1. Log in at **/admin/login** — `admin@example.com` / `admin123456`.
2. **Dashboard** — platform totals and recent orders.
3. **Stores** — deactivate/reactivate a store; open public link.
4. **Orders** — browse all stores; open read-only order detail.

## Screenshot placeholders

| Step | Screenshot |
|------|------------|
| Store catalog | _(add store-grid.png)_ |
| Checkout success | _(add checkout-invoice.png)_ |
| Track order | _(add track-order.png)_ |
| Seller confirm payment | _(add seller-order.png)_ |
| Admin dashboard | _(add admin-dashboard.png)_ |

## Verify before presenting

```bash
docker compose exec backend python -m pytest -q
cd frontend && npm run build
```
