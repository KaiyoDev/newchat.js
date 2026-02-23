// newchat.js — sendAttachment.js

'use strict';

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

/**
 * Factory function trả về hàm sendAttachment.
 * @param {string} token - Bearer token
 * @param {import('axios').AxiosInstance} httpClient - Axios instance dùng chung
 * @returns {Function}
 */
module.exports = function (token, httpClient) {
  /**
   * Gửi file/ảnh đính kèm đến channel.
   * Endpoint: POST /channels/{channelId}/messages (multipart/form-data)
   * Field "attachments" chứa file binary stream.
   *
   * @param {string} channelId - ID của channel/thread
   * @param {string} filePath - Đường dẫn tuyệt đối hoặc tương đối đến file
   * @param {string} [caption=''] - Caption hiển thị cùng file (plain text)
   * @returns {Promise<Object>} response data từ server
   */
  return async function sendAttachment(channelId, filePath, caption = '') {
    if (!channelId) throw new Error('sendAttachment: channelId là bắt buộc');
    if (!filePath)  throw new Error('sendAttachment: filePath là bắt buộc');

    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`sendAttachment: File không tồn tại: ${absPath}`);
    }

    const fileName = path.basename(absPath);
    const form = new FormData();

    form.append('body', caption ? `<p>${caption}</p>` : '');
    form.append('signId', uuidv4());
    form.append('attachments', fs.createReadStream(absPath), {
      filename: fileName,
      contentType: _getMimeType(fileName),
    });

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
        return (module.exports(token, httpClient))(channelId, filePath, caption);
      }
      console.error('[newchat.js ERROR] sendAttachment thất bại:', err.message);
      throw err;
    }
  };
};

/**
 * Lấy MIME type từ extension file.
 * @param {string} fileName
 * @returns {string}
 */
function _getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png',  '.gif': 'image/gif',
    '.webp': 'image/webp', '.mp4': 'video/mp4',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  };
  return map[ext] || 'application/octet-stream';
}
