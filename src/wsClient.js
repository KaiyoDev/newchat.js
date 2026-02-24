// newchat.js — wsClient.js

'use strict';

const WebSocket = require('ws');
const EventEmitter = require('events');
const { encode, decode } = require('@msgpack/msgpack');

const WS_URL = 'wss://ws.newchat.vn/socket.io/?EIO=4&transport=websocket';
const MAX_RETRIES = 5;

// Exponential backoff delays (ms): lần 1=2s, 2=4s, 3=8s, 4=16s, 5=30s
const RETRY_DELAYS = [2000, 4000, 8000, 16000, 30000];

// Socket.IO packet types
const SIO_CONNECT    = 0;
const SIO_DISCONNECT = 1;
const SIO_EVENT      = 2;

// Engine.IO heartbeat
const EIO_PING = '2';
const EIO_PONG = '3';
const EIO_MSG_BYTE = 0x04; // EIO packet type "message" — prefix bắt buộc cho binary frame

// Tên event tin nhắn đã xác nhận từ F12
const MESSAGE_EVENTS = ['channel:message'];

const emitter = new EventEmitter();

let ws              = null;
let _token           = null;
let _currentUserId   = null;  // userId của bot — dùng để filter tin nhắn tự gửi
let retryCount       = 0;
let manualDisconnect = false;
let connected        = false;

/**
 * Khởi tạo kết nối WebSocket tới Socket.IO server.
 * Auth flow:
 *   1. Server → TEXT: 0{sid, pingInterval}  (EIO OPEN)
 *   2. Client → BINARY: msgpack({ type:0, data:{token}, nsp:"/" })
 *   3. Server → BINARY: msgpack({ type:0, data:{sid,pid}, nsp:"/" }) → CONNECT ACK
 *   4. Chờ server push event — không gửi thêm gì sau CONNECT ACK
 *   Heartbeat: Server TEXT "2" (ping) → Client reply TEXT "3" (pong) ngay lập tức
 *
 * @param {string} token  - JWT token từ login()
 * @param {string} userId - User ID của bot (lấy từ JWT payload) để filter self messages
 */
function connect(token, userId) {
  _token         = token;
  _currentUserId = userId || null;
  manualDisconnect = false;
  retryCount = 0;
  _createWs();
}

/**
 * Tạo WebSocket mới và bind toàn bộ event handlers.
 */
