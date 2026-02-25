// newchat.js — getThreadList.js

'use strict';

/**
 * Factory function trả về hàm getThreadList.
 * @param {string} token - Bearer token
 * @param {import('axios').AxiosInstance} httpClient - Axios instance dùng chung
 * @returns {Function}
 */
module.exports = function (token, httpClient) {
  /**
   * Lấy danh sách các thread (cuộc trò chuyện) của người dùng.
   * @param {number} [limit=20] - Số thread mỗi lần lấy
   * @returns {Promise<Array>}
   */
  return async function getThreadList(limit = 20) {
    try {
      const response = await httpClient.get('/users/@me/channels', {
        params: { search: '', before: '', limit },
      });
      return response.data?.data?.items
        || response.data?.data
        || response.data?.items
        || response.data;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error('Session expired, please re-login');
      }
      console.error('[newchat.js ERROR] getThreadList thất bại:', err.message);
      throw err;
    }
  };
};
