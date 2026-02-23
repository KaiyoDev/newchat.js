# sendAttachment()

Gửi file hoặc ảnh đính kèm đến một channel/thread. File được stream trực tiếp, không load vào RAM.

```js
const result = await api.sendAttachment(threadID, filePath, caption);
```

## Parameters

| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `threadID` | `string` | ✅ | ID của channel |
| `filePath` | `string` | ✅ | Đường dẫn đến file (tuyệt đối hoặc tương đối) |
| `caption` | `string` | ❌ | Caption hiển thị cùng file (mặc định: `''`) |

## Supported File Types

| Extension | MIME Type |
|-----------|-----------|
| `.jpg` `.jpeg` | `image/jpeg` |
| `.png` | `image/png` |
| `.gif` | `image/gif` |
| `.webp` | `image/webp` |
| `.mp4` | `video/mp4` |
| `.pdf` | `application/pdf` |
| `.zip` | `application/zip` |
| `.mp3` | `audio/mpeg` |
| `.ogg` | `audio/ogg` |
| *(khác)* | `application/octet-stream` |

## Returns

`Promise<Object>` — giống [`sendMessage()`](/api/send-message#returns).

## Throws

| Lỗi | Nguyên nhân |
|-----|-------------|
| `Session expired, please re-login` | Token hết hạn |
| `sendAttachment: channelId là bắt buộc` | `threadID` bị thiếu |
| `sendAttachment: filePath là bắt buộc` | `filePath` bị thiếu |
| `sendAttachment: File không tồn tại: /path/to/file` | File không tồn tại tại đường dẫn đã cho |

## Examples

### Gửi ảnh có caption

```js
await api.sendAttachment(
  '691c4437a50691e99899726a',
  './screenshot.png',
  'Đây là ảnh chụp màn hình'
);
```

### Gửi file không có caption

```js
await api.sendAttachment(threadID, '/path/to/document.pdf');
```

### Gửi từ thư mục uploads

```js
const path = require('path');

await api.sendAttachment(
  threadID,
  path.join(__dirname, 'uploads', 'image.jpg'),
  'Ảnh từ bot'
);
```

### Kết hợp với listen

```js
api.listen((err, event) => {
  if (event?.type === 'message' && event.data.body === '!logo') {
    api.sendAttachment(event.data.threadID, './logo.png', 'newchat.js logo');
  }
});
```

## Kỹ thuật

Endpoint: `POST https://api.newchat.vn/channels/{channelId}/messages`  
Content-Type: `multipart/form-data`  
Fields: `body` (caption HTML), `signId` (UUID v4), `attachments` (file binary stream)
