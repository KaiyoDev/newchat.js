<div align="center">

# newchat.js

**Unofficial Node.js API wrapper for [newchat.vn](https://newchat.vn)**

[![npm](https://img.shields.io/npm/v/newchat.js?color=crimson&style=flat-square)](https://www.npmjs.com/package/newchat.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org)
[![GitHub](https://img.shields.io/badge/GitHub-KaiyoDev-181717?style=flat-square&logo=github)](https://github.com/KaiyoDev/newchat.js)
[![Docs](https://img.shields.io/badge/Docs-VitePress-646cff?style=flat-square)](https://kaiyodev.github.io/newchat.js)

Xây dựng chatbot cho newchat.vn bằng Node.js.  
Lấy cảm hứng từ [fca-unofficial](https://github.com/VangBanLaNhat/fca-unofficial).

</div>

---

> **⚠️ Disclaimer:** Đây là thư viện **không chính thức** (unofficial), không được phát triển hay bảo trì bởi đội ngũ newchat.vn. Sử dụng trên tinh thần tự chịu trách nhiệm. API có thể thay đổi bất kỳ lúc nào mà không có thông báo trước.

---

## Mục lục

- [Cài đặt](#cài-đặt)
- [Quickstart — Echo Bot](#quickstart--echo-bot)
- [AppState — Không cần login lại](#appstate--không-cần-login-lại)
- [API Reference](#api-reference)
  - [login()](#login)
  - [loadAppState()](#loadappstate)
  - [getAppState()](#getappstate)
  - [listen()](#listen)
  - [sendMessage()](#sendmessage)
  - [sendAttachment()](#sendattachment)
  - [markAsRead()](#markasread)
  - [getThreadList()](#getthreadlist)
  - [getThreadHistory()](#getthreadhistory)
  - [getUserInfo() / getMyProfile()](#getuserinfo--getmyprofile)
- [Error Handling](#error-handling)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [License](#license)

---

## Cài đặt

```bash
npm install newchat.js
```

Yêu cầu **Node.js >= 18**.

---

## Quickstart — Echo Bot

```js
const login = require('newchat.js');
const { loadAppState } = require('newchat.js');
const fs = require('fs');

const STATE_FILE = './appstate.json';

async function start() {
  let api;

  // Tái sử dụng session đã lưu, không cần login lại
  if (fs.existsSync(STATE_FILE)) {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    api = await loadAppState(saved);
  } else {
    api = await login('your@email.com', 'yourpassword');
    fs.writeFileSync(STATE_FILE, JSON.stringify(api.getAppState(), null, 2));
  }

  const me = await api.getMyProfile();
  console.log(`✅ Bot đang chạy: ${me.fullName} (@${me.username})`);

  const { stopListening } = api.listen((err, event) => {
    if (err) return console.error('[ERROR]', err.message);

    if (event.type === 'message') {
      const { threadID, body, senderID } = event.data;

      // Bỏ qua tin nhắn của chính bot
      if (senderID === me._id) return;

      console.log(`[${threadID}] ${senderID}: ${body}`);

      api.sendMessage(threadID, `Echo: ${body}`).catch(console.error);
      api.markAsRead(threadID).catch(console.error);
    }
  });

  process.on('SIGINT', () => {
    stopListening();
    console.log('\nBot đã dừng.');
    process.exit(0);
  });
}

start().catch(console.error);
```

---

## AppState — Không cần login lại

Sau lần đăng nhập đầu tiên, lưu token vào file. Những lần sau dùng `loadAppState()` để khởi động nhanh — không tốn request login.

```js
// Lần đầu: đăng nhập và lưu
const api = await login('your@email.com', 'yourpassword');
fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState(), null, 2));

// Lần sau: load lại không cần login
const { loadAppState } = require('newchat.js');
const api = await loadAppState(JSON.parse(fs.readFileSync('appstate.json')));
```

> Token có hiệu lực ~30 ngày. Khi hết hạn sẽ nhận lỗi `Session expired, please re-login`.

---

## API Reference

### login()

Đăng nhập bằng email + password. Trả về `api` object.

```js
const login = require('newchat.js');
const api = await login(email, password);
```

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `email` | `string` | Email tài khoản newchat.vn |
| `password` | `string` | Mật khẩu tài khoản |

**Returns:** `Promise<api>`

---

### loadAppState()

Khôi phục session từ AppState đã lưu. Bỏ qua bước đăng nhập.

```js
const { loadAppState } = require('newchat.js');
const api = await loadAppState({ token: '...' });
```

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `appState.token` | `string` | JWT token từ `getAppState()` |

**Returns:** `Promise<api>`

---

### getAppState()

Trả về AppState hiện tại để lưu file.

```js
const appState = api.getAppState();
// { token: 'eyJhbGci...' }

fs.writeFileSync('appstate.json', JSON.stringify(appState, null, 2));
```

**Returns:** `{ token: string }`

---

### listen()

Lắng nghe tin nhắn và sự kiện realtime qua WebSocket (Socket.IO + MessagePack).

```js
const { stopListening } = api.listen((err, event) => {
  if (err) return console.error(err.message);

  if (event.type === 'message') {
    const { threadID, body, senderID, attachments } = event.data;
    console.log(`${senderID}: ${body}`);
  }
});

// Dừng listen
stopListening();
```

**Event types:**

| `event.type` | Mô tả | `event.data` |
|--------------|-------|--------------|
| `message` | Tin nhắn mới | Xem bên dưới |
| `typing` | Người dùng đang gõ | `{ channelId, userId }` |
| `read` | Tin nhắn đã được đọc | `{ channelId, userId }` |
| `notification` | Thông báo hệ thống | `{ ... }` |
| `event` | Event khác (debug) | `{ type, data }` |

**Cấu trúc `event.data` khi `type === 'message'`:**

```js
{
  messageID: '699c774211e0...',
  threadID:  '691c4437a506...',   // channelId
  senderID:  '691c410089308d...',
  senderName: 'Nguyễn Văn A',
  body:      'hello world',       // plain text (HTML đã strip)
  bodyHtml:  '<p>hello world</p>',
  attachments: [],
  createdAt: '2026-02-23T15:02:52.695Z',
  isSystem:  false,
  _raw: { /* payload gốc */ }
}
```

**Reconnect:** Tự động kết nối lại tối đa 5 lần với exponential backoff (1s → 2s → 4s → 8s → 16s).

---

### sendMessage()

Gửi tin nhắn văn bản đến một thread.

```js
const result = await api.sendMessage(threadID, content);
```

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `threadID` | `string` | ID của channel/thread |
| `content` | `string` | Nội dung plain text |

```js
await api.sendMessage('691c4437...', 'Xin chào!');
```

**Returns:** `Promise<{ message: { _id, body, user, createdAt, channelId, ... } }>`

---

### sendAttachment()

Gửi file hoặc ảnh đính kèm. Hỗ trợ stream trực tiếp, không load vào RAM.

```js
const result = await api.sendAttachment(threadID, filePath, caption);
```

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `threadID` | `string` | ✅ | ID của channel |
| `filePath` | `string` | ✅ | Đường dẫn file (tuyệt đối hoặc tương đối) |
| `caption` | `string` | ❌ | Caption đi kèm (mặc định `''`) |

```js
// Gửi ảnh có caption
await api.sendAttachment(threadID, './photo.jpg', 'Ảnh hôm nay');

// Gửi PDF không caption
await api.sendAttachment(threadID, './report.pdf');
```

**Định dạng hỗ trợ:** `.jpg` `.png` `.gif` `.webp` `.mp4` `.pdf` `.zip` `.mp3` `.ogg`

---

### markAsRead()

Đánh dấu đã đọc toàn bộ tin nhắn trong thread.

```js
await api.markAsRead(threadID);
```

```js
// Thường dùng trong listen callback
api.listen((err, event) => {
  if (event?.type === 'message') {
    api.markAsRead(event.data.threadID);
  }
});
```

**Returns:** `Promise<true>`

---

### getThreadList()

Lấy danh sách tất cả cuộc trò chuyện của tài khoản.

```js
const threads = await api.getThreadList();
```

```js
threads.forEach(t => {
  console.log(t._id, t.name, t.scope); // scope: 'direct' | 'group'
});

// Lấy threadID đầu tiên
const threadID = threads[0]._id;
```

**Cấu trúc Thread:**

```js
{
  _id: '691c4437a50691e99899726a',
  type: 'text',
  scope: 'direct',
  name: 'Nguyễn Văn A',
  icon: null,
  isVerified: false,
  lastMessage: { _id, body, user, createdAt },
  lastMessageSentAt: '2026-02-23T15:50:26.453Z',
  lastReadMessage: '...',
  createdAt: '2025-11-18T10:02:31.601Z'
}
```

**Returns:** `Promise<Thread[]>`

---

### getThreadHistory()

Lấy lịch sử tin nhắn của một thread. Hỗ trợ cursor-based pagination.

```js
const { items, nextCursor } = await api.getThreadHistory(threadID, options);
```

| Tham số | Kiểu | Mặc định | Mô tả |
|---------|------|----------|-------|
| `threadID` | `string` | — | ID của channel |
| `options.limit` | `number` | `20` | Số tin nhắn mỗi trang |
| `options.before` | `string` | — | Lấy tin nhắn cũ hơn messageID này |
| `options.after` | `string` | — | Lấy tin nhắn mới hơn messageID này |

```js
// Trang đầu
let page = await api.getThreadHistory(threadID, { limit: 20 });
console.log(page.items); // mảng Message[]

// Load thêm (cũ hơn)
if (page.nextCursor) {
  const older = await api.getThreadHistory(threadID, {
    limit: 20,
    before: page.nextCursor,
  });
}
```

**Returns:** `Promise<{ items: Message[], nextCursor: string|null, previousCursor: string|null }>`

---

### getUserInfo() / getMyProfile()

Lấy thông tin tài khoản đang đăng nhập. `getMyProfile()` là alias của `getUserInfo()`.

```js
const me = await api.getUserInfo();
// hoặc
const me = await api.getMyProfile();
```

```js
console.log(me._id);       // userId — dùng để lọc tin nhắn của bot
console.log(me.email);
console.log(me.username);
console.log(me.fullName);
```

**Returns:** `Promise<User>`

---

## Error Handling

Mọi hàm đều throw error với message rõ ràng:

```js
try {
  await api.sendMessage(threadID, 'Hello');
} catch (err) {
  if (err.message === 'Session expired, please re-login') {
    // Token hết hạn, đăng nhập lại
    api = await login(email, password);
    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState(), null, 2));
  } else {
    console.error(err.message);
  }
}
```

**Danh sách lỗi thường gặp:**

| Lỗi | Nguyên nhân |
|-----|-------------|
| `Session expired, please re-login` | Token hết hạn (401/403) |
| `Max reconnect attempts reached` | WebSocket mất kết nối > 5 lần |
| `sendMessage: channelId là bắt buộc` | Thiếu `threadID` |
| `sendMessage: content là bắt buộc` | Thiếu `content` |
| `sendAttachment: File không tồn tại: ...` | File không tồn tại tại đường dẫn đã cho |
| `loadAppState: token là bắt buộc` | AppState không hợp lệ |

---

## Yêu cầu hệ thống

| | Phiên bản |
|-|-----------|
| Node.js | >= 18.0.0 |
| npm | >= 8.0.0 |

**Dependencies chính:**

| Package | Mục đích |
|---------|----------|
| `axios` | HTTP requests |
| `ws` | WebSocket client |
| `@msgpack/msgpack` | MessagePack encoding (Socket.IO auth) |
| `form-data` | Multipart upload cho sendMessage/sendAttachment |
| `uuid` | Tạo `signId` unique mỗi tin nhắn |
| `axios-cookiejar-support` + `tough-cookie` | Cookie persistence |

---

## Cấu trúc dự án

```
src/
├── index.js              # login() + loadAppState()
├── httpUtils.js          # axios instance, setToken(), cookie jar
├── wsClient.js           # WebSocket — Socket.IO + MessagePack
└── api/
    ├── listen.js
    ├── sendMessage.js
    ├── sendAttachment.js
    ├── markAsRead.js
    ├── getThreadList.js
    ├── getThreadHistory.js
    └── getUserInfo.js
```

---

## License

[MIT](LICENSE) © 2026 [KaiyoDev](https://github.com/KaiyoDev)
