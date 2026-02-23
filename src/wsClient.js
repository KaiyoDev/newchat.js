// newchat.js — wsClient.js

'use strict';

const WebSocket = require('ws');
const EventEmitter = require('events');
const { encode, decode } = require('@msgpack/msgpack');

const WS_URL = 'wss://ws.newchat.vn/socket.io/?EIO=4&transport=websocket';
const MAX_RETRIES = 5;

// Socket.IO packet types (nằm trong field "type" của msgpack frame)
const SIO_CONNECT = 0;
const SIO_EVENT = 2;

// Engine.IO text ping/pong
const EIO_PING = '2';
const EIO_PONG = '3';

// Events tin nhắn
const MESSAGE_EVENTS = ['message', 'new_message'];

const emitter = new EventEmitter();

let ws = null;
let _token = null;
let retryCount = 0;
let manualDisconnect = false;
let pingTimer = null;
let pingIntervalMs = 25000;
let connected = false;

/**
 * Khởi tạo kết nối WebSocket tới Socket.IO server với msgpack encoding.
 * Auth flow:
 *   1. Server gửi TEXT: 0{sid, pingInterval, ...}  (EIO OPEN)
 *   2. Client gửi BINARY: msgpack({ type:0, data:{token}, nsp:"/" })
 *   3. Server gửi BINARY: msgpack({ type:0, data:{sid, pid}, nsp:"/" })  → CONNECT ACK
 *
 * @param {string} token - JWT token từ login()
 */
function connect(token) {
  _token = token;
  manualDisconnect = false;
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
    if (isBinary) {
      _handleBinaryFrame(data);
    } else {
      _handleTextFrame(data.toString());
    }
  });

  ws.on('close', (code) => {
    connected = false;
    _clearPing();
    console.log('[newchat.js] WebSocket đóng, code:', code);
    emitter.emit('disconnect', code);
    if (!manualDisconnect) _reconnect();
  });

  ws.on('error', (err) => {
    console.error('[newchat.js ERROR] WebSocket:', err.message);
    emitter.emit('error', err);
  });
}

/**
 * Xử lý TEXT frame từ server.
 * - EIO OPEN (0{...}) → gửi msgpack CONNECT + auth
 * - EIO PING (2) → trả PONG (3)
 *
 * @param {string} msg
 */
function _handleTextFrame(msg) {
  // EIO OPEN
  if (msg.startsWith('0')) {
    try {
      const handshake = JSON.parse(msg.slice(1));
      pingIntervalMs = handshake.pingInterval || 25000;
      console.log('[newchat.js] EIO OPEN, sid:', handshake.sid);
    } catch (e) {
      console.error('[newchat.js ERROR] Parse EIO OPEN thất bại:', e.message);
    }

    // Gửi CONNECT ACK dạng msgpack binary
    // { type: 0, data: { token }, nsp: "/" }
    try {
      const authFrame = encode({ type: SIO_CONNECT, data: { token: _token }, nsp: '/' });
      ws.send(Buffer.from(authFrame));
      console.log('[newchat.js] Đã gửi msgpack auth frame');
    } catch (e) {
      console.error('[newchat.js ERROR] Encode auth frame thất bại:', e.message);
    }
    return;
  }

  // EIO PING → trả PONG
  if (msg === EIO_PING) {
    ws.send(EIO_PONG);
    return;
  }
}

/**
 * Xử lý BINARY (msgpack) frame từ server.
 * - type 0 + data.sid → CONNECT ACK
 * - type 2 + data[eventName, eventData] → Socket.IO EVENT
 *
 * @param {Buffer} data
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
  if (type === SIO_CONNECT && payload && payload.sid && !connected) {
    connected = true;
    retryCount = 0;
    console.log('[newchat.js] Socket.IO CONNECT ACK ✓  sid:', payload.sid);
    emitter.emit('connected', payload.sid);
    _startPing();
    return;
  }

  // Socket.IO EVENT: { type: 2, data: ["eventName", {...}], nsp: "/" }
  if (type === SIO_EVENT && Array.isArray(payload) && payload.length >= 1) {
    const [eventName, eventData] = payload;
    _dispatchEvent(eventName, eventData);
    return;
  }

  // Frame không nhận dạng được — log để debug
  console.log('[newchat.js] Msgpack frame (unhandled):', JSON.stringify(packet).slice(0, 150));
}

/**
 * Phân loại và emit event ra emitter.
 * @param {string} eventName
 * @param {*} eventData
 */
function _dispatchEvent(eventName, eventData) {
  console.log(`[newchat.js] Event "${eventName}":`, JSON.stringify(eventData).slice(0, 150));

  if (MESSAGE_EVENTS.includes(eventName)) {
    emitter.emit('message', eventData);
    return;
  }

  if (['notification', 'typing', 'read'].includes(eventName)) {
    emitter.emit(eventName, eventData);
    return;
  }

  // Wildcard — emit 'event' để debug
  emitter.emit('event', { type: eventName, data: eventData });
}

/**
 * Encode và gửi Socket.IO EVENT qua msgpack binary frame.
 * { type: 2, data: [eventName, payload], nsp: "/" }
 *
 * @param {string} eventName
 * @param {*} payload
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
 * Tên event "send_message" và payload cần verify từ F12.
 *
 * @param {string} threadId - ID của thread/channel
 * @param {string} content - Nội dung tin nhắn
 */
function sendMessage(threadId, content) {
  // TODO: verify event name ("send_message" | "message") từ F12 DevTools
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
 */
function _reconnect() {
  if (retryCount >= MAX_RETRIES) {
    console.error('[newchat.js ERROR] Đã thử kết nối lại tối đa ' + MAX_RETRIES + ' lần, dừng lại');
    emitter.emit('error', new Error('Max reconnect attempts reached'));
    return;
  }
  const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
  retryCount++;
  console.log(`[newchat.js] Kết nối lại lần ${retryCount}/${MAX_RETRIES} sau ${delay}ms...`);
  setTimeout(() => { if (!manualDisconnect) _createWs(); }, delay);
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
