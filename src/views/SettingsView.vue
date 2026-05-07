<script setup>
import { ref, reactive, watch, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import InputSwitch from 'primevue/inputswitch';
import PrimeButton from 'primevue/button';
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
  theme: 'oneDark',
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

const handleClearCache = async () => {
  if (confirm('Are you sure you want to clear the entire NPM cache?')) {
    await clearCache();
    await fetchCache();
  }
};

const jsonText = ref(JSON.stringify(so, null, 2));

const extensions = computed(() => {
  const currentTheme = themesMap[so.theme] || oneDark;
  return [javascript(), currentTheme];
});

const onEditorChange = (value) => {
  jsonText.value = value;
  try {
    const parsed = JSON.parse(value);
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
      if (parsed[key] !== undefined && parsed[key] !== so[key]) {
        so[key] = parsed[key];
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
    const newStr = JSON.stringify(val, null, 2);
    if (jsonText.value !== newStr) {
      jsonText.value = newStr;
    }
  },
  { deep: true }
);

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
    <TabView>
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
            <li v-for="pkg in cachedPackages" :key="pkg.key" class="cache-item">
              <div class="pkg-info">
                <span class="pkg-name">{{ pkg.key }}</span>
                <span class="pkg-size">{{ pkg.sizeKB }} KB</span>
              </div>
              <PrimeButton 
                icon="pi pi-times" 
                class="p-button-rounded p-button-danger p-button-text p-button-sm" 
                @click="handleRemovePackage(pkg.key)" 
              />
            </li>
          </ul>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  padding: 12px 24px;

  .general-tab-content {
    display: flex;
    gap: 2rem;
    margin-top: 1rem;
    align-items: flex-start;
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

      .cache-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        border-radius: 4px;
        background-color: #1e1e1e;
        margin-bottom: 0.5rem;

        .pkg-info {
          display: flex;
          flex-direction: column;

          .pkg-name {
            font-family: monospace;
            font-weight: bold;
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
