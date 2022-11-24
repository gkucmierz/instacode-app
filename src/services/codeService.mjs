
import {
  WELCOME_CODE,
  STORAGE_KEY_CODE,
} from '../app.config';
import EventEmitter from 'eventemitter3';

const ee = new EventEmitter();
let code;

const init = () => {
  const lsCode = localStorage.getItem(STORAGE_KEY_CODE);
  console.log('code', lsCode);
  code = lsCode ? lsCode : WELCOME_CODE;
};

const codeService = {
  get() {
    return code;
  },
  change(_code) {
    code = _code;
    console.log('save', _code)
    localStorage.setItem(STORAGE_KEY_CODE, code);
    ee.emit('change', code);
  },
  setFromUrl(_encoded) {
    this.change(atob(_encoded));
  },
  ee,
};

export default codeService;

init();
