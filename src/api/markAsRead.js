// newchat.js — markAsRead.js

'use strict';

const wsClient = require('../wsClient');

/**
 * Factory function trả về hàm markAsRead.
 * @param {string} token - Bearer token
 * @param {import('axios').AxiosInstance} httpClient - Axios instance dùng chung
 * @returns {Function}
 */
module.exports = function (token, httpClient) {
  /**
   * Đánh dấu đã đọc tin nhắn trong channel qua WebSocket.
   * REST endpoints trả 404 nên dùng WS emit.
   * TODO: verify tên event chính xác từ F12 Network → WS Messages tab
   *       (khi click vào một conversation, ghi lại event name + payload server nhận)
   *
   * @param {string} channelId - ID của channel/thread
   * @param {string} [lastMessageId] - ID của tin nhắn cuối đã đọc
   */
  return function markAsRead(channelId, lastMessageId) {
    if (!channelId) throw new Error('markAsRead: channelId là bắt buộc');

    const payload = { channelId };
    if (lastMessageId) payload.lastMessageId = lastMessageId;

    try {
      // TODO: verify event name ("read" | "mark_read" | "messages_read") từ F12
      wsClient.emitEvent('read', payload);
      console.log('[newchat.js] markAsRead:', channelId);
    } catch (err) {
      console.error('[newchat.js ERROR] markAsRead thất bại:', err.message);
      throw err;
    }
  };
};
