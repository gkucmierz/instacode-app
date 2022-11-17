import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import packageJson from './package.json' assert { type: 'json' };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      devOptions: {
        enabled: true
        /* other options */
      },

      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },

      manifest: {
        name: packageJson.name,
        short_name: packageJson.name,
        description: packageJson.description,
        theme_color: '#7ACED7',
        background_color: '#282C34',
        id: '/',
        shortcuts : [
          {
            name: 'Scratchpad',
            url: '/',
            description: 'Main view of app',
            icons: [
              { src: '/img/shortcut-icons/instacode.svg', sizes: '150x150', type: 'image/svg+xml' }
            ],
          },
          {
            name: 'Settings',
            url: '/settings',
            description: 'Settings view',
            icons: [
              { src: '/img/shortcut-icons/settings.svg', sizes: '150x150', type: 'image/svg+xml' }
            ],
          },
        ],
        icons: [
          {
            'src': './img/icons/android-chrome-192x192.png',
            'sizes': '192x192',
            'type': 'image/png'
          },
          {
            'src': './img/icons/android-chrome-maskable-512x512.png',
            'sizes': '512x512',
            'type': 'image/png'
          },
          {
            'src': './img/icons/android-chrome-maskable-192x192.png',
            'sizes': '192x192',
            'type': 'image/png',
            'purpose': 'maskable'
          },
          {
            'src': './img/icons/android-chrome-maskable-512x512.png',
            'sizes': '512x512',
            'type': 'image/png',
            'purpose': 'maskable'
          },
          {
            'src': './img/icons/apple-touch-icon-60x60.png',
            'sizes': '60x60',
            'type': 'image/png'
          },
          {
            'src': './img/icons/apple-touch-icon-76x76.png',
            'sizes': '76x76',
            'type': 'image/png'
          },
          {
            'src': './img/icons/apple-touch-icon-120x120.png',
            'sizes': '120x120',
            'type': 'image/png'
          },
          {
            'src': './img/icons/apple-touch-icon-152x152.png',
            'sizes': '152x152',
            'type': 'image/png'
          },
          {
            'src': './img/icons/apple-touch-icon-180x180.png',
            'sizes': '180x180',
            'type': 'image/png'
          },
          {
            'src': './img/icons/apple-touch-icon.png',
            'sizes': '180x180',
            'type': 'image/png'
          },
          {
            'src': './img/icons/favicon-16x16.png',
            'sizes': '16x16',
            'type': 'image/png'
          },
          {
            'src': './img/icons/favicon-32x32.png',
            'sizes': '32x32',
            'type': 'image/png'
          },
          {
            'src': './img/icons/msapplication-icon-144x144.png',
            'sizes': '144x144',
            'type': 'image/png'
          },
          {
            'src': './img/icons/mstile-150x150.png',
            'sizes': '150x150',
            'type': 'image/png'
          }
        ],
      }
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // base: '/instacode-app/',
})
