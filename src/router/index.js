import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import SettingsView from '../views/SettingsView.vue';
import settingsService from '../services/settingsService.mjs';

import codeService from '../services/codeService';
import { SHARE_CODE_ROUTE_NAME } from '../app.config';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: `/${SHARE_CODE_ROUTE_NAME}/:encoded`,
      name: SHARE_CODE_ROUTE_NAME,
      beforeEnter: (to, from, next) => {
        codeService.setFromUrl(to.params.encoded);
        next({ name: 'home' });
      },
    },
    {
      path: '/gist/:user/:id',
      name: 'gist-with-user',
      beforeEnter: (to, from, next) => {
        next({ name: 'gist', params: { id: to.params.id } });
      }
    },
    {
      path: '/gist/:id',
      name: 'gist',
      beforeEnter: async (to, from, next) => {
        try {
          const headers = {};
          const token = settingsService.getItem('githubToken');
          if (token) {
            headers['Authorization'] = `token ${token}`;
          }

          const targetUrl = `https://api.github.com/gists/${to.params.id}?t=${Date.now()}`;
          let res;
          
          try {
            res = await fetch(targetUrl, { headers });
          } catch (fetchErr) {
            console.warn('[Router] Direct fetch failed, falling back to proxy...', fetchErr);
            const proxyUrl = `https://cors-proxy.7u.pl/?url=${encodeURIComponent(targetUrl)}`;
            res = await fetch(proxyUrl, { headers });
          }
          
          if (res.ok) {
            const data = await res.json();
            const files = Object.values(data.files || {});
            const jsFile = files.find(f => f.language === 'JavaScript' || f.filename.endsWith('.js')) || files[0];
            if (jsFile && jsFile.content) {
              codeService.newTab(jsFile.content, jsFile.filename);
            }
          } else {
            const errorMsg = `// ERROR: Failed to load Gist (${res.status})\n// Make sure you haven't exceeded GitHub's rate limit.`;
            codeService.newTab(errorMsg, 'Error');
          }
        } catch (e) {
          console.error('[Router] Failed to load gist:', e);
          codeService.newTab(`// ERROR: Failed to load Gist.\n// Reason: ${e.message}`, 'Error');
        }
        next({ name: 'home' });
      }
    },
    {
      path: '/run/gist/:user/:id',
      redirect: to => {
        return { name: 'gist', params: { id: to.params.id } }
      }
    },
    {
      path: '/run/gist/:id',
      redirect: to => {
        return { name: 'gist', params: { id: to.params.id } }
      }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

export default router
