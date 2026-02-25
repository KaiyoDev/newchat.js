# sendReply()

Trả lời một tin nhắn cụ thể trong một channel/thread.

```js
await api.sendReply(threadID, messageID, content);
```

## Parameters

| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `threadID` | `string` | ✅ | ID của thread/channel |
| `messageID` | `string` | ✅ | ID của tin nhắn muốn reply |
| `content` | `string` | ✅ | Nội dung reply (plain text, tự wrap thành `<p>content</p>`) |

## Returns

`Promise<Object>` — Message object server trả về (tương tự `sendMessage()`), có liên kết với tin gốc qua field `replyTo`.

## Ví dụ

```js
await api.listen((err, event) => {
  if (err) return console.error(err);
  if (event.type !== 'message') return;

  const { threadID, messageID, body, isSelf } = event.data;
  if (isSelf) return;

  if (body === '/ping') {
    api.sendReply(threadID, messageID, 'pong!').catch(console.error);
  }
});
```

## Kỹ thuật

- **Endpoint:** `POST https://api.newchat.vn/channels/{threadID}/messages`  
- **Content-Type:** `multipart/form-data`  
- **Fields:**
  - `body` — nội dung HTML, auto wrap `<p>content</p>`
  - `signId` — UUID v4 random
  - `replyTo` — ID của tin nhắn gốc (field name chính xác: `"replyTo"`)

