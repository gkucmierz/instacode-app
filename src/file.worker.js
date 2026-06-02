
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
  self['nativePostMessage'] = pm;
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

console.flush = () => throttledPM(undefined, true, false);

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
    return moduleRegistry[pkgName];
  }
  
  // Fallback: if pkgName is without version, find the first loaded version
  const keys = Object.keys(moduleRegistry);
  const matchedKey = keys.find(k => k.startsWith(pkgName + '@'));
  if (matchedKey) return moduleRegistry[matchedKey];
  
  throw new Error(`Module ${pkgName} not found or failed to load.`);
};
const sendState = () => {
  const pm = self.nativePostMessage;
  if (pm && typeof pm === 'function') {
    pm({ type: 'worker-state', state: activeTimers.size > 0 ? 'alive_async' : 'idle' });
  }
};

const origSetTimeout = self.setTimeout;
const origClearTimeout = self.clearTimeout;
const origSetInterval = self.setInterval;
const origClearInterval = self.clearInterval;
const activeTimers = new Set();

self.setTimeout = (cb, ms, ...args) => {
  const stack = new Error().stack || '';
  const isSystemTimer = stack.includes('@vite') || stack.includes('vue-devtools') || stack.includes('extension-');
  
  const id = origSetTimeout((...a) => {
    if (!isSystemTimer) {
      activeTimers.delete(id);
      sendState();
    }
    cb(...a);
  }, ms, ...args);
  
  if (!isSystemTimer) {
    activeTimers.add(id);
    sendState();
  }
  return id;
};

self.clearTimeout = (id) => {
  if (activeTimers.has(id)) {
    activeTimers.delete(id);
    sendState();
  }
  origClearTimeout(id);
};

self.setInterval = (cb, ms, ...args) => {
  const stack = new Error().stack || '';
  const isSystemTimer = stack.includes('@vite') || stack.includes('vue-devtools') || stack.includes('extension-');

  const id = origSetInterval(cb, ms, ...args);
  if (!isSystemTimer) {
    activeTimers.add(id);
    sendState();
  }
  return id;
};

self.clearInterval = (id) => {
  if (activeTimers.has(id)) {
    activeTimers.delete(id);
    sendState();
  }
  origClearInterval(id);
};

let canvasResolver = null;
const canvasPromise = new Promise((resolve) => {
  canvasResolver = resolve;
});
let displaySize = { width: 300, height: 150 };
const resizeCallbacks = [];

addEventListener('message', async ({ data }) => {
  if (data && data.type === 'ping') {
    const pm = self.nativePostMessage;
    if (pm && typeof pm === 'function') pm({ type: 'pong', state: activeTimers.size > 0 ? 'alive_async' : 'idle' });
    return;
  }

  if (data && data.type === 'resolve-canvas') {
    if (canvasResolver) {
      canvasResolver(data.canvas);
    }
    return;
  }

  if (data && data.type === 'canvas-resize') {
    displaySize.width = data.width;
    displaySize.height = data.height;
    for (const cb of resizeCallbacks) {
      try {
        cb(data.width, data.height);
      } catch (err) {
        console.error(err);
      }
    }
    return;
  }
  
  const { code, settings } = data;

  if (settings && settings.workerWindowPolyfill) {
    if (typeof self !== 'undefined' && !self.window) {
      self.window = self;
    }
    if (typeof self !== 'undefined' && !self.devicePixelRatio) {
      self.devicePixelRatio = 1;
    }
  }

  try {
    const deps = extractDependencies(code);
    
    if (deps.length > 0) {
      const pm = self.nativePostMessage;
      if (pm && typeof pm === 'function') {
        pm({ type: 'loading', state: true });
      }
      await Promise.all(deps.map(async (dep) => {
        const { name, version, loc, type: typeDep } = dep;
        if (name === 'canvas') {
          const pm = self.nativePostMessage;
          if (pm && typeof pm === 'function') {
            pm({ type: 'request-canvas' });
          }
          const offscreenCanvas = await canvasPromise;
          moduleRegistry['canvas'] = {
            canvas: offscreenCanvas,
            default: offscreenCanvas,
            getContext: (type) => offscreenCanvas.getContext(type),
            getDisplaySize: () => ({ ...displaySize }),
            onResize: (cb) => {
              if (typeof cb === 'function') {
                resizeCallbacks.push(cb);
                try {
                  cb(displaySize.width, displaySize.height);
                } catch (err) {
                  console.error(err);
                }
              }
            }
          };
          dep.uniqueName = 'canvas';
          return;
        }
        if (name.startsWith('data:') || name.startsWith('http://') || name.startsWith('https://')) {
          if (!moduleRegistry[name]) {
            try {
              moduleRegistry[name] = await import(/* @vite-ignore */ name);
            } catch (err) {
              console.error(`Failed to load URL module ${name}`, err);
              throw err;
            }
          }
          dep.uniqueName = name;
        } else {
          const { code: pkgCode, version: resolvedVersion } = await resolvePackage(name, version, settings?.treeShake, [], settings?.cdns);
          
          if (!version && resolvedVersion && !dep._notified) {
            const pm = self.nativePostMessage;
            if (pm && typeof pm === 'function') {
              try {
                pm({ type: 'lock-dependency', line: loc.start.line, name, resolvedVersion, isRequire: typeDep === 'require' });
                dep._notified = true;
              } catch (e) {
                console.error(e);
              }
            }
          }
          
          const uniqueName = `${name}@${resolvedVersion}`;
          dep.uniqueName = uniqueName;
          
          if (!moduleRegistry[uniqueName]) {
            const blob = new Blob([pkgCode], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            try {
              moduleRegistry[uniqueName] = await import(/* @vite-ignore */ url);
            } catch (err) {
              console.error(`Failed to load module ${name} into memory`, err);
              throw err;
            }
            URL.revokeObjectURL(url);
          }
        }
      }));
    }

    const pm = self.nativePostMessage;
    if (pm && typeof pm === 'function') {
      pm({ type: 'loading', state: false });
    }

    let finalCode = transformImports(code);
    
    const lines = finalCode.split('\n');
    for (const dep of deps) {
      if (!dep.uniqueName || dep.uniqueName === dep.name) continue;
      const lineIdx = dep.loc.start.line - 1;
      let lineStr = lines[lineIdx];
      const quotePattern = `['"\`]${dep.name}['"\`]`;
      const reqRegex = new RegExp(`require\\s*\\(\\s*${quotePattern}\\s*\\)`);
      if (reqRegex.test(lineStr)) {
        lines[lineIdx] = lineStr.replace(reqRegex, `require('${dep.uniqueName}')`);
      }
      
      const impRegex = new RegExp(`import\\s*\\(\\s*${quotePattern}\\s*\\)`);
      if (impRegex.test(lineStr)) {
        lines[lineIdx] = lineStr.replace(impRegex, `Promise.resolve(require('${dep.uniqueName}'))`);
      }
    }
    finalCode = lines.join('\n');
    if (settings.autoPrint) {
      finalCode = addDefaultLog(finalCode);
    }
    
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const __yield = () => new Promise(r => setTimeout(r, 0));
    
    const runner = new AsyncFunction('require', '__yield', finalCode);
    await runner(customRequire, __yield);
    sendState();
  } catch (e) {
    const pm = self.nativePostMessage;
    if (pm && typeof pm === 'function') pm({ type: 'loading', state: false });
    
    console.error(e);
    sendState();
  }
});
