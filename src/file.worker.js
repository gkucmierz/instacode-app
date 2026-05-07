
import { stringify } from 'javascript-stringify';
import { MAX_DATA_SIZE, ERROR_MAX_DATA_SIZE } from './app.config';
// import { getType } from '@gkucmierz/utils/src/get-type';

import { addDefaultLog } from './utils/utils';
import { extractDependencies, transformImports } from './utils/parser.mjs';
import { resolvePackage } from './services/PackageManager.js';

const log = console.log;
console.log = (...a) => l(a);
console.error = a => e(a);

// limit chunk of data sent to browser, to avoid eventloop blocking
const limitData = (() => {
  let sent = 0;
  return data => {
    if (sent > MAX_DATA_SIZE) return '';
    if (sent + data.length > MAX_DATA_SIZE) {
      sent += data.length;
      return [
        data.substr(0, MAX_DATA_SIZE),
        '',
        ERROR_MAX_DATA_SIZE,
      ].join('\n');
    }
    sent += data.length;
    return data;
  };
})();

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
      const data = limitData(dataCache.join('\n'));
      if (data) {
        pm(data);
        lastUpdate = now;
        dataCache = [];
      }
    }

    if (tryAgain) {
      const nextTick = fn => setTimeout(fn, 0);
      const tryAgainFn = () => throttledPM([][0], false, false);
      // try push data asap
      nextTick(tryAgainFn);
      // try push possibly cached data for async code
      setTimeout(tryAgainFn, updateDelay);
    }
  };
})();

const l = args => {
  // const data = args.map(el => stringify(el, (val, ind, str) => {
  //   if (getType(val) === 'bigint') return `${val}n`;
  //   return val;
  // }, '  ')).join(', ');
  const data = args.map(el => stringify(el, null, '  ')).join(', ');
  throttledPM(data);
};

const e = err => {
  const data = stringify(err);
  throttledPM(data, true);
};

const moduleRegistry = {};

const customRequire = (pkgName) => {
  if (moduleRegistry[pkgName]) {
    // Return the raw namespace object. 
    // The AST transformer already handles `.default ||` for default imports.
    // This allows named imports and namespace imports to work correctly.
    return moduleRegistry[pkgName];
  }
  throw new Error(`Module ${pkgName} not found or failed to load.`);
};

addEventListener('message', async ({ data }) => {
  const { code, settings } = data;
  try {
    const deps = extractDependencies(code);
    
    if (deps.length > 0) {
      await Promise.all(deps.map(async ({ name, version }) => {
        if (!moduleRegistry[name]) {
          if (name.startsWith('data:') || name.startsWith('http://') || name.startsWith('https://')) {
            try {
              moduleRegistry[name] = await import(name);
            } catch (err) {
              console.error(`Failed to load URL module ${name}`, err);
              throw err;
            }
          } else {
            const pkgCode = await resolvePackage(name, version);
            const blob = new Blob([pkgCode], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            try {
              moduleRegistry[name] = await import(url);
            } catch (err) {
              console.error(`Failed to load module ${name} into memory`, err);
              throw err;
            }
            URL.revokeObjectURL(url);
          }
        }
      }));
    }

    let finalCode = transformImports(code);
    if (settings.autoPrint) {
      finalCode = addDefaultLog(finalCode);
    }
    
    const runner = new Function('require', finalCode);
    runner(customRequire);
  } catch (e) {
    console.error(e);
  }
});
