// newchat.js — index.js

'use strict';

const { httpClient, setToken } = require('./httpUtils');

/**
 * Decode JWT payload mà không cần verify signature.
 * Dùng để lấy userId từ token sau khi login.
 * @param {string} token
 * @returns {{ id?: string, email?: string } | null}
 */
function _decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Build api object từ token đã có (dùng chung cho login và loadAppState).
 * @param {string} token
 * @param {string} [userId] - User ID decode từ JWT (dùng để filter self messages)
 * @returns {Object} api
 */
function _buildApi(token, userId) {
  const sendMessage      = require('./api/sendMessage')(token, httpClient);
  const listen           = require('./api/listen')(token, httpClient, userId);
  const getThreadList    = require('./api/getThreadList')(token, httpClient);
  const getUserInfo      = require('./api/getUserInfo')(token, httpClient);
  const getThreadHistory = require('./api/getThreadHistory')(token, httpClient);
  const markAsRead       = require('./api/markAsRead')(token, httpClient);
  const sendAttachment   = require('./api/sendAttachment')(token, httpClient);
  const getMyProfile     = getUserInfo; // alias — lấy profile của tài khoản đang đăng nhập

  /**
   * Trả về trạng thái session để lưu lại (tương tự AppState của fca-unofficial).
   * @returns {{ token: string }}
   */
  function getAppState() {
    return { token };
  }

  return {
    sendMessage,
    sendAttachment,
    listen,
    getThreadList,
    getThreadHistory,
    getUserInfo,
    getMyProfile,
    markAsRead,
    getAppState,
  };
}

/**
 * Đăng nhập vào newchat.vn và trả về object api.
 * @param {string} email - Email tài khoản
 * @param {string} password - Mật khẩu tài khoản
 * @returns {Promise<Object>} api object
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

  const userId = _decodeJwt(token)?.id || null;
  if (userId) console.log('[newchat.js] Bot userId:', userId);
  return _buildApi(token, userId);
}

/**
 * Khôi phục session từ AppState đã lưu — bỏ qua bước login, tiết kiệm 1 request.
 * Dùng để restart bot mà không cần đăng nhập lại.
 *
 * @param {{ token: string }} appState - Object trả về từ getAppState()
 * @returns {Object} api object (giống login)
 * @example
 *   const { token } = JSON.parse(fs.readFileSync('appstate.json'));
 *   const api = await loadAppState({ token });
 */
async function loadAppState({ token } = {}) {
  if (!token) throw new Error('loadAppState: token là bắt buộc');

  setToken(token);
  console.log('[newchat.js] AppState đã load, bỏ qua login');

  const userId = _decodeJwt(token)?.id || null;
  if (userId) console.log('[newchat.js] Bot userId:', userId);
  return _buildApi(token, userId);
}

// Default export: login (tương thích fca-unofficial pattern)
// Named exports: hỗ trợ cả destructuring
module.exports = login;
module.exports.login = login;
module.exports.loadAppState = loadAppState;
