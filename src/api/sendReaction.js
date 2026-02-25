'use strict';

/**
 * Factory function trả về hàm sendReaction.
 * @param {string} token - Bearer token
 * @param {import('axios').AxiosInstance} httpClient - Axios instance dùng chung
 * @returns {Function}
 */
module.exports = function (token, httpClient) {
  /**
   * Gửi reaction (emoji) tới một tin nhắn.
   * Endpoint: POST /channels/{threadID}/messages/{messageID}/reactions
   * Content-Type: application/json
   *
   * Body: { "emoji": "👍" }
   *
   * @param {string} threadID  - ID của channel/thread
   * @param {string} messageID - ID tin nhắn cần react
   * @param {string} emoji     - Emoji reaction (ví dụ: "👍", "❤️")
   * @returns {Promise<Object|true>} response từ server (nếu có)
   */
  return async function sendReaction(threadID, messageID, emoji) {
    if (!threadID)  throw new Error('sendReaction: threadID là bắt buộc');
    if (!messageID) throw new Error('sendReaction: messageID là bắt buộc');
    if (!emoji)     throw new Error('sendReaction: emoji là bắt buộc');

    try {
      const res = await httpClient.post(
        `/channels/${threadID}/messages/${messageID}/reactions`,
        { emoji }
      );
      return res.data ?? true;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error('Session expired, please re-login');
      }
      console.error('[newchat.js ERROR] sendReaction thất bại:', err.message);
      throw err;
    }
  };
};

