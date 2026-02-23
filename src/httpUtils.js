// newchat.js — httpUtils.js

'use strict';

const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();

const httpClient = wrapper(
  axios.create({
    baseURL: 'https://api.newchat.vn',
    jar,
    withCredentials: true,
    headers: {
      'accept': 'application/json',
      'accept-language': 'vi',
      'x-accept-language': 'vi',
      'x-user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
      'Referer': 'https://newchat.vn/',
      'content-type': 'application/json',
    },
  })
);

/**
 * Inject Authorization header vào axios instance sau khi login thành công.
 * @param {string} token - Bearer token từ response login
 */
function setToken(token) {
  if (!token) {
    console.error('[newchat.js ERROR] setToken: token không hợp lệ');
    return;
  }
  httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  console.log('[newchat.js] Token đã được inject vào Authorization header');
}

module.exports = { httpClient, setToken };
