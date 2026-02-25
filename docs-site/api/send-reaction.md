# sendReaction()

Thả cảm xúc (emoji) vào một tin nhắn cụ thể.

```js
await api.sendReaction(threadID, messageID, emoji);
```

## Parameters

| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `threadID` | `string` | ✅ | ID của thread/channel |
| `messageID` | `string` | ✅ | ID của tin nhắn muốn react |
| `emoji` | `string` | ✅ | Emoji, ví dụ: `"👍"`, `"❤️"`, `"😂"`, `"😮"` |

## Returns

`Promise<Object|true>` — Tuỳ backend có thể trả object hoặc không; code chỉ cần check resolved là thành công.

## Ví dụ

```js
await api.listen((err, event) => {
  if (err) return console.error(err);
  if (event.type !== 'message') return;

  const { threadID, messageID, body, isSelf } = event.data;
  if (isSelf) return;

  if (body === 'nice') {
    api.sendReaction(threadID, messageID, '👍').catch(console.error);
  }
});
```

## Kỹ thuật

- **Endpoint:** `POST https://api.newchat.vn/channels/{threadID}/messages/{messageID}/reactions`  
- **Content-Type:** `application/json`  
- **Body:**

```json
{ "emoji": "👍" }
```

