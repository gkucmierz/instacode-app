import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import './assets/main.scss';

import PrimeVue from 'primevue/config';
import PrimeVueRipple from 'primevue/ripple';

import 'nano-ui/style.css';
import NanoUI, { Ripple as NanoUIRipple } from 'nano-ui';

// Monkey-patch PrimeVue's internal Ripple directive to use NanoUI's implementation.
// This is required because PrimeVue components register their Ripple directive locally,
// bypassing global directives. This guarantees the 'multiple circles' effect everywhere.
if (PrimeVueRipple && NanoUIRipple) {
  PrimeVueRipple.mounted = NanoUIRipple.mounted;
}

// Global scroll listener to dynamically show scrollbars only when actively scrolling
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', (e) => {
    const el = e.target;
    if (el && el.classList && typeof el.classList.add === 'function') {
      el.classList.add('is-scrolling');
      if (el._scrollTimeout) {
        clearTimeout(el._scrollTimeout);
      }
      el._scrollTimeout = setTimeout(() => {
        el.classList.remove('is-scrolling');
        delete el._scrollTimeout;
      }, 1000);
    }
  }, { capture: true, passive: true });
}

const app = createApp(App);

app.use(router);
app.use(PrimeVue);
app.use(NanoUI);

app.mount('#app');
