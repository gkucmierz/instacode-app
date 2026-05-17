import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import SettingsView from '../views/SettingsView.vue';


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
          const res = await fetch(`https://api.github.com/gists/${to.params.id}`);
          if (res.ok) {
            const data = await res.json();
            const files = Object.values(data.files || {});
            const jsFile = files.find(f => f.language === 'JavaScript' || f.filename.endsWith('.js')) || files[0];
            if (jsFile && jsFile.content) {
              codeService.newTab(jsFile.content, jsFile.filename);
            }
          }
        } catch (e) {
          console.error('[Router] Failed to load gist:', e);
        }
        next({ name: 'home' });
      }
    }
  ]
})

export default router
