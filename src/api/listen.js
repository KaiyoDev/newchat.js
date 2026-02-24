// newchat.js — listen.js

'use strict';

const wsClient = require('../wsClient');

/**
 * Factory function trả về hàm listen.
 * @param {string} token - Bearer token
 * @param {import('axios').AxiosInstance} httpClient - Axios instance dùng chung
 * @returns {Function}
 */
module.exports = function (token, httpClient) {
  /**
   * Lắng nghe sự kiện realtime từ Socket.IO server qua WebSocket.
   * Tự động lấy danh sách channels và subscribe ngay sau khi CONNECT ACK.
   * Gọi stopListening() để ngắt kết nối.
   *
   * @param {Function} callback - callback(err, event) với event = { type, data }
   * @returns {Promise<{ stopListening: Function }>}
   */
  return async function listen(callback) {
    // Lấy danh sách channelIds trước khi kết nối WS
    let channelIds = [];
    try {
      const res = await httpClient.get('/users/@me/channels', {
        params: { search: '', before: '' },
      });
      const items =
        res.data?.data?.items ||
        res.data?.data ||
        res.data?.items ||
        res.data ||
        [];
      channelIds = Array.isArray(items)
        ? items.map((c) => c._id || c.id).filter(Boolean)
        : [];
      console.log(`[newchat.js] Sẽ subscribe ${channelIds.length} channels sau CONNECT ACK`);
    } catch (err) {
      console.warn('[newchat.js] Không lấy được channelIds, kết nối WS không có subscribe:', err.message);
    }

    wsClient.connect(token, channelIds);

    wsClient.emitter.on('message', (data) => {
      callback(null, { type: 'message', data });
    });

    wsClient.emitter.on('notification', (data) => {
      callback(null, { type: 'notification', data });
    });

    wsClient.emitter.on('typing', (data) => {
      callback(null, { type: 'typing', data });
    });

    wsClient.emitter.on('read', (data) => {
      callback(null, { type: 'read', data });
    });

    wsClient.emitter.on('event', (event) => {
      callback(null, event);
    });

    wsClient.emitter.on('error', (err) => {
      callback(err, null);
    });

    return {
      stopListening: () => wsClient.disconnect(),
    };
  };
};
