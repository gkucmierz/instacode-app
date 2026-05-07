
import {
  WELCOME_CODE,
  STORAGE_KEY_CODE,
} from '../app.config';
import EventEmitter from 'eventemitter3';
import { APP_URL, SHARE_CODE_ROUTE_NAME } from '../app.config';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

const ee = new EventEmitter();
let code;
let suggestions = [];

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
  getSuggestions() {
    return suggestions;
  },
  addSuggestion(suggestion) {
    const existing = suggestions.findIndex(s => s.line === suggestion.line && s.name === suggestion.name);
    if (existing >= 0) {
      suggestions[existing] = suggestion;
    } else {
      suggestions.push(suggestion);
    }
    ee.emit('suggestions-changed');
  },
  removeSuggestion(suggestion) {
    suggestions = suggestions.filter(s => s !== suggestion);
    ee.emit('suggestions-changed');
  },
  clearSuggestions() {
    if (suggestions.length > 0) {
      suggestions = [];
      ee.emit('suggestions-changed');
    }
  },
  setFromUrl(_encoded) {
    this.change(decompressFromEncodedURIComponent(_encoded));
  },
  codeToUrl(_code = code) {
    return [APP_URL, SHARE_CODE_ROUTE_NAME, compressToEncodedURIComponent(_code)].join('/');
  },
  ee,
};

export default codeService;

init();
