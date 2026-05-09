
// import EventEmitter from 'eventemitter3';
import { STORAGE_KEY_SETTINGS } from '../app.config';

// const ee = new EventEmitter();
let data;

const DEFAULT_SETTINGS = {
  autoScroll: false,
  autoPrint: true,
  cdns: [
    {
      url: 'https://esm.sh/',
      format: '{baseUrl}{id}?standalone{exports}',
      replacePattern: "(import\\s+.*?from\\s*['\"]|import\\s*\\(['\"]|export\\s+.*?from\\s*['\"])\\/(?!\\/)([^'\"]+['\"])",
      replaceWith: "$1https://esm.sh/$2"
    },
    {
      url: 'https://cdn.jsdelivr.net/npm/',
      format: '{baseUrl}{id}/+esm',
      replacePattern: "(import\\s+.*?from\\s*['\"]|import\\s*\\(['\"]|export\\s+.*?from\\s*['\"])\\/(?!\\/)([^'\"]+['\"])",
      replaceWith: "$1https://cdn.jsdelivr.net/$2"
    },
    {
      url: 'https://unpkg.com/',
      format: '{baseUrl}{id}?module',
      replacePattern: null,
      replaceWith: null
    }
  ]
};

const init = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) ?? '{}');
    data = { ...DEFAULT_SETTINGS, ...stored };
  } catch(e) {
    data = { ...DEFAULT_SETTINGS };
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
    data = { ...data, ...value };
    save();
  },
  // ee,
};

export default settingsService;

init();
