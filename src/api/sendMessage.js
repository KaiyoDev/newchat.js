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
   * Gửi tin nhắn văn bản đến channel qua REST API.
   * Endpoint: POST /channels/{channelId}/messages (multipart/form-data)
   *
   * @param {string} threadID - ID của channel/thread
   * @param {string} content  - Nội dung plain text (tự động wrap thành HTML)
   * @returns {Promise<Object>} response data từ server
   */
  return async function sendMessage(threadID, content) {
    if (!threadID) throw new Error('sendMessage: threadID là bắt buộc');
    if (!content)  throw new Error('sendMessage: content là bắt buộc');

    const form = new FormData();
    form.append('body', `<p>${content}</p>`);
    form.append('signId', uuidv4());

    try {
      const res = await httpClient.post(
        `/channels/${threadID}/messages`,
        form,
        { headers: form.getHeaders() }
      );
      return res.data;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error('Session expired, please re-login');
      }
      if (err.response?.status === 429) {
        const retryAfter = Number(err.response.headers['retry-after'] || 3);
        console.log(`[newchat.js] Rate limit, thử lại sau ${retryAfter}s...`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        return (module.exports(token, httpClient))(threadID, content);
      }
      console.error('[newchat.js ERROR] sendMessage thất bại:', err.message);
      throw err;
    }
  };
};
