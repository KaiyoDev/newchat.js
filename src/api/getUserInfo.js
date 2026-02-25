// newchat.js — getUserInfo.js

'use strict';

/**
 * Factory function trả về hàm getUserInfo.
 * @param {string} token - Bearer token
 * @param {import('axios').AxiosInstance} httpClient - Axios instance dùng chung
 * @returns {Function}
 */
module.exports = function (token, httpClient) {
  /**
   * Lấy thông tin người dùng.
   * - Nếu truyền `userId` → gọi GET /users/{userId}
   * - Nếu không truyền → gọi GET /auth/me (user đang đăng nhập)
   *
   * @param {string} [userId] - ID người dùng cần lấy (optional)
   * @returns {Promise<Object>}
   */
  return async function getUserInfo(userId) {
    try {
      const url = userId ? `/users/${userId}` : '/auth/me';
      const response = await httpClient.get(url);
      return response.data?.data || response.data;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error('Session expired, please re-login');
      }
      console.error('[newchat.js ERROR] getUserInfo thất bại:', err.message);
      throw err;
    }
  };
};
