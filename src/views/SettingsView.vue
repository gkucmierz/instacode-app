<script setup>
import { ref, reactive, watch, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import InputSwitch from 'primevue/inputswitch';
import PrimeButton from 'primevue/button';
import InputText from 'primevue/inputtext';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Dropdown from 'primevue/dropdown';

import { Codemirror } from 'vue-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import * as allThemes from '@uiw/codemirror-themes-all';

import settingsService from '../services/settingsService';
import { getAllCachedPackages, removePackageFromCache, clearCache } from '../services/PackageManager';

const DEFAULT_SETTINGS = {
  autoScroll: false,
  autoPrint: true,
  treeShake: true,
  theme: 'oneDark',
  cdns: [
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
  ],
  githubToken: ''
};

const THEMES = [
  { label: 'One Dark (Default)', value: 'oneDark' },
  { label: 'Dracula', value: 'dracula' },
  { label: 'GitHub Dark', value: 'githubDark' },
  { label: 'GitHub Light', value: 'githubLight' },
  { label: 'Nord', value: 'nord' },
  { label: 'Monokai', value: 'monokai' },
  { label: 'Material', value: 'material' },
  { label: 'Eclipse (Light)', value: 'eclipse' }
];

const themesMap = {
  oneDark,
  dracula: allThemes.dracula,
  githubDark: allThemes.githubDark,
  githubLight: allThemes.githubLight,
  nord: allThemes.nord,
  monokai: allThemes.monokai,
  material: allThemes.material,
  eclipse: allThemes.eclipse
};

const router = useRouter();

const so = reactive(
  Object.keys(DEFAULT_SETTINGS).reduce((acc, key) => {
    acc[key] = settingsService.getItem(key) ?? DEFAULT_SETTINGS[key];
    return acc;
  }, {})
);

const escDown = e => {
  if (!e) e = window.event;
  const ESC_CODE = 27;
  if (e.keyCode === ESC_CODE) {
    router.go(-1);
    e.preventDefault();
  }
};

const cachedPackages = ref([]);
const isCacheLoading = ref(false);

const fetchCache = async () => {
  isCacheLoading.value = true;
  try {
    cachedPackages.value = await getAllCachedPackages();
  } catch (err) {
    console.error('Failed to load cache:', err);
  } finally {
    isCacheLoading.value = false;
  }
};

const totalCacheSize = computed(() => {
  const totalKB = cachedPackages.value.reduce((acc, pkg) => acc + parseFloat(pkg.sizeKB), 0);
  if (totalKB > 1024) {
    return (totalKB / 1024).toFixed(2) + ' MB';
  }
  return totalKB.toFixed(2) + ' KB';
});

const handleRemovePackage = async (key) => {
  await removePackageFromCache(key);
  await fetchCache();
};

const handleRemoveGroup = async (group) => {
  if (confirm(`Are you sure you want to remove all cached versions of ${group.name}?`)) {
    for (const pkg of group.versions) {
      await removePackageFromCache(pkg.key);
    }
    await fetchCache();
  }
};

const groupedPackages = computed(() => {
  const groups = {};
  cachedPackages.value.forEach(pkg => {
    const lastAtIdx = pkg.key.lastIndexOf('@');
    let name = pkg.key;
    let version = '';
    
    if (lastAtIdx > 0) {
      name = pkg.key.substring(0, lastAtIdx);
      version = pkg.key.substring(lastAtIdx + 1);
    }
    
    if (!groups[name]) {
      groups[name] = {
        name,
        totalSizeKB: 0,
        versions: []
      };
    }
    
    groups[name].totalSizeKB += parseFloat(pkg.sizeKB || 0);
    groups[name].versions.push({
      ...pkg,
      version
    });
  });
  
  // Sort versions descending within each group, and sort groups alphabetically
  Object.values(groups).forEach(g => {
    g.versions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
  });
  
  return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
});

const handleClearCache = async () => {
  if (confirm('Are you sure you want to clear the entire NPM cache?')) {
    await clearCache();
    await fetchCache();
  }
};

const showToken = ref(false);

const KEY_ORDER = [
  'autoScroll',
  'autoPrint',
  'treeShake',
  'theme',
  'uiDensity',
  'githubToken',
  'cdns'
];

const getDisplayJson = () => {
  const displayObj = {};
  
  // Enforce specific order matching the UI layout
  KEY_ORDER.forEach(key => {
    if (so[key] !== undefined) {
      displayObj[key] = so[key];
    }
  });
  
  // Append any other keys that might not be in the order list
  Object.keys(so).forEach(key => {
    if (displayObj[key] === undefined) {
      displayObj[key] = so[key];
    }
  });

  if (!showToken.value && displayObj.githubToken) {
    displayObj.githubToken = '*'.repeat(displayObj.githubToken.length);
  }
  return JSON.stringify(displayObj, null, 2);
};

const jsonText = ref(getDisplayJson());

const extensions = computed(() => {
  const currentTheme = themesMap[so.theme] || oneDark;
  return [javascript(), currentTheme];
});

const onEditorChange = (value) => {
  jsonText.value = value;
  try {
    const parsed = JSON.parse(value);
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
      if (parsed[key] !== undefined) {
        if (key === 'githubToken' && !showToken.value && parsed[key] === '*'.repeat((so.githubToken || '').length)) {
          return; // Ignore mask
        }
        if (parsed[key] !== so[key]) {
          so[key] = parsed[key];
        }
      }
    });
  } catch (e) {
    // Invalid JSON while typing, ignore
  }
};

