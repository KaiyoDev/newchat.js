# listen()

Lắng nghe tin nhắn và sự kiện realtime qua WebSocket (Socket.IO + MessagePack encoding).

```js
const { stopListening } = api.listen(callback);
```

## Parameters

| Tên | Kiểu | Mô tả |
|-----|------|-------|
| `callback` | `Function` | `(err, event) => void` |

## Returns

`{ stopListening: Function }` — gọi `stopListening()` để ngắt kết nối WebSocket.

## Event Types

### `message` — Tin nhắn mới

```js
{
  type: 'message',
  data: {
    type: 'message',
    messageID: '699c774211e0ddc33b19e93c',
    threadID: '691c4437a50691e99899726a',  // channelId
    senderID: '691c410089308dee9775c3bc',  // userId người gửi
    senderName: 'Đặng Hoàng Ân',
    body: 'hello',                          // plain text (HTML đã strip)
    bodyHtml: '<p>hello</p>',              // HTML gốc từ server
    attachments: [],
    createdAt: '2026-02-23T15:02:52.695Z',
    isSystem: false,
    _raw: { /* payload gốc để debug */ }
  }
}
```

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
| 1 | 1s |
| 2 | 2s |
| 3 | 4s |
| 4 | 8s |
| 5 | 16s |

Sau 5 lần thất bại, emit `error` với message `"Max reconnect attempts reached"`.

## Example

### Echo bot cơ bản

```js
const { stopListening } = api.listen((err, event) => {
  if (err) return console.error(err.message);

  if (event.type === 'message') {
    const { threadID, body, senderID } = event.data;

    if (senderID === me._id) return; // bỏ qua tin của chính bot

    api.sendMessage(threadID, `Echo: ${body}`);
    api.markAsRead(threadID);
  }
});
```

### Lắng nghe typing

```js
api.listen((err, event) => {
  if (event?.type === 'typing') {
    console.log(`${event.data.userId} đang gõ trong ${event.data.channelId}`);
  }
});
```

### Dừng sau timeout

```js
const { stopListening } = api.listen(callback);

// Dừng sau 1 phút
setTimeout(stopListening, 60_000);

// Hoặc khi nhận SIGINT
process.on('SIGINT', () => {
  stopListening();
  process.exit(0);
});
```

## Kỹ thuật

WebSocket kết nối tới `wss://ws.newchat.vn` thông qua Socket.IO v4. Auth được thực hiện bằng cách gửi binary frame MessagePack `{ token }` ngay sau Engine.IO OPEN handshake.
