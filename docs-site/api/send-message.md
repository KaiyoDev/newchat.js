# sendMessage()

Gửi tin nhắn văn bản đến một channel/thread.

```js
const result = await api.sendMessage(threadID, content);
```

## Parameters

| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `threadID` | `string` | ✅ | ID của channel — lấy từ [`getThreadList()`](/api/get-thread-list) |
| `content` | `string` | ✅ | Nội dung plain text (tự động wrap thành `<p>content</p>`) |

## Returns

`Promise<Object>` — response data từ server:

```js
{
  message: {
    _id: '699c774211e0ddc33b19e93c',
    body: '<p>Xin chào!</p>',
    attachments: null,
    user: {
      _id: '691c410089308dee9775c3bc',
      fullName: 'Bot',
      isVerified: false,
      avatarUrl: null
    },
    createdAt: '2026-02-23T15:50:26.445Z',
    editedAt: null,
    deletedAt: null,
    reactions: [],
    isSystem: false,
    signId: '9668c4d8-558d-4191-9b70-1399119d3d9f',
    channelId: '691c4437a50691e99899726a'
  }
}
```

## Throws

| Lỗi | Nguyên nhân |
|-----|-------------|
| `Session expired, please re-login` | Token hết hạn (401/403) |
| `sendMessage: channelId là bắt buộc` | `threadID` bị thiếu hoặc falsy |
| `sendMessage: content là bắt buộc` | `content` bị thiếu hoặc falsy |

Rate limit (429) được tự động retry sau delay từ header `Retry-After`.

## Examples

### Gửi tin nhắn đơn giản

```js
await api.sendMessage('691c4437a50691e99899726a', 'Xin chào!');
```

### Lấy threadID trước rồi gửi

```js
const threads = await api.getThreadList();
const threadID = threads[0]._id;

await api.sendMessage(threadID, 'Hello from newchat.js!');
```

### Trong listen callback

```js
api.listen((err, event) => {
  if (event?.type === 'message') {
    const { threadID, body } = event.data;
    api.sendMessage(threadID, `Echo: ${body}`).catch(console.error);
  }
});
```

### Lấy messageID vừa gửi

```js
const result = await api.sendMessage(threadID, 'Hello');
console.log('Sent messageID:', result.message._id);
```

## Kỹ thuật

Gửi qua **REST API** (không qua WebSocket):

- **Endpoint:** `POST https://api.newchat.vn/channels/{channelId}/messages`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `body` — nội dung HTML, tự wrap: `<p>content</p>`
  - `signId` — UUID v4 random mỗi request (dùng để dedup phía server)
