
import { stringify } from 'javascript-stringify';
import { MAX_DATA_SIZE } from './app.config';
import { getType } from '@gkucmierz/utils/src/get-type';

const log = console.log;
console.log = (...a) => l(a);
console.error = a => e(a);

// limit chunk of data sent to browser, to avoid eventloop blocking
const limitData = data => {
  if (data.length > MAX_DATA_SIZE) {
    return data.substr(0, MAX_DATA_SIZE);
  }
  return data;
};

const throttledPM = (() => {
  const pm = postMessage;
  self['postMessage'] = log;
  const updateFreq = 50; // times per sec
  const updateDelay = 1e3 / updateFreq;
  let dataCache = [];
  let lastUpdate = +new Date() - updateDelay;

  return (data, finish = false, tryAgain = true) => {
    const now = +new Date();
    if (typeof data !== 'undefined') {
      dataCache.push(data);
    }

    if (lastUpdate + updateDelay <= now || finish) {
      pm(limitData(dataCache.join('\n')));
      lastUpdate = now;
      dataCache = [];
    }

    if (tryAgain) {
      const nextTick = fn => setTimeout(fn, 0);
      const tryAgainFn = _ => throttledPM([][0], false, false);
      // try push data asap
      setTimeout(tryAgainFn, 0);
      // try push possibly cached data for async code
      setTimeout(tryAgainFn, updateDelay);
    }
  };
})();

const l = args => {
  const data = args.map(el => stringify(el, (val, ind, str) => {
    if (getType(val) === 'bigint') return `${val}n`;
    return val;
  }, '  ')).join(', ');
  throttledPM(data);
};

const e = err => {
  const data = stringify(err);
  throttledPM(data, true);
};

addEventListener('message', ({ data }) => {
  try {
    const code = new Function(data);
    code();
  } catch (e) {
    console.error(e);
  }
});
