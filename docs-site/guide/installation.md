# Installation

## Yêu cầu

- **Node.js** >= 18.0.0
- **npm** hoặc **yarn**

## Cài đặt

::: code-group

```bash [npm]
npm install newchat.js
```

```bash [yarn]
yarn add newchat.js
```

:::

## Kiểm tra cài đặt

```js
const login = require('newchat.js');
console.log(typeof login); // 'function'
```

## Cấu hình môi trường (khuyến nghị)

Tạo file `.env` để lưu credentials:

```ini
EMAIL=your@email.com
PASSWORD=yourpassword
```

Cài `dotenv`:

```bash
npm install dotenv
```

Dùng trong code:

```js
require('dotenv').config();

const login = require('newchat.js');
const api = await login(process.env.EMAIL, process.env.PASSWORD);
```

::: warning
Không commit file `.env` lên Git. Thêm vào `.gitignore`:
```
.env
appstate.json
```
:::

## Dependencies

newchat.js sử dụng các package sau (tự động cài):

| Package | Mục đích |
|---------|----------|
| `axios` | HTTP client |
| `ws` | WebSocket client |
| `@msgpack/msgpack` | MessagePack encoding cho Socket.IO |
| `form-data` | Multipart upload |
| `uuid` | Tạo signId cho mỗi message |
| `axios-cookiejar-support` + `tough-cookie` | Cookie persistence |
