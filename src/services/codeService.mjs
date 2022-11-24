
import {
  WELCOME_CODE,
  STORAGE_KEY_CODE,
} from '../app.config';
import EventEmitter from 'eventemitter3';
import { toBase64, fromBase64 } from '@gkucmierz/utils/src/base64';
import { APP_URL, SHARE_CODE_ROUTE_NAME } from '../app.config';

const ee = new EventEmitter();
let code;

const init = () => {
  const lsCode = localStorage.getItem(STORAGE_KEY_CODE);
  code = lsCode ? lsCode : WELCOME_CODE;
};

const codeService = {
  get() {
    return code;
  },
  change(_code) {
    code = _code;
    localStorage.setItem(STORAGE_KEY_CODE, code);
    ee.emit('change', code);
  },
  setFromUrl(_encoded) {
    this.change(fromBase64(_encoded));
  },
  codeToUrl(_code = code) {
    return [APP_URL, SHARE_CODE_ROUTE_NAME, toBase64(_code)].join('/');
  },
  ee,
};

export default codeService;

init();
