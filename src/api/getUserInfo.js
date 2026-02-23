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
   * Lấy thông tin người dùng hiện tại đang đăng nhập.
   * @returns {Promise<Object>}
   */
  return async function getUserInfo() {
    try {
      const response = await httpClient.get('/auth/me');
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
