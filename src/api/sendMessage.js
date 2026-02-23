// newchat.js — sendMessage.js

'use strict';

const { randomUUID } = require('crypto');

/**
 * Factory function trả về hàm sendMessage.
 * @param {string} token - Bearer token
 * @param {import('axios').AxiosInstance} httpClient - Axios instance dùng chung
 * @returns {Function}
 */
module.exports = function (token, httpClient) {
  /**
   * Gửi tin nhắn đến một channel.
   * Endpoint: POST /channels/{channelId}/messages
   * Body: multipart/form-data — { body: "<p>...</p>", signId: UUID }
   *
   * @param {string} channelId - ID của channel (lấy từ getThreadList)
   * @param {string} message - Nội dung tin nhắn (plain text, tự động wrap thành HTML)
   * @returns {Promise<Object>} Response data từ server
   */
  return async function sendMessage(channelId, message) {
    if (!channelId) throw new Error('sendMessage: channelId là bắt buộc');
    if (!message) throw new Error('sendMessage: message là bắt buộc');

    const signId = randomUUID();
    const htmlBody = `<p>${message}</p>`;

    // Dùng FormData built-in (Node 18+) để tạo multipart/form-data
    const form = new FormData();
    form.append('body', htmlBody);
    form.append('signId', signId);

    try {
      const response = await httpClient.post(
        `/channels/${channelId}/messages`,
        form,
        {
          // Bỏ content-type mặc định của instance để axios tự set boundary đúng
          headers: { 'content-type': undefined },
        }
      );
      return response.data?.data || response.data;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error('Session expired, please re-login');
      }
      if (err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'] || 3;
        console.log(`[newchat.js] Rate limit, thử lại sau ${retryAfter}s...`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        return sendMessage(channelId, message);
      }
      console.error('[newchat.js ERROR] sendMessage thất bại:', err.message);
      throw err;
    }
  };
};
