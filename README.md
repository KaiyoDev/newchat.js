<div align="center">

# newchat.js

**Unofficial Node.js API wrapper for [newchat.vn](https://newchat.vn)**

[![npm](https://img.shields.io/npm/v/newchat.js?color=crimson&style=flat-square)](https://www.npmjs.com/package/newchat.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org)
[![Docs](https://img.shields.io/badge/Docs-VitePress-646cff?style=flat-square)](https://kaiyodev.github.io/newchat.js)

</div>

---

## Cài đặt

```bash
npm install newchat.js
```

---

## Quickstart

```js
const login = require('newchat.js');

const api = await login('email@example.com', 'password');

await api.listen((err, event) => {
  if (err || event.type !== 'message') return;
  if (event.data.isSelf) return;

  if (event.data.body === '/ping') {
    api.sendMessage(event.data.threadID, 'pong 🏓');
  }
});
```

> **Demo:** Bot nhận `/ping` và trả về `pong 🏓`

![Test thành công](image/Test.png)

---

## AppState — Không cần login lại

```js
const fs = require('fs');
const { loadAppState } = require('newchat.js');

// Lưu session
const api = await login('email@example.com', 'password');
fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));

// Lần sau dùng lại
const api = await loadAppState(JSON.parse(fs.readFileSync('appstate.json')));
```

---

## API

| Hàm | Mô tả |
|-----|-------|
| `login(email, password)` | Đăng nhập, trả về api object |
| `loadAppState({ token })` | Khôi phục session từ token |
| `api.getAppState()` | Lấy `{ token }` để lưu |
| `api.listen(callback)` | Lắng nghe events realtime qua WebSocket |
| `api.sendMessage(threadID, text)` | Gửi tin nhắn văn bản |
| `api.sendAttachment(threadID, filePath, caption?)` | Gửi file/ảnh |
| `api.markAsRead(threadID)` | Đánh dấu đã đọc |
| `api.getThreadList()` | Danh sách cuộc trò chuyện |
| `api.getThreadHistory(threadID, options?)` | Lịch sử tin nhắn |
| `api.getUserInfo()` | Thông tin tài khoản đang đăng nhập |
| `api.getMyProfile()` | Alias của `getUserInfo()` |

Xem đầy đủ tại **[DOCS.md](DOCS.md)** hoặc **[docs site](https://kaiyodev.github.io/newchat.js)**.

---

## Cấu trúc dự án

```
newchat.js/
├── src/
│   ├── index.js          # Entry point — login(), loadAppState()
│   ├── httpUtils.js      # Axios instance + setToken()
│   ├── wsClient.js       # WebSocket — Socket.IO v4 + MessagePack
│   └── api/
│       ├── listen.js
│       ├── sendMessage.js
│       ├── sendAttachment.js
│       ├── markAsRead.js
│       ├── getThreadList.js
│       ├── getThreadHistory.js
│       └── getUserInfo.js
├── docs-site/            # VitePress documentation
├── DOCS.md               # API reference đầy đủ
├── test.js               # Test script
└── package.json
```

---

## Kiến trúc

```
REST  →  https://api.newchat.vn   (Bearer JWT)
WS    →  wss://ws.newchat.vn      (Socket.IO v4 + MessagePack binary)
```

**WebSocket auth flow:**
1. Server gửi EIO OPEN (`0{sid,...}`)
2. Client gửi binary msgpack `{ type:0, data:{token}, nsp:"/" }`
3. Server xác nhận CONNECT ACK
4. Server push `channel:message` events

---

## Build & Phát triển

```bash
# Cài dependencies
npm install

# Chạy test (ping/pong bot)
node test.js

# Build docs
cd docs-site && npm run build
```

---

## License

MIT © [KaiyoDev](https://github.com/KaiyoDev)

> ⚠️ Unofficial — không liên kết với đội ngũ newchat.vn. API có thể thay đổi bất kỳ lúc nào.
