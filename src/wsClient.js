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

// Tên event tin nhắn đã xác nhận từ F12
const MESSAGE_EVENTS = ['channel:message'];

const emitter = new EventEmitter();

let ws              = null;
let _token          = null;
let _channelIds     = [];   // danh sách channel cần subscribe sau CONNECT ACK
let retryCount      = 0;
let manualDisconnect = false;
let pingTimer       = null;
let pingIntervalMs  = 25000;
let connected       = false;

/**
 * Khởi tạo kết nối WebSocket tới Socket.IO server.
 * Auth flow:
 *   1. Server → TEXT: 0{sid, pingInterval, ...}   (EIO OPEN)
 *   2. Client → BINARY: msgpack({ type:0, data:{token}, nsp:"/" })
 *   3. Server → BINARY: msgpack({ type:0, data:{sid,pid}, nsp:"/" }) → CONNECT ACK
 *   4. Server tự push event "channel:message" — không cần subscribe thêm
 *   Heartbeat: Server gửi TEXT "2" (ping) → Client reply TEXT "3" (pong) ngay lập tức
 *
 * @param {string}   token      - JWT token từ login()
 * @param {string[]} [channelIds=[]] - Danh sách channel IDs để subscribe ngay sau CONNECT ACK
 */
function connect(token, channelIds) {
  _token      = token;
  _channelIds = Array.isArray(channelIds) ? channelIds : [];
  manualDisconnect = false;
  retryCount  = 0;
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

  ws.on('message', (data, isBinary) => {
    // EIO ping/pong: ưu tiên xử lý trước, không qua _handleTextFrame
    if (!isBinary && data.toString() === EIO_PING) {
      ws.send(EIO_PONG);
      return;
    }

    if (isBinary) {
      _handleBinaryFrame(data);
    } else {
      _handleTextFrame(data.toString());
    }
  });

  ws.on('close', (code, reason) => {
    connected = false;
    _clearPing();
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
 * Xử lý TEXT frame từ server.
 * - EIO OPEN (0{...}) → gửi msgpack CONNECT + auth
 * - EIO PING (2)      → trả PONG (3)
 */
function _handleTextFrame(msg) {
  // EIO OPEN
  if (msg.startsWith('0')) {
    try {
      const handshake = JSON.parse(msg.slice(1));
      pingIntervalMs = handshake.pingInterval || 25000;
      console.log('[newchat.js] EIO OPEN — sid:', handshake.sid, '| pingInterval:', pingIntervalMs);
    } catch (e) {
      console.error('[newchat.js ERROR] Parse EIO OPEN thất bại:', e.message);
    }

    try {
      const authFrame = encode({ type: SIO_CONNECT, data: { token: _token }, nsp: '/' });
      ws.send(Buffer.from(authFrame));
      console.log('[newchat.js] Đã gửi msgpack auth frame (SIO_CONNECT)');
    } catch (e) {
      console.error('[newchat.js ERROR] Encode auth frame thất bại:', e.message);
    }
    return;
  }

  console.log('[newchat.js] TEXT frame (unhandled):', msg.slice(0, 120));
}

/**
 * Xử lý BINARY (msgpack) frame từ server.
 * Log toàn bộ frame nhận được sau CONNECT ACK để debug.
 */
function _handleBinaryFrame(data) {
  let packet;
  try {
    packet = decode(data);
  } catch (e) {
    console.error('[newchat.js ERROR] Decode msgpack frame thất bại:', e.message);
    return;
  }

  const { type, nsp, data: payload } = packet;

  // CONNECT ACK: { type: 0, data: { sid, pid }, nsp: "/" }
  if (type === SIO_CONNECT && payload?.sid && !connected) {
    connected  = true;
    retryCount = 0;
    console.log('[newchat.js] Socket.IO CONNECT ACK ✓  sid:', payload.sid);
    emitter.emit('connected', payload.sid);
    _startPing();
    _subscribeChannels();
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
 * Subscribe vào danh sách channels ngay sau CONNECT ACK.
 * Nếu server kick do không subscribe, đây là bước bắt buộc.
 */
function _subscribeChannels() {
  if (!_channelIds || _channelIds.length === 0) {
    console.log('[newchat.js] Không có channelIds để subscribe — bỏ qua');
    return;
  }

  try {
    const frame = encode({
      type: SIO_EVENT,
      data: ['subscribe', { channels: _channelIds }],
      nsp: '/',
    });
    ws.send(Buffer.from(frame));
    console.log(`[newchat.js] Đã gửi subscribe cho ${_channelIds.length} channels`);
  } catch (e) {
    console.error('[newchat.js ERROR] Gửi subscribe thất bại:', e.message);
  }
}

/**
 * Chuẩn hoá raw payload của event "channel:message" thành format thống nhất.
 *
 * Payload mẫu đã xác nhận từ F12:
 * {
 *   _id, channelId, user: { _id, fullName }, body, attachments,
 *   createdAt, isSystem, signId
 * }
 */
function _normalizeMessage(eventName, raw) {
  const stripHtml = (str) =>
    typeof str === 'string' ? str.replace(/<[^>]*>/g, '').trim() : str;

  return {
    type:        'message',
    messageID:   raw._id        || null,
    threadID:    raw.channelId  || null,
    senderID:    raw.user?._id  || null,
    senderName:  raw.user?.fullName || null,
    body:        stripHtml(raw.body || ''),
    bodyHtml:    raw.body       || null,
    attachments: raw.attachments || [],
    createdAt:   raw.createdAt  || null,
    isSystem:    raw.isSystem   || false,
    signId:      raw.signId     || null,   // dùng để dedup tin nhắn tự gửi
    _raw:        raw,
  };
}

/**
 * Phân loại và emit event ra emitter.
 */
function _dispatchEvent(eventName, eventData) {
  console.log(`[newchat.js] Event "${eventName}":`, JSON.stringify(eventData).slice(0, 200));

  if (MESSAGE_EVENTS.includes(eventName)) {
    emitter.emit('message', _normalizeMessage(eventName, eventData));
    return;
  }

  if (['notification', 'typing', 'read'].includes(eventName)) {
    emitter.emit(eventName, eventData);
    return;
  }

  emitter.emit('event', { type: eventName, data: eventData });
}

/**
 * Encode và gửi Socket.IO EVENT qua msgpack binary frame.
 */
function _emitEvent(eventName, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error('[newchat.js ERROR] WebSocket chưa kết nối');
  }
  const frame = encode({ type: SIO_EVENT, data: [eventName, payload], nsp: '/' });
  ws.send(Buffer.from(frame));
}

/**
 * Gửi tin nhắn qua WebSocket Socket.IO event.
 */
function sendMessage(threadId, content) {
  _emitEvent('send_message', { to: threadId, content, type: 'text' });
}

/**
 * Ping định kỳ theo pingInterval từ EIO OPEN (Engine.IO heartbeat).
 */
function _startPing() {
  _clearPing();
  pingTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(EIO_PING);
    }
  }, pingIntervalMs);
}

function _clearPing() {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
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
  _clearPing();
  connected = false;
  if (ws) {
    ws.close();
    ws = null;
  }
}

module.exports = { connect, disconnect, sendMessage, emitter };
