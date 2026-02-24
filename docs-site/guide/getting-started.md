# Getting Started

## Echo Bot trong 5 phút

### 1. Cài đặt

```bash
npm install newchat.js dotenv
```

### 2. Tạo file `.env`

```ini
EMAIL=your@email.com
PASSWORD=yourpassword
```

### 3. Viết bot

Tạo file `bot.js`:

```js
require('dotenv').config();
const login = require('newchat.js');
const { loadAppState } = require('newchat.js');
const fs = require('fs');

const STATE_FILE = './appstate.json';

async function start() {
  let api;

  // Tái sử dụng session nếu đã lưu
  if (fs.existsSync(STATE_FILE)) {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    api = await loadAppState(saved);
  } else {
    api = await login(process.env.EMAIL, process.env.PASSWORD);
    fs.writeFileSync(STATE_FILE, JSON.stringify(api.getAppState(), null, 2));
  }

  const me = await api.getMyProfile();
  console.log(`✅ Bot đang chạy: ${me.fullName} (@${me.username})`);

  const { stopListening } = await api.listen((err, event) => {
    if (err) return console.error('[ERROR]', err.message);

    if (event.type !== 'message') return;

    const { threadID, body, senderName, isSelf } = event.data;

    // isSelf tự động — không cần so sánh senderID thủ công
    if (isSelf) return;

    console.log(`[${threadID}] ${senderName}: ${body}`);

    if (body === '/ping') {
      api.sendMessage(threadID, 'pong 🏓').catch(console.error);
    } else {
      api.sendMessage(threadID, `Echo: ${body}`).catch(console.error);
    }

    api.markAsRead(threadID).catch(console.error);
  });

  process.on('SIGINT', () => {
    stopListening();
    console.log('\nBot đã dừng.');
    process.exit(0);
  });
}

start().catch(console.error);
```

### 4. Chạy

```bash
node bot.js
```

```
[newchat.js] Đang đăng nhập...
[newchat.js] Đăng nhập thành công
✅ Bot đang chạy: My Bot (@mybot)
[newchat.js] WebSocket đã kết nối, id: abc123
```

---

## Luồng hoạt động

```
login(email, pass)
      │
      ▼
  api object ──────────────────────────────────────┐
      │                                             │
      ├── listen(callback)   ← WebSocket realtime  │
      │        │                                    │
      │        └── event.type === 'message'         │
      │                  │                          │
      │                  ▼                          │
      ├── sendMessage(threadID, text) ──────────────┤
      ├── markAsRead(threadID) ─────────────────────┤
      ├── getThreadList() ──────────────────────────┤
      └── getAppState() → lưu session ──────────────┘
```

---

## AppState — Không cần login lại

Sau lần đăng nhập đầu, token được lưu vào `appstate.json`. Những lần sau bot dùng `loadAppState()` để bỏ qua bước login:

```js
const { loadAppState } = require('newchat.js');
const fs = require('fs');

const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
const api = await loadAppState(appState);
```

::: tip
Token newchat.vn có hiệu lực ~30 ngày. Khi hết hạn, login lại và lưu AppState mới.
:::

---

## Gửi tin nhắn

```js
// Văn bản
await api.sendMessage(threadID, 'Xin chào!');

// Ảnh + caption
await api.sendAttachment(threadID, './image.png', 'Caption ở đây');

// File không có caption
await api.sendAttachment(threadID, './document.pdf');
```

---

## Lấy danh sách chat

```js
const threads = await api.getThreadList();

for (const thread of threads) {
  console.log(thread._id, thread.name);
}
```

---

## Xem thêm

- [Installation](/guide/installation) — Cài đặt chi tiết, biến môi trường
- [login()](/api/login) — Đăng nhập và AppState
- [listen()](/api/listen) — Tất cả event types
- [sendMessage()](/api/send-message) — Gửi tin nhắn
