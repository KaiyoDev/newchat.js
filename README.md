<div align="center">

# newchat.js

**Unofficial Node.js API wrapper for [newchat.vn](https://newchat.vn)**

[![npm](https://img.shields.io/npm/v/newchat.js?color=crimson&style=flat-square)](https://www.npmjs.com/package/newchat.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org)
[![GitHub](https://img.shields.io/badge/GitHub-KaiyoDev-black?style=flat-square&logo=github)](https://github.com/KaiyoDev/newchat.js)

</div>

---

> **⚠️ Disclaimer:** Đây là thư viện **không chính thức** (unofficial), không được phát triển hay bảo trì bởi đội ngũ newchat.vn. Sử dụng trên tinh thần tự chịu trách nhiệm. API có thể thay đổi bất kỳ lúc nào mà không có thông báo trước.

---

## Installation

```bash
npm install newchat.js
```

---

## Echo Bot — Quickstart

```js
const login = require('newchat.js');
const { loadAppState } = require('newchat.js');
const fs = require('fs');

const STATE_FILE = './appstate.json';

async function start() {
  let api;

  // Tái sử dụng session nếu đã lưu — không cần login lại mỗi lần
  if (fs.existsSync(STATE_FILE)) {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    api = await loadAppState(saved);
  } else {
    api = await login('your@email.com', 'yourpassword');
    fs.writeFileSync(STATE_FILE, JSON.stringify(api.getAppState(), null, 2));
  }

  const me = await api.getMyProfile();
  console.log(`Bot đang chạy: ${me.fullName} (@${me.username})`);

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

## API Reference

Xem đầy đủ tại **[DOCS.md](DOCS.md)**

| Hàm | Mô tả |
|-----|-------|
| `login(email, password)` | Đăng nhập, trả về `api` object |
| `loadAppState({ token })` | Khôi phục session đã lưu, bỏ qua login |
| `api.getAppState()` | Lấy token để lưu lại |
| `api.listen(callback)` | Lắng nghe tin nhắn realtime qua WebSocket |
| `api.sendMessage(threadID, text)` | Gửi tin nhắn văn bản |
| `api.sendAttachment(threadID, filePath, caption?)` | Gửi ảnh / file đính kèm |
| `api.markAsRead(threadID)` | Đánh dấu đã đọc |
| `api.getThreadList()` | Lấy danh sách cuộc trò chuyện |
| `api.getThreadHistory(threadID, options?)` | Lấy lịch sử tin nhắn (có phân trang) |
| `api.getUserInfo()` | Lấy thông tin tài khoản đang đăng nhập |
| `api.getMyProfile()` | Alias của `getUserInfo()` |

---

## License

[MIT](LICENSE) © [KaiyoDev](https://github.com/KaiyoDev)
