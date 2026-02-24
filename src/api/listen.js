// newchat.js — listen.js

'use strict';

const wsClient = require('../wsClient');

/**
 * Factory function trả về hàm listen.
 * @param {string} token - Bearer token
 * @param {import('axios').AxiosInstance} httpClient - Axios instance dùng chung
 * @returns {Function}
 */
module.exports = function (token, httpClient, userId) {
  /**
   * Lắng nghe sự kiện realtime từ Socket.IO server qua WebSocket.
   * Tin nhắn của chính bot (isSelf) được tự động lọc bỏ trong wsClient.
   * Gọi stopListening() để ngắt kết nối.
   *
   * @param {Function} callback - callback(err, event) với event = { type, data }
   * @returns {Promise<{ stopListening: Function }>}
   */
  return async function listen(callback) {
    wsClient.connect(token, userId);

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
