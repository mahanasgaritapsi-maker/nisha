# Realtime chat over WebSocket (roadmap task 13)

The store chat previously relied on REST polling only. Task 13 adds WebSocket
push so new messages and unread badges update live, while **all existing REST
endpoints stay unchanged as the polling fallback**.

## Endpoints

All endpoints live under `/api/v1/ws`:

| Endpoint | Who | Auth |
| --- | --- | --- |
| `/api/v1/ws/seller?token=<JWT>` | Seller panel | Seller access token (query param) |
| `/api/v1/ws/customer?token=<JWT>` | Customer portal | Customer access token (query param) |
| `/api/v1/ws/orders/{invoice_code}?password=<pw>` | Guest order chat | Invoice code + order password |

Invalid credentials close the socket with code `4401`.

## Protocol

All frames are JSON.

Client to server:

```json
{"action": "ping"}
{"action": "subscribe", "conversation_id": 42}
{"action": "unsubscribe", "conversation_id": 42}
```

Server to client:

```json
{"type": "ready", "store_id": 1}
{"type": "pong"}
{"type": "subscribed", "conversation_id": 42}
{"type": "error", "detail": "conversation_not_found"}
{"type": "message.new", "conversation_id": 42, "message": {"id": 7, "body": "..."}}
{"type": "unread.bump", "conversation_id": 42}
```

Notes:

- The guest order socket is auto-subscribed to its conversation; `ready`
  includes `conversation_id`.
- Seller/customer sockets receive `unread.bump` for every message sent by the
  counterpart in any of their conversations (live unread badge). Subscribe to a
  conversation to also receive full `message.new` payloads for it.
- Subscriptions are permission-checked: sellers can only subscribe to their
  store's conversations; customers only to their own conversations.
- **Sending messages stays on REST** (`POST .../conversations/{id}/messages`
  and the public order chat endpoint). This keeps polling clients fully
  functional and means no message can be lost if the socket drops: on
  reconnect, the client refetches the conversation via REST.

## Frontend integration sketch

```js
const ws = new WebSocket(wsBase + "/api/v1/ws/seller?token=" + accessToken);
ws.onmessage = (e) => {
  const event = JSON.parse(e.data);
  if (event.type === "message.new") appendMessage(event.message);
  if (event.type === "unread.bump") refreshUnreadBadge();
};
ws.onclose = () => {
  // fall back to polling, retry with backoff
  setTimeout(reconnect, 2000);
};
```

Recommended client behavior: on `onclose`/`onerror`, keep the existing polling
loop active and retry the socket with exponential backoff; on reconnect,
refetch conversation detail once to catch anything missed.

## Reverse proxy

When serving behind Nginx, enable upgrade headers for the WS path:

```nginx
location /api/v1/ws/ {
    proxy_pass http://127.0.0.1:9000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 300s;
}
```

## Architecture and scaling

- `app/services/chat_realtime.py` holds an **in-process** connection manager.
  `chat_service._send_message` calls `manager.notify_new_message(...)` after
  commit; the manager fans the event out to connected sockets.
- The hook is fire-and-forget: if no event loop / no clients are connected it
  is a no-op, so REST behavior and tests are unaffected.
- **Horizontal scaling:** with more than one backend process, events only reach
  sockets on the same process. Before scaling out, swap the in-process fan-out
  for Redis pub/sub: publish the event in `notify_new_message` and have each
  process subscribe and forward to its local sockets. The client protocol does
  not change. The current production compose runs a single backend process, so
  this is intentionally deferred.

## Tests

`backend/tests/test_ws_chat.py` covers: auth rejection (bad order password,
bad seller token), live delivery of a seller REST message to a connected guest
socket, and subscribe access control between two sellers.
