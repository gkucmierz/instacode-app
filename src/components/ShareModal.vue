<script setup>
import { ref, watch } from 'vue';

import InputText from 'primevue/inputtext';
import PrimeButton from 'primevue/button';

import copyToClipboard from 'copy-to-clipboard';

import ModalWindow from './ModalWindow.vue';
import codeService from '../services/codeService';
import { bundleCode } from '../services/BundlerService.js';
import settingsService from '../services/settingsService.mjs';

const props = defineProps({
  visible: Boolean,
});

const emit = defineEmits(['close']);

const code = ref('');
const isBundling = ref(false);
const bundledCode = ref('');
const errorMessage = ref('');

const encode = (c) => {
  return codeService.codeToUrl(c);
};

const copy = () => {
  copyToClipboard(encode(code.value));
};

const generateBundle = async () => {
  isBundling.value = true;
  errorMessage.value = '';
  try {
    const treeShake = settingsService.getItem('treeShake') || false;
    bundledCode.value = await bundleCode(code.value, treeShake);
  } catch (err) {
    console.error('Bundle failed', err);
    errorMessage.value = 'Bundle failed: ' + err.message;
  } finally {
    isBundling.value = false;
  }
};

const copyBundle = () => {
  if (bundledCode.value) {
    copyToClipboard(bundledCode.value);
  }
};

watch(() => props.visible, (visible) => {
  if (!visible) return;
  code.value = codeService.get();
  bundledCode.value = '';
  errorMessage.value = '';
});
</script>

<template>
  <div class="share-modal">
    <ModalWindow :visible="visible" @close="emit('close')">
      <template #header>
        <h3>Share Code</h3>
      </template>
      <template #body>
        <div class="p-inputgroup">
          <InputText :modelValue="encode(code)" readonly />
          <PrimeButton icon="pi pi-copy" class="p-button-info" @click="copy()" />
        </div>
        <div class="bundle-section">
          <PrimeButton 
            v-if="!bundledCode"
            icon="pi pi-box" 
            label="Generate Bundle" 
            class="p-button-success w-full" 
            @click="generateBundle()" 
            :loading="isBundling" 
          />
          <div v-if="errorMessage" style="color: #f87171; margin-top: 1rem; font-size: 0.9em; text-align: center;">
            <i class="pi pi-exclamation-triangle" style="margin-right: 4px;"></i> {{ errorMessage }}
          </div>
          <div v-else>
            <textarea class="bundle-preview" readonly :value="bundledCode"></textarea>
            <PrimeButton 
              icon="pi pi-copy" 
              label="Copy Bundled Code" 
              class="p-button-info w-full mt-2" 
              @click="copyBundle()" 
            />
          </div>
        </div>
      </template>
    </ModalWindow>
  </div>
</template>

<style lang="scss" scoped>
.p-inputgroup {
  min-width: 320px;
  width: 100%;
}
.bundle-section {
  margin-top: 1rem;
  margin-bottom: 1rem;
}
.bundle-preview {
  margin-top: 1rem;
  width: 100%;
  height: 120px;
  background-color: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0.5rem;
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
}
.w-full {
  width: 100%;
}
.mt-2 {
  margin-top: 0.5rem;
}
</style>
