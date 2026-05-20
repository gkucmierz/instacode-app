import { reactive } from 'vue';
import { STORAGE_KEY_SETTINGS } from '../app.config';

const data = reactive({});

const DEFAULT_SETTINGS = {
  uiDensity: 'compact',
  autoScroll: false,
  autoPrint: true,
  cdns: [
    {
      url: 'https://cdn.jsdelivr.net/npm/',
      format: '{baseUrl}{id}/+esm',
      replacePattern: "(import\\s+.*?from\\s*['\"]|import\\s*\\(['\"]|export\\s+.*?from\\s*['\"])\\/(?!\\/)([^'\"]+['\"])",
      replaceWith: "$1https://cdn.jsdelivr.net/$2"
    },
    {
      url: 'https://esm.sh/',
      format: '{baseUrl}{id}?bundle{exports}',
      replacePattern: "(import\\s+.*?from\\s*['\"]|import\\s*\\(['\"]|export\\s+.*?from\\s*['\"])\\/(?!\\/)([^'\"]+['\"])",
      replaceWith: "$1https://esm.sh/$2"
    },
    {
      url: 'https://unpkg.com/',
      format: '{baseUrl}{id}?module',
      replacePattern: null,
      replaceWith: null
    }
  ],
  githubToken: '',
  gistPublic: false,
  gistAppendLink: false
};

const init = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) ?? '{}');
    Object.assign(data, DEFAULT_SETTINGS, stored);
  } catch(e) {
    Object.assign(data, DEFAULT_SETTINGS);
  }
};

const save = () => {
  const str = JSON.stringify(data);
  localStorage.setItem(STORAGE_KEY_SETTINGS, str);
};

const settingsService = {
  getItem(item) {
    return data[item];
  },
  setItem(item, value) {
    data[item] = value;
    save();
  },
  get() {
    return data;
  },
  set(value) {
    Object.assign(data, JSON.parse(JSON.stringify(value)));
    save();
  }
};

init();

export default settingsService;
