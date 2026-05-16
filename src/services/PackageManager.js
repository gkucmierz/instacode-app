import LZString from 'lz-string';
import { extractExports } from '../utils/parser.mjs';

const DB_NAME = 'InstacodeDB';
const STORE_NAME = 'packages';
const DB_VERSION = 4;

let dbInstance = null;

const getDB = () => {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      db.createObjectStore(STORE_NAME);
      
      if (db.objectStoreNames.contains('packages_v2')) {
        db.deleteObjectStore('packages_v2');
      }
    };
  });
};

const getFromCache = async (key) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

const saveToCache = async (key, data) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(data, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const resolvePackage = async (name, version, treeShake = false, specifiers = [], cdns = []) => {
  let actualVersion = version;
  if (!actualVersion || actualVersion === 'latest') {
    try {
      const res = await fetch(`https://data.jsdelivr.com/v1/package/resolve/npm/${name}@latest`);
      if (res.ok) {
        const data = await res.json();
        actualVersion = data.version;
      }
    } catch (e) {
      console.warn(`[PackageManager] Failed to resolve latest version for ${name}`, e);
    }
  }

  const cacheKey = `${name}@${actualVersion || 'latest'}${treeShake && specifiers && specifiers.length > 0 ? `?exports=${specifiers.join(',')}` : ''}`;
  
  try {
    const cachedCompressed = await getFromCache(cacheKey);
    if (cachedCompressed) {
      console.log(`[PackageManager] Loaded from IDB Cache: ${cacheKey}`);
      return { code: LZString.decompressFromUTF16(cachedCompressed), version: actualVersion };
    }
  } catch (err) {
    console.warn(`[PackageManager] Failed to read from cache for ${cacheKey}`, err);
  }

  const cdnList = (cdns && cdns.length > 0) ? cdns : [
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
  ];

  let lastError = null;

  for (const cdn of cdnList) {
    const isString = typeof cdn === 'string';
    const cdnUrl = isString ? cdn : cdn.url;
    const baseUrl = cdnUrl.endsWith('/') ? cdnUrl : cdnUrl + '/';
    const id = `${name}${actualVersion ? `@${actualVersion}` : ''}`;
    const exportsStr = (treeShake && specifiers && specifiers.length > 0) ? `&exports=${specifiers.join(',')}` : '';
    
    let url;
    let replacePattern = null;
    let replaceWith = null;

    if (isString) {
      // Legacy string fallback
      if (baseUrl.includes('esm.sh')) {
        url = `${baseUrl}${id}?bundle${exportsStr}`;
        replacePattern = "(import\\s+.*?from\\s*['\"]|import\\s*\\(['\"]|export\\s+.*?from\\s*['\"])\\/(?!\\/)([^'\"]+['\"])";
        replaceWith = `$1https://esm.sh/$2`;
      } else if (baseUrl.includes('jsdelivr')) {
        url = `${baseUrl}${id}/+esm`;
        replacePattern = "(import\\s+.*?from\\s*['\"]|import\\s*\\(['\"]|export\\s+.*?from\\s*['\"])\\/(?!\\/)([^'\"]+['\"])";
        replaceWith = `$1https://cdn.jsdelivr.net/$2`;
      } else if (baseUrl.includes('unpkg')) {
        url = `${baseUrl}${id}?module`;
      } else {
        url = `${baseUrl}${id}`;
      }
    } else {
      const repoPath = name.startsWith('@') ? name.substring(1) : name;
      url = (cdn.format || '{baseUrl}{id}')
        .replace('{baseUrl}', baseUrl)
        .replace('{id}', id)
        .replace('{name}', name)
        .replace('{version}', actualVersion || '')
        .replace('{repoPath}', repoPath)
        .replace('{exports}', exportsStr);
      replacePattern = cdn.replacePattern;
      replaceWith = cdn.replaceWith;
    }

    console.log(`[PackageManager] Fetching from CDN: ${url}`);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      let code = await response.text();
      
      if (replacePattern && replaceWith) {
        try {
          const regex = new RegExp(replacePattern, 'g');
          code = code.replace(regex, replaceWith);
        } catch(e) {
          console.error(`[PackageManager] Invalid regex in CDN config: ${replacePattern}`, e);
        }
      }

      // Fallback robust replacements for root-relative imports if they still exist (e.g. from esm.sh proxy modules)
      if (baseUrl.includes('esm.sh') || baseUrl.includes('jsdelivr')) {
        const origin = new URL(baseUrl).origin;
        code = code.replace(/from\s*['"]\/([^'"]+)['"]/g, `from "${origin}/$1"`);
        code = code.replace(/import\s*\(\s*['"]\/([^'"]+)['"]\s*\)/g, `import("${origin}/$1")`);
        code = code.replace(/import\s*['"]\/([^'"]+)['"]/g, `import "${origin}/$1"`);
      }
      
      try {
        const compressed = LZString.compressToUTF16(code);
        await saveToCache(cacheKey, compressed);
      } catch (err) {
        console.warn(`[PackageManager] Failed to save to cache for ${cacheKey}`, err);
      }
      
      return { code, version: actualVersion };
    } catch (err) {
      console.warn(`[PackageManager] CDN ${baseUrl} failed for ${cacheKey}:`, err.message);
      lastError = err;
    }
  }

  console.error(`[PackageManager] All CDNs failed for ${cacheKey}`);
  throw lastError || new Error(`All CDNs failed for ${cacheKey}`);
};

export const getPackageExports = async (name, version = 'latest', cdns = []) => {
  try {
    const { code } = await resolvePackage(name, version, false, [], cdns);
    return extractExports(code);
  } catch (err) {
    console.warn(`[PackageManager] Failed to get exports for ${name}`, err);
    return [];
  }
};

export const getAllCachedPackages = async () => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();
    const packages = [];
    
    request.onerror = () => reject(request.error);
    request.onsuccess = (e) => {
      try {
        const cursor = e.target.result;
        if (cursor) {
          const data = cursor.value;
          const sizeKB = data ? ((data.length * 2) / 1024).toFixed(1) : '0.0';
          packages.push({ key: cursor.key, sizeKB });
          cursor.continue();
        } else {
          resolve(packages);
        }
      } catch (err) {
        reject(err);
      }
    };
  });
};

export const removePackageFromCache = async (key) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const clearCache = async () => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

