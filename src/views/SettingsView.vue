<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import InputSwitch from 'primevue/inputswitch';

import PrimeButton from 'primevue/button';

import settingsService from '../services/settingsService';
import { getAllCachedPackages, removePackageFromCache, clearCache } from '../services/PackageManager';

const DEFAULT_SETTINGS = {
  autoScroll: false,
  autoPrint: true,
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

watch(
  so,
  (val) => {
    settingsService.set(val);
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
    <h3>App Settings</h3>

    <p class="item">
      <InputSwitch v-model="so.autoScroll" inputId="autoScroll" />
      <label for="autoScroll">Auto scroll result</label>
    </p>

    <p class="item">
      <InputSwitch v-model="so.autoPrint" inputId="autoPrint" />
      <label for="autoPrint">Auto print expressions</label>
    </p>

    <pre>{{ so }}</pre>

    <div class="cache-manager">
      <div class="cache-header">
        <h3>NPM Cache Management</h3>
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
  </div>
</template>

<style lang="scss" scoped>
.settings {
  padding: 12px 24px;

  .item {
    display: flex;
    align-items: center;

    label {
      margin-left: 12px;
    }
  }

  .cache-manager {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #333;

    .cache-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h3 {
        margin: 0;
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
