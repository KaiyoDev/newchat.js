# login() / loadAppState()

## login()

Đăng nhập bằng email + password. Trả về `api` object chứa toàn bộ các hàm.

```js
const login = require('newchat.js');
const api = await login(email, password);
```

### Parameters

| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `email` | `string` | ✅ | Email tài khoản newchat.vn |
| `password` | `string` | ✅ | Mật khẩu tài khoản |

### Returns

`Promise<api>` — object gồm toàn bộ các hàm API.

### Throws

| Lỗi | Nguyên nhân |
|-----|-------------|
| `Session expired, please re-login` | Sai email/password (401/403) |
| `Không tìm thấy token trong response từ server` | Server trả response bất thường |

### Example

```js
const login = require('newchat.js');

const api = await login('user@example.com', 'password123');

// Lưu session để dùng lại
const appState = api.getAppState();
console.log(appState); // { token: 'eyJ...' }
```

---

## loadAppState()

Khôi phục session từ AppState đã lưu. Bỏ qua bước đăng nhập, tiết kiệm 1 request mỗi lần khởi động bot.

```js
const { loadAppState } = require('newchat.js');
const api = await loadAppState({ token });
```

### Parameters

| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `appState.token` | `string` | ✅ | JWT token lấy từ `getAppState()` |

### Returns

`Promise<api>` — giống `login()`.

### Example

```js
const { loadAppState } = require('newchat.js');
const fs = require('fs');

const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
const api = await loadAppState(appState);
```

---

## getAppState()

Trả về AppState hiện tại để serialize và lưu lại. Tương tự pattern AppState của fca-unofficial.

```js
const appState = api.getAppState();
// { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
```

### Returns

`{ token: string }`

### Lưu và load AppState

```js
const login = require('newchat.js');
const { loadAppState } = require('newchat.js');
const fs = require('fs');

const STATE_FILE = './appstate.json';

async function getApi() {
  if (fs.existsSync(STATE_FILE)) {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    try {
      return await loadAppState(saved); // [!code focus]
    } catch {
      // token hết hạn → login lại
    }
  }
  const api = await login(process.env.EMAIL, process.env.PASSWORD);
  fs.writeFileSync(STATE_FILE, JSON.stringify(api.getAppState(), null, 2)); // [!code focus]
  return api;
}
```

::: tip Token lifetime
Token newchat.vn có hiệu lực ~30 ngày (`exp` trong JWT payload). Khi hết hạn sẽ nhận lỗi `Session expired, please re-login`.
:::
