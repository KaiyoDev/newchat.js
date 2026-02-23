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
   * Gọi stopListening() để ngắt kết nối.
   *
   * @param {Function} callback - callback(err, event) với event = { type, data }
   * @returns {{ stopListening: Function }}
   */
  return function listen(callback) {
    wsClient.connect(token);

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
