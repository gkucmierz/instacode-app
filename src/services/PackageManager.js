import LZString from 'lz-string';

const DB_NAME = 'InstacodeDB';
const STORE_NAME = 'packages_v2';
const DB_VERSION = 1;

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
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
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

export const resolvePackage = async (name, version) => {
  const cacheKey = `${name}@${version || 'latest'}`;
  
  try {
    const cachedCompressed = await getFromCache(cacheKey);
    if (cachedCompressed) {
      console.log(`[PackageManager] Loaded from IDB Cache: ${cacheKey}`);
      return LZString.decompressFromUTF16(cachedCompressed);
    }
  } catch (err) {
    console.warn(`[PackageManager] Failed to read from cache for ${cacheKey}`, err);
  }

  console.log(`[PackageManager] Fetching from CDN: ${cacheKey}`);
  // We use esm.run (jsDelivr) instead of esm.sh because esm.sh returns root-relative imports (e.g. /v135/...)
  // which fail to resolve when executed from inside a Blob URL or Data URI.
  // esm.run resolves all dependencies to absolute https:// URLs or bundles them inline.
  const url = `https://esm.run/${name}${version ? `@${version}` : ''}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    
    const code = await response.text();
    
    try {
      const compressed = LZString.compressToUTF16(code);
      await saveToCache(cacheKey, compressed);
    } catch (err) {
      console.warn(`[PackageManager] Failed to save to cache for ${cacheKey}`, err);
    }
    
    return code;
  } catch (err) {
    console.error(`[PackageManager] Failed to fetch package ${cacheKey}`, err);
    throw err;
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
      const cursor = e.target.result;
      if (cursor) {
        const data = cursor.value;
        // String length * 2 bytes (UTF-16)
        const sizeKB = ((data.length * 2) / 1024).toFixed(1);
        packages.push({ key: cursor.key, sizeKB });
        cursor.continue();
      } else {
        resolve(packages);
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

