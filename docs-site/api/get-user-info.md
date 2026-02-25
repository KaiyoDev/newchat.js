# getUserInfo(userID?) / getMyProfile()

## getUserInfo(userID?)

Lấy thông tin user:

- Nếu **không truyền** `userID` → trả về info tài khoản đang đăng nhập (bot hiện tại).
- Nếu **truyền** `userID` → trả về info user tương ứng.

```js
// Không tham số → info bot hiện tại
const me = await api.getUserInfo();

// Truyền userID → info user bất kỳ
const other = await api.getUserInfo('abc123');
```

### Parameters

| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `userID` | `string` | ✗ | ID user cần lấy info. Nếu bỏ trống → dùng user hiện đăng nhập |

### Returns

`Promise<User>`

```js
{
  _id: '691c410089308dee9775c3bc',
  profileId: '580',
  email: 'user@example.com',
  username: 'mybot',
  fullName: 'My Bot',
  nickname: null,
  bio: '',
  avatarUrl: null,
  phoneNumber: null,
  gender: null,
  dateOfBirth: null,
  isVerified: false,
  isEnabledTwoFA: false,
  permissions: [],
  createdAt: '2025-11-18T09:48:48.039Z',
  lastChangeUsernameAt: null,
  completedTutorialAt: '2026-02-23T14:20:20.538Z'
}
```

### Throws

| Lỗi | Nguyên nhân |
|-----|-------------|
| `Session expired, please re-login` | Token hết hạn |

### Examples

#### Lấy info bot hiện tại

```js
const me = await api.getUserInfo();

console.log('User ID:', me._id);
console.log('Email:', me.email);
console.log('Username:', me.username);
```

#### Lấy info user bất kỳ theo ID

```js
// ví dụ lấy user từ thread đầu tiên
const threads = await api.getThreadList(1);
const firstThread = threads[0];

const targetUserId =
  firstThread?.lastMessage?.user?._id ||
  firstThread?.lastMessage?.senderId;

if (targetUserId) {
  const user = await api.getUserInfo(targetUserId);
  console.log('Target user:', user.fullName || user.username, user._id);
}
```

---

## getMyProfile()

Alias của `getUserInfo()` **không tham số**. Tên gọi thân thiện hơn khi chỉ cần lấy profile của bot đang chạy.

```js
const profile = await api.getMyProfile();
```

### Returns

`Promise<User>` — giống `getUserInfo()`.

### Example

```js
const profile = await api.getMyProfile();
console.log(`Bot: ${profile.fullName} (@${profile.username})`);
```

---

## Dùng _id để lọc tin nhắn của bot

Trong `listen()`, dùng `_id` để bỏ qua tin nhắn bot tự gửi:

```js
const me = await api.getMyProfile();

api.listen((err, event) => {
  if (event?.type === 'message') {
    const { senderID, threadID, body } = event.data;

    if (senderID === me._id) return; // [!code focus] bỏ qua tin của bot

    api.sendMessage(threadID, `Echo: ${body}`);
  }
});
```

## Kỹ thuật

Endpoint:

- `GET https://api.newchat.vn/auth/me` — khi **không truyền** `userID`
- `GET https://api.newchat.vn/users/{userID}` — khi **truyền** `userID`
