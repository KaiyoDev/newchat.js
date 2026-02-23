# getUserInfo() / getMyProfile()

## getUserInfo()

Lấy thông tin tài khoản đang đăng nhập.

```js
const user = await api.getUserInfo();
```

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

```js
const me = await api.getUserInfo();

console.log('User ID:', me._id);
console.log('Email:', me.email);
console.log('Username:', me.username);
```

---

## getMyProfile()

Alias của `getUserInfo()`. Tên gọi thân thiện hơn khi chỉ cần lấy profile của bot đang chạy.

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

Endpoint: `GET https://api.newchat.vn/auth/me`
