# getThreadHistory()

Lấy lịch sử tin nhắn của một channel. Hỗ trợ phân trang bằng cursor.

```js
const { items, nextCursor, previousCursor } = await api.getThreadHistory(threadID, options);
```

## Parameters

| Tên | Kiểu | Bắt buộc | Mặc định | Mô tả |
|-----|------|----------|----------|-------|
| `threadID` | `string` | ✅ | — | ID của channel |
| `options.limit` | `number` | ❌ | `20` | Số tin nhắn mỗi trang |
| `options.before` | `string` | ❌ | — | Cursor: lấy tin nhắn **cũ hơn** messageID này |
| `options.after` | `string` | ❌ | — | Cursor: lấy tin nhắn **mới hơn** messageID này |

## Returns

```js
{
  items: Message[],
  nextCursor: string | null,      // dùng làm `before` để load trang cũ hơn
  previousCursor: string | null   // dùng làm `after` để load trang mới hơn
}
```

### Cấu trúc Message

```js
{
  _id: '699c774211e0ddc33b19e93c',
  body: '<p>Hello từ newchat.js!</p>',
  template: null,
  attachments: null,
  user: {
    _id: '691c410089308dee9775c3bc',
    fullName: 'Bot',
    avatarUrl: null,
    isVerified: false
  },
  isSystem: false,
  pinnedAt: null,
  editedAt: null,
  reactions: [],
  createdAt: '2026-02-23T15:50:26.445Z',
  cm: null
}
```

::: info Thứ tự
`items` được trả về từ **mới nhất → cũ nhất** (index 0 là tin mới nhất).
:::

## Examples

### Lấy 20 tin nhắn mới nhất

```js
const { items } = await api.getThreadHistory(threadID);

items.forEach(msg => {
  const text = msg.body.replace(/<[^>]*>/g, ''); // strip HTML
  console.log(`[${msg.user.fullName}]: ${text}`);
});
```

### Load thêm tin nhắn cũ hơn (infinite scroll)

```js
let page = await api.getThreadHistory(threadID, { limit: 20 });

while (page.nextCursor) {
  console.log(`Đã load ${page.items.length} tin, load thêm...`);

  page = await api.getThreadHistory(threadID, {
    limit: 20,
    before: page.nextCursor,  // [!code focus]
  });
}

console.log('Đã load hết lịch sử');
```

### Lấy tất cả lịch sử vào một mảng

```js
async function getAllHistory(threadID) {
  const all = [];
  let cursor = undefined;

  do {
    const page = await api.getThreadHistory(threadID, {
      limit: 50,
      before: cursor,
    });
    all.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);

  return all;
}
```

## Kỹ thuật

Endpoint: `GET https://api.newchat.vn/channels/{channelId}/messages?limit=&before=&after=`
