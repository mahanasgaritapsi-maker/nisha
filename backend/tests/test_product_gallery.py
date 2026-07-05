import io


def _image_payload(count: int) -> list[dict]:
    return [
        {"image_url": f"/uploads/media/gallery-{index}.jpg", "sort_order": index}
        for index in range(count)
    ]


def _product_body(**overrides) -> dict:
    body = {
        "title": "Gallery Product",
        "price": "10.00",
        "stock_quantity": 3,
    }
    body.update(overrides)
    return body


def test_create_product_allows_up_to_eight_images(client, public_store):
    response = client.post(
        "/api/v1/seller/products",
        headers=public_store["seller_headers"],
        json=_product_body(images=_image_payload(8)),
    )
    assert response.status_code == 201
    data = response.json()
    assert len(data["images"]) == 8
    assert [image["sort_order"] for image in data["images"]] == list(range(8))


def test_create_product_rejects_more_than_eight_images(client, public_store):
    response = client.post(
        "/api/v1/seller/products",
        headers=public_store["seller_headers"],
        json=_product_body(images=_image_payload(9)),
    )
    assert response.status_code == 422


def test_add_ninth_image_rejected(client, public_store):
    created = client.post(
        "/api/v1/seller/products",
        headers=public_store["seller_headers"],
        json=_product_body(images=_image_payload(8)),
    )
    assert created.status_code == 201
    product_id = created.json()["id"]

    response = client.post(
        f"/api/v1/seller/products/{product_id}/images",
        headers=public_store["seller_headers"],
        json={"image_url": "/uploads/media/extra.jpg"},
    )
    assert response.status_code == 422


def test_product_video_fields_roundtrip(client, public_store):
    created = client.post(
        "/api/v1/seller/products",
        headers=public_store["seller_headers"],
        json=_product_body(
            title="Video Product",
            images=_image_payload(1),
            video_url="/uploads/media/demo.mp4",
            video_mime_type="video/mp4",
        ),
    )
    assert created.status_code == 201
    data = created.json()
    assert data["video_url"] == "/uploads/media/demo.mp4"
    assert data["video_mime_type"] == "video/mp4"
    product_id = data["id"]

    detail = client.get(f"/api/v1/public/stores/{public_store['slug']}/products/{product_id}")
    assert detail.status_code == 200
    product = detail.json()["product"]
    assert product["video_url"] == "/uploads/media/demo.mp4"
    assert product["video_mime_type"] == "video/mp4"


def test_video_upload_endpoint_accepts_mp4(client):
    fake_mp4 = b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 64
    response = client.post(
        "/api/v1/public/uploads/videos",
        files={"file": ("clip.mp4", io.BytesIO(fake_mp4), "video/mp4")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["url"].endswith(".mp4")
    assert data["mime_type"] == "video/mp4"
    assert data["thumbnail_url"] is None


def test_video_upload_endpoint_rejects_non_video(client):
    response = client.post(
        "/api/v1/public/uploads/videos",
        files={"file": ("notes.txt", io.BytesIO(b"hello world"), "text/plain")},
    )
    assert response.status_code == 422
