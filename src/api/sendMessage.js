// newchat.js — sendMessage.js

'use strict';

const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

/**
 * Factory function trả về hàm sendMessage.
 * @param {string} token - Bearer token
 * @param {import('axios').AxiosInstance} httpClient - Axios instance dùng chung
 * @returns {Function}
 */
module.exports = function (token, httpClient) {
  /**
   * Gửi tin nhắn văn bản đến channel.
   * Endpoint: POST /channels/{channelId}/messages (multipart/form-data)
   *
   * @param {string} channelId - ID của channel/thread
   * @param {string} content - Nội dung plain text (tự động wrap thành HTML)
   * @returns {Promise<Object>} response data từ server
   */
  return async function sendMessage(channelId, content) {
    if (!channelId) throw new Error('sendMessage: channelId là bắt buộc');
    if (!content)   throw new Error('sendMessage: content là bắt buộc');

    const form = new FormData();
    form.append('body', `<p>${content}</p>`);
    form.append('signId', uuidv4());

    try {
      const response = await httpClient.post(
        `/channels/${channelId}/messages`,
        form,
        { headers: form.getHeaders() }
      );
      return response.data?.data || response.data;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error('Session expired, please re-login');
      }
      if (err.response?.status === 429) {
        const retryAfter = Number(err.response.headers['retry-after'] || 3);
        console.log(`[newchat.js] Rate limit, thử lại sau ${retryAfter}s...`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        return (module.exports(token, httpClient))(channelId, content);
      }
      console.error('[newchat.js ERROR] sendMessage thất bại:', err.message);
      throw err;
    }
  };
};
