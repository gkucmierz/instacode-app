import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import './assets/main.scss';

import PrimeVue from 'primevue/config';

const app = createApp(App);

app.use(router);
app.use(PrimeVue);

app.mount('#app');
