// newchat.js — sendAttachment.js

'use strict';

const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Factory function trả về hàm sendAttachment.
 * @param {string} token - Bearer token
 * @param {import('axios').AxiosInstance} httpClient - Axios instance dùng chung
 * @returns {Function}
 */
module.exports = function (token, httpClient) {
  /**
   * Gửi file/ảnh đính kèm đến channel.
   * TODO: capture upload endpoint từ F12 Network tab (khi gửi ảnh trên newchat.vn)
   *       Cần biết: upload URL, form-data field names, response attachment URL format
   *
   * @param {string} channelId - ID của channel/thread
   * @param {string} filePath - Đường dẫn file local
   * @param {Object} [options]
   * @param {'image'|'file'} [options.type='file'] - Loại attachment
   * @param {string} [options.caption] - Caption cho ảnh/file
   * @returns {Promise<Object>}
   */
  return async function sendAttachment(channelId, filePath, { type = 'file', caption } = {}) {
    if (!channelId) throw new Error('sendAttachment: channelId là bắt buộc');
    if (!filePath)  throw new Error('sendAttachment: filePath là bắt buộc');

    if (!fs.existsSync(filePath)) {
      throw new Error(`sendAttachment: File không tồn tại: ${filePath}`);
    }

    // TODO: implement sau khi capture upload endpoint từ F12
    // Step 1: Upload file → lấy attachment URL
    // const form = new FormData();
    // form.append('file', fs.createReadStream(filePath));
    // const uploadRes = await httpClient.post('/UPLOAD_ENDPOINT_TODO', form, {
    //   headers: { 'content-type': undefined },
    // });
    // const attachmentUrl = uploadRes.data?.data?.url;

    // Step 2: Gửi message với attachment
    // const signId = randomUUID();
    // const msgForm = new FormData();
    // msgForm.append('signId', signId);
    // msgForm.append('attachments', JSON.stringify([{ url: attachmentUrl, type }]));
    // if (caption) msgForm.append('body', `<p>${caption}</p>`);
    // return httpClient.post(`/channels/${channelId}/messages`, msgForm, {
    //   headers: { 'content-type': undefined },
    // });

    throw new Error(
      'sendAttachment chưa được implement — cần capture upload endpoint từ F12.\n' +
      'Mở newchat.vn → gửi ảnh → F12 Network → copy Request URL + payload'
    );
  };
};
