
import EventEmitter from 'eventemitter3';
import { STORAGE_KEY_SETTINGS } from '../app.config';

// const ee = new EventEmitter();
let data;

const init = () => {
  try {
    data = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) ?? '{}');
  } catch(e) {
    data = {};
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
    data = value;
    save();
  },
  // ee,
};

export default settingsService;

init();
