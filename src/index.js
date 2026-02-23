// newchat.js — index.js

'use strict';

const { httpClient, setToken } = require('./httpUtils');

/**
 * Đăng nhập vào newchat.vn và trả về object api.
 * @param {string} email - Email tài khoản
 * @param {string} password - Mật khẩu tài khoản
 * @returns {Promise<Object>} api object gồm: sendMessage, listen, getThreadList, getUserInfo, getAppState
 */
async function login(email, password) {
  let token;

  try {
    console.log('[newchat.js] Đang đăng nhập...');
    const response = await httpClient.post('/auth/login', { email, password });
    token = response.data?.data?.accessToken;

    if (!token) {
      throw new Error('Không tìm thấy token trong response từ server');
    }

    setToken(token);
    console.log('[newchat.js] Đăng nhập thành công');
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      throw new Error('Session expired, please re-login');
    }
    console.error('[newchat.js ERROR] Đăng nhập thất bại:', err.message);
    throw err;
  }

  const sendMessage = require('./api/sendMessage')(token, httpClient);
  const listen = require('./api/listen')(token, httpClient);
  const getThreadList = require('./api/getThreadList')(token, httpClient);
  const getUserInfo = require('./api/getUserInfo')(token, httpClient);

  /**
   * Trả về trạng thái session hiện tại để lưu lại (tương tự AppState của fca-unofficial).
   * @returns {{ token: string }}
   */
  function getAppState() {
    return { token };
  }

  return {
    sendMessage,
    listen,
    getThreadList,
    getUserInfo,
    getAppState,
  };
}

module.exports = login;
