<script setup>
import { ref, watch } from 'vue';
import ModalWindow from './ModalWindow.vue';
import PrimeButton from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputSwitch from 'primevue/inputswitch';
import settingsService from '../services/settingsService';

const props = defineProps({
  visible: Boolean,
  tabTitle: String,
  tabCode: String
});

const emit = defineEmits(['close']);

const filename = ref('');
const isPublic = ref(false);
const isExporting = ref(false);
const successUrl = ref('');
const instacodeUrl = ref('');
const errorMessage = ref('');
const copiedGist = ref(false);
const copiedRunner = ref(false);
const localToken = ref('');
const showTokenInput = ref(false);

watch(() => props.visible, (newVal) => {
  if (newVal) {
    filename.value = props.tabTitle?.endsWith('.js') ? props.tabTitle : `${props.tabTitle || 'Script'}.js`;
    isPublic.value = false;
    isExporting.value = false;
    successUrl.value = '';
    instacodeUrl.value = '';
    errorMessage.value = '';
    copiedGist.value = false;
    copiedRunner.value = false;
    
    localToken.value = settingsService.getItem('githubToken') || '';
    showTokenInput.value = !localToken.value;
  }
});

const copyToClipboard = async (text, type) => {
  try {
    await navigator.clipboard.writeText(text);
    if (type === 'gist') {
      copiedGist.value = true;
      setTimeout(() => copiedGist.value = false, 2000);
    } else {
      copiedRunner.value = true;
      setTimeout(() => copiedRunner.value = false, 2000);
    }
  } catch (err) {
    console.error('Failed to copy', err);
  }
};

const doExport = async () => {
  if (!localToken.value) {
    errorMessage.value = 'GitHub token is required to export Gists.';
    showTokenInput.value = true;
    return;
  }
  
  if (localToken.value !== settingsService.getItem('githubToken')) {
    settingsService.setItem('githubToken', localToken.value);
  }

  isExporting.value = true;
  errorMessage.value = '';
  
  const payload = {
    public: isPublic.value,
    files: {
      [filename.value]: {
        content: props.tabCode
      }
    }
  };
  
  try {
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `token ${localToken.value}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      const data = await res.json();
      const shareUrl = `${window.location.origin}/gist/${data.id}`;
      
      // Update description with the evaluation link
      await fetch(`https://api.github.com/gists/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${localToken.value}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: `Run this code instantly in your browser: ${shareUrl}`
        })
      });

      // Remove auto-copy
      successUrl.value = data.html_url;
      instacodeUrl.value = shareUrl;
    } else {
      const errorData = await res.json();
      errorMessage.value = `Failed to create gist: ${errorData.message || res.statusText}`;
      if (res.status === 401 || (errorData.message && errorData.message.includes('credential'))) {
        showTokenInput.value = true;
      }
    }
  } catch(err) {
    errorMessage.value = `Error: ${err.message}`;
  } finally {
    isExporting.value = false;
  }
};
</script>

<template>
  <ModalWindow :visible="visible" @close="emit('close')">
    <template #body>
      <div class="gist-modal">
        <h2 style="margin-top: 0">Export to GitHub Gist</h2>
        
        <div v-if="successUrl" class="success-panel">
          <p style="color: #4ade80; margin-bottom: 1.5rem">
            <i class="pi pi-check-circle" style="margin-right: 4px;"></i> Success! Gist created successfully.
          </p>
          
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
            <label style="font-size: 0.9em; opacity: 0.8;">GitHub Gist URL:</label>
            <a :href="successUrl" target="_blank" style="font-size: 0.9em; color: #60a5fa; text-decoration: none;">Open <i class="pi pi-external-link" style="font-size: 0.8em; margin-left: 2px;"></i></a>
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 1.5rem;">
            <InputText :value="successUrl" readonly style="flex: 1;" />
            <PrimeButton 
              :icon="copiedGist ? 'pi pi-check' : 'pi pi-copy'" 
              :class="copiedGist ? 'p-button-success' : 'p-button-secondary'" 
              @click="copyToClipboard(successUrl, 'gist')" 
              title="Copy Gist URL" 
            />
          </div>

          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
            <label style="font-size: 0.9em; opacity: 0.8;">Instacode Runner URL:</label>
            <a :href="instacodeUrl" target="_blank" style="font-size: 0.9em; color: #60a5fa; text-decoration: none;">Open <i class="pi pi-external-link" style="font-size: 0.8em; margin-left: 2px;"></i></a>
          </div>
          <div style="display: flex; gap: 8px;">
            <InputText :value="instacodeUrl" readonly style="flex: 1;" />
            <PrimeButton 
              :icon="copiedRunner ? 'pi pi-check' : 'pi pi-copy'" 
              :class="copiedRunner ? 'p-button-success' : 'p-button-secondary'" 
              @click="copyToClipboard(instacodeUrl, 'runner')" 
              title="Copy Instacode URL" 
            />
          </div>
          
          <div class="actions" style="margin-top: 2rem;">
            <PrimeButton label="Close" class="p-button-primary" @click="emit('close')" />
          </div>
        </div>

        <div v-else>
          <div v-if="showTokenInput" class="form-group" style="margin-bottom: 1.5rem; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <label style="color: #fbbf24; display: flex; align-items: center; margin-bottom: 0.5rem;">
              <i class="pi pi-key" style="margin-right: 6px;"></i> Provide GitHub Token
            </label>
            <p style="font-size: 0.85em; opacity: 0.8; margin-top: 0; margin-bottom: 0.8rem;">
              A personal access token with 'gist' scope is required.
            </p>
            <InputText type="password" v-model="localToken" placeholder="ghp_..." style="width: 100%" />
          </div>

          <div class="form-group">
            <label>Filename:</label>
            <InputText v-model="filename" style="width: 100%" :disabled="isExporting" />
          </div>
          
          <div class="form-group checkbox-group">
            <InputSwitch id="gistPublic" v-model="isPublic" :disabled="isExporting" />
            <label for="gistPublic" style="cursor: pointer;" :style="{ opacity: isExporting ? 0.6 : 1 }">Make Gist Public (default is Secret)</label>
          </div>

          <div v-if="errorMessage" style="color: #f87171; margin-top: 1rem; font-size: 0.9em;">
            {{ errorMessage }}
          </div>

          <div class="actions">
            <PrimeButton label="Cancel" class="p-button-secondary p-button-outlined" @click="emit('close')" :disabled="isExporting" />
            <PrimeButton 
              :label="isExporting ? 'Exporting...' : 'Export to Gist'" 
              :icon="isExporting ? 'pi pi-spinner pi-spin' : null"
              class="p-button-primary" 
              @click="doExport" 
              :disabled="isExporting"
            />
          </div>
        </div>
      </div>
    </template>
  </ModalWindow>
</template>

<style scoped>
.gist-modal {
  width: 400px;
  color: var(--tab-active-text, #fff);
  font-family: sans-serif;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.checkbox-group label {
  margin-bottom: 0;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 2rem;
}
</style>
