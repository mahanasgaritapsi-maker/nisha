"""Tests for storefront product search, filters and sorting (roadmap task 14)."""

from decimal import Decimal

from sqlalchemy import select

from app.models.product import Product
from app.models.store import Store


def _base_url(slug: str) -> str:
    return "/api/v1/public/stores/" + slug + "/products"


def _seed_products(db, slug: str) -> dict[str, int]:
    store_id = db.scalar(select(Store.id).where(Store.slug == slug))
    assert store_id is not None

    bag = Product(
        store_id=store_id,
        title="کیف چرم دست\u200cساز",
        description="کیف چرم طبیعی با دوخت دستی",
        price=Decimal("1200000"),
        stock_quantity=3,
    )
    mug = Product(
        store_id=store_id,
        title="ماگ سرامیکی",
        description="ماگ دست\u200cساز سرامیکی لعاب\u200cدار",
        price=Decimal("300000"),
        stock_quantity=0,
    )
    scarf = Product(
        store_id=store_id,
        title="شال زمستانی",
        description=None,
        price=Decimal("450000"),
        stock_quantity=10,
    )
    db.add_all([bag, mug, scarf])
    db.commit()
    db.refresh(bag)
    db.refresh(mug)
    db.refresh(scarf)
    return {"bag": bag.id, "mug": mug.id, "scarf": scarf.id}


def _product_ids(payload) -> list[int]:
    return [item["id"] for item in payload["items"]]


def test_persian_search_matches_half_space_and_arabic_chars(client, db, public_store):
    ids = _seed_products(db, public_store["slug"])
    url = _base_url(public_store["slug"])

    # A query typed with a plain space must match titles/descriptions that
    # are written with a half-space (ZWNJ).
    response = client.get(url, params={"q": "دست ساز"})
    assert response.status_code == 200
    payload = response.json()
    returned = set(_product_ids(payload))
    assert ids["bag"] in returned
    assert ids["mug"] in returned
    assert ids["scarf"] not in returned

    # A query typed with the half-space itself must work as well.
    response = client.get(url, params={"q": "دست\u200cساز"})
    assert response.status_code == 200
    assert ids["bag"] in set(_product_ids(response.json()))

    # A query typed with Arabic Yeh/Kaf must match the Persian spelling.
    response = client.get(url, params={"q": "\u0643\u064a\u0641"})
    assert response.status_code == 200
    assert ids["bag"] in set(_product_ids(response.json()))


def test_filters_combine_with_search(client, db, public_store):
    ids = _seed_products(db, public_store["slug"])
    url = _base_url(public_store["slug"])

    # Search + in-stock + minimum price: the mug matches the text but is out
    # of stock and too cheap, so only the bag may remain.
    response = client.get(
        url,
        params={"q": "دست ساز", "in_stock": "true", "min_price": "1000000"},
    )
    assert response.status_code == 200
    returned = _product_ids(response.json())
    assert ids["bag"] in returned
    assert ids["mug"] not in returned
    assert ids["scarf"] not in returned

    # Price range + stock filter without text search.
    response = client.get(
        url,
        params={"min_price": "300000", "max_price": "500000", "in_stock": "true"},
    )
    assert response.status_code == 200
    returned = _product_ids(response.json())
    assert ids["scarf"] in returned
    assert ids["mug"] not in returned  # in range but out of stock
    assert ids["bag"] not in returned  # above the maximum price


def test_sorting_works_with_pagination(client, db, public_store):
    _seed_products(db, public_store["slug"])
    url = _base_url(public_store["slug"])

    first = client.get(url, params={"sort": "cheapest", "page": 1, "page_size": 2})
    assert first.status_code == 200
    first_payload = first.json()
    assert first_payload["page"] == 1
    assert len(first_payload["items"]) == 2
    assert first_payload["total"] >= 4  # three seeded plus the fixture product
    assert first_payload["has_more"] is True

    second = client.get(url, params={"sort": "cheapest", "page": 2, "page_size": 2})
    assert second.status_code == 200
    second_payload = second.json()

    # Pages must not overlap and the price ordering must hold across pages.
    assert not set(_product_ids(first_payload)) & set(_product_ids(second_payload))
    prices = [
        Decimal(str(item["price"]))
        for item in first_payload["items"] + second_payload["items"]
    ]
    assert prices == sorted(prices)


def test_best_selling_puts_ordered_product_first(client, db, public_store, placed_order):
    _seed_products(db, public_store["slug"])
    url = _base_url(public_store["slug"])

    response = client.get(url, params={"sort": "best_selling"})
    assert response.status_code == 200
    items = response.json()["items"]
    assert items
    # The fixture product is the only one with recorded sales.
    assert items[0]["id"] == public_store["product_id"]
