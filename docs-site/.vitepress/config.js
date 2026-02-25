import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/newchat.js/',
  title: 'newchat.js',
  description: 'Unofficial NewChat API for Node.js',
  lang: 'vi',

  appearance: 'dark',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#e11d48' }],
  ],

  themeConfig: {
    logo: '/logo.png',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/login' },
      {
        text: 'v1.0.5',
        items: [
          { text: 'Changelog', link: 'https://github.com/KaiyoDev/newchat.js/releases' },
          { text: 'npm', link: 'https://www.npmjs.com/package/newchat.js' },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Installation', link: '/guide/installation' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'login()', link: '/api/login' },
          { text: 'listen()', link: '/api/listen' },
          { text: 'sendMessage()', link: '/api/send-message' },
          { text: 'sendAttachment()', link: '/api/send-attachment' },
          { text: 'markAsRead()', link: '/api/mark-as-read' },
          { text: 'getThreadList()', link: '/api/get-thread-list' },
          { text: 'getThreadHistory()', link: '/api/get-thread-history' },
          { text: 'getUserInfo()', link: '/api/get-user-info' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/KaiyoDev/newchat.js' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/newchat.js' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 KaiyoDev · Unofficial — not affiliated with newchat.vn',
    },

    editLink: {
      pattern: 'https://github.com/KaiyoDev/newchat.js/edit/main/docs-site/:path',
      text: 'Edit this page on GitHub',
    },

    search: {
      provider: 'local',
    },
  },
})
