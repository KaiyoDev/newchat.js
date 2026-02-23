# markAsRead()

Đánh dấu đã đọc toàn bộ tin nhắn trong channel.

```js
const ok = await api.markAsRead(threadID);
```

## Parameters

| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `threadID` | `string` | ✅ | ID của channel |

## Returns

`Promise<true>` — trả về `true` khi thành công.

## Throws

| Lỗi | Nguyên nhân |
|-----|-------------|
| `Session expired, please re-login` | Token hết hạn |
| `markAsRead: channelId là bắt buộc` | `threadID` bị thiếu |

## Examples

### Tự động đọc mỗi tin nhắn đến

```js
api.listen((err, event) => {
  if (event?.type === 'message') {
    api.markAsRead(event.data.threadID).catch(console.error);
  }
});
```

### Đọc tất cả threads khi khởi động

```js
const threads = await api.getThreadList();

await Promise.all(
  threads.map(t => api.markAsRead(t._id).catch(() => {}))
);
console.log(`Đã đọc ${threads.length} conversations`);
```

### Kiểm tra kết quả

```js
const ok = await api.markAsRead(threadID);
if (ok) console.log('Đã đánh dấu đã đọc');
```

## Kỹ thuật

Endpoint: `HEAD https://api.newchat.vn/channels/{channelId}/seen`  
Method: `HEAD` — không có request body, không có response body.  
Status 200 = thành công.
