<div align="center">

  <!-- Logo — dark/light theme với drop shadow -->
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/KaiyoDev/newchat.js/main/docs-site/public/logo.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/KaiyoDev/newchat.js/main/docs-site/public/logo.svg">
    <img
      src="https://raw.githubusercontent.com/KaiyoDev/newchat.js/main/docs-site/public/logo.svg"
      alt="newchat.js"
      width="400"
      style="filter: drop-shadow(0 4px 24px rgba(229,17,55,0.35)); margin-bottom: 8px;"
    />
  </picture>

  <h1>newchat.js</h1>
  <p><b>Unofficial Node.js API wrapper for <a href="https://newchat.vn">newchat.vn</a></b></p>

  <p>
    <a href="https://www.npmjs.com/package/newchat.js">
      <img src="https://img.shields.io/npm/v/newchat.js?color=e51137&style=for-the-badge&logo=npm&logoColor=white" alt="npm version"/>
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge" alt="MIT license"/>
    </a>
    <a href="https://nodejs.org">
      <img src="https://img.shields.io/badge/Node.js-%3E%3D18-43853d?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js >=18"/>
    </a>
    <a href="https://kaiyodev.github.io/newchat.js">
      <img src="https://img.shields.io/badge/Docs-VitePress-646cff?style=for-the-badge" alt="Docs"/>
    </a>
  </p>

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

Xem đầy đủ tại **[docs site](https://kaiyodev.github.io/newchat.js)**.

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

## Thống kê Download

<div align="center">

[![npm downloads](https://img.shields.io/npm/dt/newchat.js?label=Total%20Downloads&logo=npm&color=red)](https://www.npmjs.com/package/newchat.js)
[![npm weekly](https://img.shields.io/npm/dw/newchat.js?label=Weekly&logo=npm&color=orange)](https://www.npmjs.com/package/newchat.js)
[![npm monthly](https://img.shields.io/npm/dm/newchat.js?label=Monthly&logo=npm&color=yellow)](https://www.npmjs.com/package/newchat.js)

<a href="https://npmtrends.com/newchat.js">
  <img src="assets/npm-downloads.png" alt="npm downloads chart" width="700"/>
</a>


</div>

---

## Build & Phát triển

```bash
# Cài dependencies
npm install newchat.js

# Chạy test (ping/pong bot)
node test.js

# Build docs
cd docs-site && npm run build
```

---

## License

MIT © [KaiyoDev](https://github.com/KaiyoDev)

> ⚠️ Unofficial — không liên kết với đội ngũ newchat.vn. API có thể thay đổi bất kỳ lúc nào.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/KaiyoDev"><img src="https://avatars.githubusercontent.com/u/145342881?v=4?s=100" width="100px;" alt="Đặng Hoàng Ân"/><br /><sub><b>Đặng Hoàng Ân</b></sub></a><br /><a href="https://github.com/KaiyoDev/newchat.js/commits?author=KaiyoDev" title="Code">💻</a> <a href="https://github.com/KaiyoDev/newchat.js/commits?author=KaiyoDev" title="Documentation">📖</a> <a href="#maintenance-KaiyoDev" title="Maintenance">🚧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!