from sqlalchemy import select

from app.models.analytics import StoreVisitDaily
from app.models.enums import OrderStatus
from app.models.order import Order


def test_public_visit_recording_increments_daily_counter(client, public_store, db):
    slug = public_store["slug"]

    first = client.post(f"/api/v1/public/stores/{slug}/visit")
    assert first.status_code == 204
    second = client.post(f"/api/v1/public/stores/{slug}/visit")
    assert second.status_code == 204

    rows = db.scalars(select(StoreVisitDaily)).all()
    assert len(rows) == 1
    assert rows[0].visit_count == 2


def test_visit_recording_unknown_store_returns_404(client):
    response = client.post("/api/v1/public/stores/does-not-exist/visit")
    assert response.status_code == 404


def test_seller_analytics_summary(client, placed_order, db):
    slug = placed_order["slug"]
    seller_headers = placed_order["seller_headers"]

    for _ in range(4):
        response = client.post(f"/api/v1/public/stores/{slug}/visit")
        assert response.status_code == 204

    # Order starts as PENDING_PAYMENT: counted as an order but not revenue.
    analytics = client.get("/api/v1/seller/analytics?days=7", headers=seller_headers)
    assert analytics.status_code == 200
    data = analytics.json()
    assert data["days"] == 7
    assert len(data["daily"]) == 7
    assert data["totals"]["orders"] == 1
    assert data["totals"]["visits"] == 4
    assert float(data["totals"]["revenue"]) == 0.0
    assert abs(data["totals"]["conversion_rate"] - 25.0) < 0.001

    # Confirm payment: revenue should now include the order total (2 x 49.99).
    order = db.get(Order, placed_order["order_id"])
    order.status = OrderStatus.PAYMENT_CONFIRMED
    db.commit()

    analytics = client.get("/api/v1/seller/analytics?days=7", headers=seller_headers)
    assert analytics.status_code == 200
    data = analytics.json()
    assert abs(float(data["totals"]["revenue"]) - 99.98) < 0.01

    today_point = data["daily"][-1]
    assert today_point["orders"] == 1
    assert today_point["visits"] == 4

    assert len(data["top_products"]) == 1
    top = data["top_products"][0]
    assert top["title"] == "Public Hoodie"
    assert top["quantity"] == 2
    assert abs(float(top["revenue"]) - 99.98) < 0.01


def test_seller_analytics_requires_auth(client):
    response = client.get("/api/v1/seller/analytics")
    assert response.status_code == 401
