// newchat.js — markAsRead.js

'use strict';

/**
 * Factory function trả về hàm markAsRead.
 * @param {string} token - Bearer token
 * @param {import('axios').AxiosInstance} httpClient - Axios instance dùng chung
 * @returns {Function}
 */
module.exports = function (token, httpClient) {
  /**
   * Đánh dấu đã đọc toàn bộ tin nhắn trong channel.
   * Endpoint: HEAD /channels/{channelId}/seen
   *
   * @param {string} channelId - ID của channel/thread
   * @returns {Promise<true>}
   */
  return async function markAsRead(channelId) {
    if (!channelId) throw new Error('markAsRead: channelId là bắt buộc');

    try {
      const response = await httpClient.head(`/channels/${channelId}/seen`);

      if (response.status === 200) {
        return true;
      }

      throw new Error(`markAsRead: status không mong đợi ${response.status}`);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error('Session expired, please re-login');
      }
      console.error('[newchat.js ERROR] markAsRead thất bại:', err.message);
      throw err;
    }
  };
};