watch(
  so,
  (val) => {
    settingsService.set(val);
    const newStr = getDisplayJson();
    if (jsonText.value !== newStr) {
      jsonText.value = newStr;
    }
  },
  { deep: true }
);

watch(showToken, () => {
  jsonText.value = getDisplayJson();
});

onMounted(() => {
  window.addEventListener('keydown', escDown);
  fetchCache();
});

onUnmounted(() => {
  window.removeEventListener('keydown', escDown);
});
</script>

<template>
  <div class="settings">
    <TabView class="settings-tabs">
      <TabPanel header="General">
        <div class="general-tab-content">
          <div class="switches">
            <p class="item">
              <label for="autoScroll" style="margin-left: 0; margin-right: 12px; width: 150px">Auto scroll result</label>
              <InputSwitch v-model="so.autoScroll" inputId="autoScroll" />
            </p>

            <p class="item">
              <label for="autoPrint" style="margin-left: 0; margin-right: 12px; width: 150px">Auto print expressions</label>
              <InputSwitch v-model="so.autoPrint" inputId="autoPrint" />
            </p>

            <p class="item">
              <label for="treeShake" style="margin-left: 0; margin-right: 12px; width: 150px">Tree Shaking (Bundle)</label>
              <InputSwitch v-model="so.treeShake" inputId="treeShake" />
            </p>

            <p class="item">
              <label for="themeSelect" style="margin-left: 0; margin-right: 12px; width: 150px">Editor Theme</label>
              <Dropdown 
                id="themeSelect" 
                v-model="so.theme" 
                :options="THEMES" 
                optionLabel="label" 
                optionValue="value" 
                style="flex: 1"
              />
            </p>

            <p class="item">
              <label for="uiDensity" style="margin-left: 0; margin-right: 12px; width: 150px">UI Density (Tabs)</label>
              <Dropdown 
                id="uiDensity" 
                v-model="so.uiDensity" 
                :options="[{label: 'Compact', value: 'compact'}, {label: 'Comfortable', value: 'comfortable'}]" 
                optionLabel="label" 
                optionValue="value"
                style="flex: 1"
              />
            </p>

            <div class="item" style="display: flex; align-items: center;">
              <label for="githubToken" style="margin-left: 0; margin-right: 12px; width: 150px">GitHub Token (Gists)</label>
              <div style="display: flex; flex: 1; gap: 8px;">
                <InputText 
                  id="githubToken" 
                  :type="showToken ? 'text' : 'password'" 
                  v-model="so.githubToken" 
                  placeholder="ghp_..."
                  style="flex: 1"
                />
                <PrimeButton 
                  :icon="showToken ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                  class="p-button-secondary p-button-outlined"
                  @click="showToken = !showToken"
                  title="Toggle token visibility"
                />
              </div>
            </div>

            <div class="item" style="display: flex; align-items: center;">
              <label style="margin-left: 0; margin-right: 12px; width: 150px">NPM CDNs</label>
              <div style="flex: 1; font-size: 0.85em; opacity: 0.5; display: flex; align-items: center; gap: 6px;">
                <i class="pi pi-code"></i> Advanced (Edit in JSON &rarr;)
              </div>
            </div>
          </div>

          <div class="json-editor">
            <Codemirror
              :modelValue="jsonText"
              @update:modelValue="onEditorChange"
              :extensions="extensions"
              :style="{ height: '100%', minHeight: '150px' }"
            />
          </div>
        </div>
      </TabPanel>

      <TabPanel header="Package Cache">
        <div class="cache-manager">
          <div class="cache-header">
            <span class="total-size" v-if="cachedPackages.length > 0">
              Total size: <strong>{{ totalCacheSize }}</strong>
            </span>
            <PrimeButton 
              icon="pi pi-trash" 
              label="Clear All Cache" 
              class="p-button-danger p-button-sm" 
              @click="handleClearCache" 
              :disabled="cachedPackages.length === 0"
            />
          </div>
          
          <div v-if="isCacheLoading" class="cache-loading">Loading cache...</div>
          <div v-else-if="cachedPackages.length === 0" class="cache-empty">Cache is empty.</div>
          <ul v-else class="cache-list">
            <template v-for="group in groupedPackages" :key="group.name">
              <li class="cache-group-header">
                <div class="pkg-info">
                  <span class="pkg-name">{{ group.name }}</span>
                  <span class="pkg-size">Total: {{ group.totalSizeKB.toFixed(2) }} KB</span>
                </div>
                <PrimeButton 
                  icon="pi pi-trash" 
                  class="p-button-rounded p-button-danger p-button-text p-button-sm" 
                  title="Clear all versions"
                  @click="handleRemoveGroup(group)" 
                />
              </li>
              <li v-for="pkg in group.versions" :key="pkg.key" class="cache-item version-item">
                <div class="pkg-info">
                  <span class="pkg-version">v{{ pkg.version }}</span>
                  <span class="pkg-size">{{ pkg.sizeKB }} KB</span>
                </div>
                <PrimeButton 
                  icon="pi pi-times" 
                  class="p-button-rounded p-button-danger p-button-text p-button-sm" 
                  @click="handleRemovePackage(pkg.key)" 
                />
              </li>
            </template>
          </ul>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.settings-tabs) {
    height: 100%;
    display: flex;
    flex-direction: column;

    .p-tabview-panels {
      flex: 1;
      padding: 24px;
      overflow: auto;
    }
  }

  .general-tab-content {
    display: flex;
    gap: 2rem;
    height: 100%;
    align-items: stretch;
  }

  .switches {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .json-editor {
    flex: 1 1 auto;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #333;
  }

  .item {
    display: flex;
    align-items: center;
    margin: 0;

    label {
      margin-left: 12px;
    }
  }

  .cache-manager {
    margin-top: 1rem;

    .cache-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      .total-size {
        font-size: 0.9rem;
        color: #aaa;
        
        strong {
          color: #fff;
        }
      }
    }

    .cache-loading, .cache-empty {
      color: #888;
      font-style: italic;
    }

    .cache-list {
      list-style-type: none;
      padding: 0;
      margin: 0;

      .cache-group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0.5rem 0.25rem 0.5rem;
        margin-top: 1rem;
        border-bottom: 1px solid #333;
        
        .pkg-info {
          display: flex;
          flex-direction: column;

          .pkg-name {
            font-family: monospace;
            font-weight: bold;
            font-size: 1.1rem;
            color: #fff;
          }
          .pkg-size {
            font-size: 0.8rem;
            color: #888;
          }
        }
      }

      .cache-item.version-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.25rem 0.5rem;
        margin-bottom: 2px;
        background-color: #1e1e1e;
        border-radius: 4px;
        margin-left: 1rem;

        .pkg-info {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 1rem;

          .pkg-version {
            font-family: monospace;
            color: #d4d4d4;
          }

          .pkg-size {
            font-size: 0.8rem;
            color: #888;
          }
        }
      }
    }
  }
}
</style>
