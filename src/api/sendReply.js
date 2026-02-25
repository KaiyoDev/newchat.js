'use strict';

const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

/**
 * Factory function trả về hàm sendReply.
 * @param {string} token - Bearer token
 * @param {import('axios').AxiosInstance} httpClient - Axios instance dùng chung
 * @returns {Function}
 */
module.exports = function (token, httpClient) {
  /**
   * Gửi reply tới một tin nhắn cụ thể trong channel qua REST API.
   * Endpoint: POST /channels/{threadID}/messages (multipart/form-data)
   *
   * Form fields:
   * - body:   `<p>{content}</p>`
   * - signId: UUID v4
   * - replyTo: messageID (field name chính xác: "replyTo")
   *
   * @param {string} threadID   - ID của channel/thread
   * @param {string} messageID  - ID tin nhắn cần reply
   * @param {string} content    - Nội dung plain text (tự wrap HTML)
   * @returns {Promise<Object>} response data từ server
   */
  return async function sendReply(threadID, messageID, content) {
    if (!threadID)  throw new Error('sendReply: threadID là bắt buộc');
    if (!messageID) throw new Error('sendReply: messageID là bắt buộc');
    if (!content)   throw new Error('sendReply: content là bắt buộc');

    const form = new FormData();
    form.append('body', `<p>${content}</p>`);
    form.append('signId', uuidv4());
    form.append('replyTo', messageID);

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
        console.log(`[newchat.js] Rate limit (sendReply), thử lại sau ${retryAfter}s...`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        return (module.exports(token, httpClient))(threadID, messageID, content);
      }
      console.error('[newchat.js ERROR] sendReply thất bại:', err.message);
      throw err;
    }
  };
};

