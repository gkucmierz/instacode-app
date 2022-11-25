import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import SettingsView from '../views/SettingsView.vue';
import AboutView from '../views/AboutView.vue';

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
      redirect: to => {
        codeService.setFromUrl(to.params.encoded);
        return { name: 'home' };
      },
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    }
  ]
})

export default router
