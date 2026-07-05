"""Tests for the realtime chat WebSocket endpoints (roadmap task 13)."""

import pytest
from starlette.websockets import WebSocketDisconnect


def _order_ws_url(invoice_code: str, password: str) -> str:
    return "/api/v1/ws/orders/" + invoice_code + "?password=" + password


def _token_from_headers(headers: dict) -> str:
    return headers["Authorization"].split(" ")[1]


def test_guest_ws_rejects_wrong_password(client, placed_order):
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(
            _order_ws_url(placed_order["invoice_code"], "wrong-password")
        ) as ws:
            ws.receive_json()


def test_seller_ws_rejects_invalid_token(client):
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/api/v1/ws/seller?token=not-a-token") as ws:
            ws.receive_json()


def test_guest_receives_seller_message_live(client, seller_headers, placed_order):
    url = _order_ws_url(placed_order["invoice_code"], placed_order["password"])
    with client.websocket_connect(url) as ws:
        ready = ws.receive_json()
        assert ready["type"] == "ready"
        conversation_id = ready["conversation_id"]

        ws.send_json({"action": "ping"})
        assert ws.receive_json()["type"] == "pong"

        response = client.post(
            "/api/v1/seller/conversations/" + str(conversation_id) + "/messages",
            json={"body": "سلام، سفارش شما آماده است"},
            headers=seller_headers,
        )
        assert response.status_code == 200

        event = ws.receive_json()
        assert event["type"] == "message.new"
        assert event["conversation_id"] == conversation_id
        assert event["message"]["body"] == "سلام، سفارش شما آماده است"


def test_seller_ws_subscribe_access_control(
    client, seller_headers, other_seller_headers, placed_order
):
    # Create the conversation through the guest socket first.
    url = _order_ws_url(placed_order["invoice_code"], placed_order["password"])
    with client.websocket_connect(url) as guest_ws:
        conversation_id = guest_ws.receive_json()["conversation_id"]

    own_token = _token_from_headers(seller_headers)
    other_token = _token_from_headers(other_seller_headers)

    with client.websocket_connect("/api/v1/ws/seller?token=" + own_token) as ws:
        assert ws.receive_json()["type"] == "ready"
        ws.send_json({"action": "subscribe", "conversation_id": conversation_id})
        assert ws.receive_json()["type"] == "subscribed"

    with client.websocket_connect("/api/v1/ws/seller?token=" + other_token) as ws:
        assert ws.receive_json()["type"] == "ready"
        ws.send_json({"action": "subscribe", "conversation_id": conversation_id})
        assert ws.receive_json()["type"] == "error"
