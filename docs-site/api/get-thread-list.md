# getThreadList(limit?)

Lấy danh sách tất cả các cuộc trò chuyện (channels/threads) của tài khoản.

```js
// default: limit = 20
const threads = await api.getThreadList();

// truyền limit tuỳ ý, ví dụ 50
const threads50 = await api.getThreadList(50);
```

## Parameters

| Tên | Kiểu | Bắt buộc | Mặc định | Mô tả |
|-----|------|----------|----------|-------|
| `limit` | `number` | ✗ | `20` | Số thread tối đa mỗi lần lấy |

## Returns

`Promise<Thread[]>` — mảng các thread, sắp xếp theo tin nhắn mới nhất.

```js
[
  {
    _id: '691c4437a50691e99899726a',       // threadID — dùng với sendMessage()
    type: 'text',
    scope: 'direct',                        // 'direct' | 'group'
    name: 'Đặng Hoàng Ân',
    icon: null,
    isVerified: false,
    lastMessage: {
      _id: '699c774211e0...',
      body: '<p>hello</p>',
      user: '691c410089308dee...',
      template: null,
      isSystem: false,
      createdAt: '2026-02-23T15:50:26.445Z'
    },
    lastMessageSentAt: '2026-02-23T15:50:26.453Z',
    lastReadMessage: '699c774211e0...',
    createdAt: '2025-11-18T10:02:31.601Z'
  }
]
```

## Examples

### Lấy danh sách và in ra

```js
const threads = await api.getThreadList(50); // lấy tối đa 50 threads

console.log(`Bạn có ${threads.length} cuộc trò chuyện:`);
threads.forEach(t => {
  console.log(`- [${t._id}] ${t.name} (${t.scope})`);
});
```

### Lấy threadID để gửi tin

```js
const threads = await api.getThreadList();
const threadID = threads[0]._id;

await api.sendMessage(threadID, 'Xin chào!');
```

### Tìm thread theo tên

```js
const threads = await api.getThreadList();
const target = threads.find(t => t.name === 'Đặng Hoàng Ân');

if (target) {
  await api.sendMessage(target._id, 'Chào bạn!');
}
```

### Đọc tất cả threads chưa đọc

```js
const threads = await api.getThreadList();
const unread = threads.filter(
  t => t.lastMessage?._id !== t.lastReadMessage
);

console.log(`${unread.length} threads chưa đọc`);
await Promise.all(unread.map(t => api.markAsRead(t._id)));
```

## Kỹ thuật

Endpoint: `GET https://api.newchat.vn/users/@me/channels?search&before&limit`
