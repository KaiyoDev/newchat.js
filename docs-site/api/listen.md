# listen()

Kết nối WebSocket và lắng nghe events realtime (Socket.IO v4 + MessagePack binary).  
Tin nhắn của chính bot (`isSelf: true`) được **tự động lọc bỏ** trong nội bộ.

```js
const { stopListening } = await api.listen(callback);
```

## Parameters

| Tên | Kiểu | Mô tả |
|-----|------|-------|
| `callback` | `Function` | `(err, event) => void` |

## Returns

`Promise<{ stopListening: Function }>` — gọi `stopListening()` để ngắt kết nối WebSocket.

## Event Types

### `message` — Tin nhắn mới

```js
{
  type: 'message',
  data: {
    type:        'message',
    action:      'create',                       // "create" | "update" | "delete"
    messageID:   '699da6ad11e0ddc33b19ec91',
    threadID:    '691c4437a50691e99899726a',     // channelId
    senderID:    '691741d094075d77d5ac4d79',     // userId người gửi
    senderName:  'Nguyễn Văn A',
    body:        'hello',                        // plain text, đã strip HTML
    bodyHtml:    '<p>hello</p>',                 // HTML gốc từ server
    attachments: [],                             // null hoặc array file đính kèm
    createdAt:   '2026-02-23T15:02:52.695Z',     // ISO 8601
    isSystem:    false,                          // true nếu tin nhắn hệ thống
    isSelf:      false,                          // true nếu chính bot gửi
    signId:      'ff598914-e7e0-4979-9cd8-629dd95a1d4f', // UUID dedup
    _raw:        { /* payload gốc từ server */ }
  }
}
```

::: tip isSelf
`isSelf` được tính tự động dựa trên userId decode từ JWT. Không cần so sánh `senderID` thủ công nữa.
:::

### `typing` — Đang gõ

```js
{ type: 'typing', data: { channelId: '...', userId: '...' } }
```

### `read` — Đã đọc

```js
{ type: 'read', data: { channelId: '...', userId: '...' } }
```

### `notification` — Thông báo

```js
{ type: 'notification', data: { /* ... */ } }
```

### `event` — Wildcard (debug)

Mọi event không nhận dạng được sẽ emit dưới dạng:

```js
{ type: 'eventName', data: { /* ... */ } }
```

## Reconnect

WebSocket tự động reconnect khi mất kết nối với **exponential backoff**:

| Lần thử | Delay |
|---------|-------|
| 1 | 2s |
| 2 | 4s |
| 3 | 8s |
| 4 | 16s |
| 5 | 30s — dừng hẳn, emit `error` |

## Examples

### Ping/pong bot

```js
const { stopListening } = await api.listen((err, event) => {
  if (err) return console.error(err.message);
  if (event.type !== 'message') return;

  const { threadID, body, isSelf } = event.data;

  if (isSelf) return; // bỏ qua tin của chính bot (tự động)

  if (body === '/ping') {
    api.sendMessage(threadID, 'pong 🏓');
  }
});
```

### Lắng nghe typing

```js
await api.listen((err, event) => {
  if (event?.type === 'typing') {
    console.log(`${event.data.userId} đang gõ trong ${event.data.channelId}`);
  }
});
```

### Dừng khi Ctrl+C

```js
const { stopListening } = await api.listen(callback);

process.on('SIGINT', () => {
  stopListening();
  process.exit(0);
});
```

## Kỹ thuật

WebSocket kết nối tới `wss://ws.newchat.vn` qua Socket.IO v4.  
Auth: gửi binary frame MessagePack `{ type: 0, data: { token }, nsp: "/" }` ngay sau Engine.IO OPEN handshake.  
Heartbeat: server gửi TEXT `"2"` (ping) mỗi 25s → client reply `"3"` (pong) ngay lập tức.