function _createWs() {
  if (ws) {
    ws.removeAllListeners();
    ws.terminate();
    ws = null;
  }

  console.log('[newchat.js] Đang kết nối WebSocket...');

  ws = new WebSocket(WS_URL, {
    headers: {
      Origin: 'https://newchat.vn',
      Referer: 'https://newchat.vn/',
      'accept-language': 'vi',
      'x-user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    },
  });

  ws.on('message', (data) => {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const firstByte = buf[0];

    // Engine.IO TEXT frames: byte đầu là ASCII digit '0'–'9' (0x30–0x39)
    // ws library đôi khi deliver text frame dưới dạng Buffer nên KHÔNG dùng isBinary
    if (firstByte >= 0x30 && firstByte <= 0x39) {
      const str = buf.toString('utf8');

      if (str === EIO_PING) {
        ws.send(EIO_PONG);
        console.log('[newchat.js] ← PING → PONG');
        return;
      }

      if (str === EIO_PONG) return; // server pong, ignore

      if (str.startsWith('0')) {
        // EIO OPEN: 0{"sid":"...","pingInterval":25000,...}
        try {
          const eioData = JSON.parse(str.slice(1));
          console.log('[newchat.js] EIO OPEN — sid:', eioData.sid, '| pingInterval:', eioData.pingInterval);
        } catch (e) {
          console.error('[newchat.js ERROR] Parse EIO OPEN thất bại:', e.message);
        }
        _sendAuthFrame();
        return;
      }

      console.log('[newchat.js] EIO text frame (unhandled):', str.slice(0, 80));
      return;
    }

    // Còn lại là binary msgpack frame — decode và xử lý
    _handleSioPacket(buf);
  });

  ws.on('close', (code, reason) => {
    connected = false;
    const reasonStr = reason?.toString() || '(no reason)';
    console.log(`[newchat.js] WebSocket đóng — code: ${code}, reason: ${reasonStr}`);
    emitter.emit('disconnect', code);

    // code 1000 = normal close (manual), không reconnect
    if (!manualDisconnect && code !== 1000) _reconnect();
  });

  ws.on('error', (err) => {
    console.error('[newchat.js ERROR] WebSocket:', err.message);
    emitter.emit('error', err);
  });
}

/**
 * Gửi SIO CONNECT auth frame (raw msgpack, không có EIO prefix).
 */
function _sendAuthFrame() {
  try {
    ws.send(Buffer.from(encode({ type: SIO_CONNECT, data: { token: _token }, nsp: '/' })));
    console.log('[newchat.js] Đã gửi msgpack auth frame (SIO_CONNECT)');
  } catch (e) {
    console.error('[newchat.js ERROR] Encode auth frame thất bại:', e.message);
  }
}

/**
 * Decode và xử lý Socket.IO binary (msgpack) frame.
 * Frame có thể có EIO prefix byte 0x04 (EVENT) hoặc không (CONNECT ACK).
 */
function _handleSioPacket(buf) {
  let packet;
  try {
    // EVENT frames có EIO prefix 0x04, CONNECT ACK thì không
    const payload = buf[0] === EIO_MSG_BYTE ? buf.slice(1) : buf;
    packet = decode(payload);
  } catch (e) {
    console.error('[newchat.js ERROR] Decode msgpack frame thất bại:', e.message,
      '| first byte:', buf[0]?.toString(16), '| len:', buf.length);
    return;
  }

  const { type, nsp, data: payload } = packet;

  // CONNECT ACK: { type: 0, data: { sid, pid }, nsp: "/" }
  if (type === SIO_CONNECT && payload?.sid && !connected) {
    connected  = true;
    retryCount = 0;
    console.log('[newchat.js] Socket.IO CONNECT ACK ✓  sid:', payload.sid);
    emitter.emit('connected', payload.sid);
    return;
  }

  // DISCONNECT từ server
  if (type === SIO_DISCONNECT) {
    console.warn('[newchat.js] Server gửi SIO_DISCONNECT, nsp:', nsp);
    return;
  }

  // Socket.IO EVENT: { type: 2, data: ["eventName", {...}], nsp: "/" }
  if (type === SIO_EVENT && Array.isArray(payload) && payload.length >= 1) {
    const [eventName, eventData] = payload;
    _dispatchEvent(eventName, eventData);
    return;
  }

  // Mọi frame khác — log đầy đủ để debug (kể cả frame server gửi trước khi đóng)
  console.log(
    '[newchat.js] Msgpack frame (unhandled) — type:', type,
    '| nsp:', nsp,
    '| payload:', JSON.stringify(payload).slice(0, 200)
  );
}


/**
 * Chuẩn hoá raw payload của event "channel:message" thành format thống nhất.
 *
 * Payload thực tế từ server:
 * { action: "create", message: { _id, channelId, body, attachments,
 *   createdAt, isSystem, signId, user: { _id, fullName } } }
 */
function _normalizeMessage(eventName, raw) {
  const stripHtml = (str) =>
    typeof str === 'string' ? str.replace(/<[^>]*>/g, '').trim() : str;

  // Server bọc payload trong field "message"
  const msg = raw.message || raw;

  return {
    type:        'message',
    action:      raw.action     || null,   // "create" | "update" | "delete"
    messageID:   msg._id        || null,
    threadID:    msg.channelId  || null,
    senderID:    msg.user?._id  || null,
    senderName:  msg.user?.fullName || null,
    body:        stripHtml(msg.body || ''),
    bodyHtml:    msg.body       || null,
    attachments: msg.attachments || [],
    createdAt:   msg.createdAt  || null,
    isSystem:    msg.isSystem   || false,
    signId:      msg.signId     || null,
    isSelf:      !!(_currentUserId && msg.user?._id === _currentUserId),
    _raw:        raw,
  };
}

/**
 * Phân loại và emit event ra emitter.
 */
function _dispatchEvent(eventName, eventData) {
  console.log(`[newchat.js] Event "${eventName}":`, JSON.stringify(eventData).slice(0, 200));

  if (MESSAGE_EVENTS.includes(eventName)) {
    const msg = _normalizeMessage(eventName, eventData);
    if (msg.isSelf) {
      console.log('[newchat.js] Bỏ qua tin nhắn của chính bot (isSelf)');
      return;
    }
    emitter.emit('message', msg);
    return;
  }

  if (['notification', 'typing', 'read'].includes(eventName)) {
    emitter.emit(eventName, eventData);
    return;
  }

  emitter.emit('event', { type: eventName, data: eventData });
}

/**
 * Wrap msgpack bytes với EIO prefix byte 0x04 trước khi gửi.
 * EIO4 binary frame = [0x04][...msgpack...]
 * @param {Uint8Array} encoded - kết quả từ encode()
 * @returns {Buffer}
 */
function _eioWrap(encoded) {
  return Buffer.concat([Buffer.from([EIO_MSG_BYTE]), Buffer.from(encoded)]);
}

/**
 * Encode và gửi Socket.IO EVENT qua msgpack binary frame.
 */
function _emitEvent(eventName, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error('[newchat.js ERROR] WebSocket chưa kết nối');
  }
  ws.send(_eioWrap(encode({ type: SIO_EVENT, data: [eventName, payload], nsp: '/' })));
}

/**
 * Gửi tin nhắn qua WebSocket Socket.IO event.
 */
function sendMessage(threadId, content) {
  _emitEvent('send_message', { to: threadId, content, type: 'text' });
}


/**
 * Tự động kết nối lại với exponential backoff, tối đa MAX_RETRIES lần.
 * Nếu vượt quá → emit 'error' và dừng hẳn.
 */
function _reconnect() {
  if (retryCount >= MAX_RETRIES) {
    const err = new Error(`WebSocket thất bại sau ${MAX_RETRIES} lần kết nối lại, dừng hẳn`);
    console.error('[newchat.js ERROR]', err.message);
    emitter.emit('error', err);
    return;
  }

  const delay = RETRY_DELAYS[retryCount] ?? 30000;
  retryCount++;
  console.log(`[newchat.js] Kết nối lại lần ${retryCount}/${MAX_RETRIES} sau ${delay}ms...`);
  setTimeout(() => {
    if (!manualDisconnect) _createWs();
  }, delay);
}

/**
 * Ngắt kết nối và tắt auto-reconnect.
 */
function disconnect() {
  manualDisconnect = true;
  connected = false;
  if (ws) {
    ws.close(1000, 'manual disconnect');
    ws = null;
  }
}

module.exports = { connect, disconnect, emitter };
