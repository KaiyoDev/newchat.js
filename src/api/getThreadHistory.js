// newchat.js — getThreadHistory.js

'use strict';

/**
 * Factory function trả về hàm getThreadHistory.
 * @param {string} token - Bearer token
 * @param {import('axios').AxiosInstance} httpClient - Axios instance dùng chung
 * @returns {Function}
 */
module.exports = function (token, httpClient) {
  /**
   * Lấy lịch sử tin nhắn của một channel (cursor-based pagination).
   * Endpoint: GET /channels/{channelId}/messages?limit=&before=
   *
   * Response: {
   *   items: Message[],
   *   nextCursor: string | null,    // ID dùng để load trang cũ hơn
   *   previousCursor: string | null // ID dùng để load trang mới hơn
   * }
   *
   * @param {string} channelId - ID của channel/thread
   * @param {Object} [options]
   * @param {number} [options.limit=20] - Số tin nhắn mỗi lần lấy
   * @param {string} [options.before] - Cursor: lấy tin nhắn trước messageID này
   * @param {string} [options.after]  - Cursor: lấy tin nhắn sau messageID này
   * @returns {Promise<{ items: Array, nextCursor: string|null, previousCursor: string|null }>}
   */
  return async function getThreadHistory(channelId, { limit = 20, before, after } = {}) {
    if (!channelId) throw new Error('getThreadHistory: channelId là bắt buộc');

    const params = { limit };
    if (before) params.before = before;
    if (after)  params.after  = after;

    try {
      const response = await httpClient.get(`/channels/${channelId}/messages`, { params });
      const data = response.data?.data;
      return {
        items: data?.items || [],
        nextCursor: data?.nextCursor || null,
        previousCursor: data?.previousCursor || null,
      };
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error('Session expired, please re-login');
      }
      console.error('[newchat.js ERROR] getThreadHistory thất bại:', err.message);
      throw err;
    }
  };
};
