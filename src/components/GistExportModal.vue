<script setup>
import { ref, watch } from 'vue';
import ModalWindow from './ModalWindow.vue';
import PrimeButton from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputSwitch from 'primevue/inputswitch';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import settingsService from '../services/settingsService';
import codeService from '../services/codeService';

const props = defineProps({
  visible: Boolean,
  tabTitle: String,
  tabCode: String
});

const emit = defineEmits(['close']);

const filename = ref('');
const isPublic = ref(false);
const appendLink = ref(false);
const isExporting = ref(false);
const successUrl = ref('');
const instacodeUrl = ref('');
const errorMessage = ref('');
const copiedGist = ref(false);
const copiedRunner = ref(false);
const localToken = ref('');
const showTokenInput = ref(false);
const showToken = ref(false);

const activeTabIndex = ref(0);
const importUrl = ref('');
const isImporting = ref(false);
const importErrorMessage = ref('');

const linkedGistId = ref(null);

watch(filename, (newVal) => {
  if (newVal && (newVal.startsWith('http://') || newVal.startsWith('https://'))) {
    importUrl.value = newVal;
    filename.value = props.tabTitle?.endsWith('.js') ? props.tabTitle : `${props.tabTitle || 'Script'}.js`;
    activeTabIndex.value = 1; // Auto-switch to import tab
  }
});

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    filename.value = props.tabTitle?.endsWith('.js') ? props.tabTitle : `${props.tabTitle || 'Script'}.js`;
    isPublic.value = false;
    appendLink.value = false;
    isExporting.value = false;
    successUrl.value = '';
    instacodeUrl.value = '';
    errorMessage.value = '';
    copiedGist.value = false;
    copiedRunner.value = false;
    
    const activeTab = codeService.getTab(codeService.getActiveTabId());
    linkedGistId.value = activeTab ? activeTab.gistId : null;
    
    if (linkedGistId.value) {
      try {
        const res = await fetch(`https://api.github.com/gists/${linkedGistId.value}`);
        if (res.ok) {
          const data = await res.json();
          isPublic.value = data.public;
        }
      } catch (err) {
        // Silently ignore network errors, UI will just show default false
      }
    }
    
    localToken.value = settingsService.getItem('githubToken') || '';
    showTokenInput.value = !localToken.value;
    
    importUrl.value = '';
    isImporting.value = false;
    importErrorMessage.value = '';
    activeTabIndex.value = 0;
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

const doExport = async (isUpdate = false) => {
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
  
  const isPatch = isUpdate && linkedGistId.value;
  const method = isPatch ? 'PATCH' : 'POST';
  const url = isPatch ? `https://api.github.com/gists/${linkedGistId.value}` : 'https://api.github.com/gists';
  
  const payload = {
    files: {
      [filename.value]: {
        content: props.tabCode
      }
    }
  };
  
  if (!isPatch) {
    payload.public = isPublic.value;
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${localToken.value.trim()}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      const data = await res.json();
      const shareUrl = `${window.location.origin}/gist/${data.id}`;
      
      const shareText = `Run this code instantly in your browser: ${shareUrl}`;
      const currentDesc = data.description || '';
      
      if (appendLink.value && !currentDesc.includes(shareText)) {
        const newDesc = currentDesc ? `${currentDesc}\n\n${shareText}` : shareText;
        await fetch(`https://api.github.com/gists/${data.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localToken.value.trim()}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            description: newDesc
          })
        });
      }
      
      if (!isPatch) {
        // Save the gist ID to the tab so we can update it later
        codeService.setGistId(codeService.getActiveTabId(), data.id);
        linkedGistId.value = data.id;
      }

      // Remove auto-copy
      successUrl.value = data.html_url;
      instacodeUrl.value = shareUrl;
    } else {
      const errorData = await res.json();
      errorMessage.value = `Failed to ${isPatch ? 'update' : 'create'} gist: ${errorData.message || res.statusText}`;
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

const doImport = async () => {
  if (!importUrl.value) return;
  isImporting.value = true;
  importErrorMessage.value = '';
  
  let targetUrl = importUrl.value.trim();
  let importFilename = 'imported-snippet.js';
  
  const gistHashRegex = /^[a-f0-9]{32}$/i;
  const gistUrlRegex = /gist\.github\.com\/[^/]+\/([a-f0-9]{32})/i;
  
  if (gistHashRegex.test(targetUrl)) {
    targetUrl = `https://api.github.com/gists/${targetUrl}`;
  } else if (gistUrlRegex.test(targetUrl)) {
    const match = targetUrl.match(gistUrlRegex);
    targetUrl = `https://api.github.com/gists/${match[1]}`;
  }

  const fetchContent = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const contentLength = response.headers.get('content-length');
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
      throw new Error('File exceeds 5MB limit.');
    }
    
    const reader = response.body.getReader();
    let receivedLength = 0;
    const chunks = [];
    
    let streaming = true;
    while(streaming) {
      const {done, value} = await reader.read();
      if (done) {
        streaming = false;
        break;
      }
      receivedLength += value.length;
      if (receivedLength > MAX_SIZE) {
        reader.cancel();
        throw new Error('File exceeds 5MB limit during streaming.');
      }
      chunks.push(value);
    }
    
    const chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for(let chunk of chunks) {
      chunksAll.set(chunk, position);
      position += chunk.length;
    }
    
    return new TextDecoder("utf-8").decode(chunksAll);
  };

  try {
    let content = '';
    let gistId = null;
    
    if (targetUrl.includes('api.github.com/gists/')) {
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error(`Gist API Error: ${res.status}`);
      const data = await res.json();
      const files = Object.values(data.files);
      if (files.length === 0) throw new Error('No files found in Gist');
      content = files[0].content;
      importFilename = files[0].filename;
      gistId = data.id;
    } else {
      importFilename = targetUrl.split('/').pop().split('?')[0] || 'imported-snippet.js';
      
      try {
        content = await fetchContent(targetUrl);
      } catch (e) {
        if (e.name === 'TypeError' || e.message.includes('HTTP')) {
           // Multi-CORS proxy fallback array
           const proxies = [
             (u) => `https://cors-proxy.7u.pl/?url=${encodeURIComponent(u)}`,
             (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
             (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
             (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
             (u) => `https://cors-anywhere.herokuapp.com/${u}`
           ];
           
           let success = false;
           let lastError = e;
           
           for (const proxyFn of proxies) {
             try {
               const proxyUrl = proxyFn(targetUrl);
               content = await fetchContent(proxyUrl);
               success = true;
               break;
             } catch (proxyErr) {
               lastError = proxyErr;
             }
           }
           
           if (!success) {
             throw new Error(`CORS proxy fallback failed. Proxies returned: ${lastError.message}`);
           }
        } else {
           throw e;
        }
      }
    }
    
    codeService.newTab(content, importFilename, gistId);
    emit('close');
  } catch (err) {
    importErrorMessage.value = `Import failed: ${err.message}`;
  } finally {
    isImporting.value = false;
  }
};
</script>

<template>
  <ModalWindow :visible="visible" @close="emit('close')">
    <template #body>
      <div class="gist-modal">
        <TabView v-model:activeIndex="activeTabIndex">
          <!-- EXPORT TAB -->
          <TabPanel header="Export to Gist">
            <div v-if="successUrl" class="success-panel" style="margin-top: 1rem;">
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

            <div v-else style="margin-top: 1rem;">
              <div v-if="showTokenInput" class="form-group" style="margin-bottom: 1.5rem; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                <label style="color: #fbbf24; display: flex; align-items: center; margin-bottom: 0.5rem;">
                  <i class="pi pi-key" style="margin-right: 6px;"></i> Provide GitHub Token
                </label>
                <p style="font-size: 0.85em; opacity: 0.8; margin-top: 0; margin-bottom: 0.8rem;">
                  A personal access token with 'gist' scope is required.
                </p>
                <div style="display: flex; gap: 8px;">
                  <InputText :type="showToken ? 'text' : 'password'" v-model="localToken" placeholder="ghp_..." style="width: 100%" />
                  <PrimeButton 
                    :icon="showToken ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                    class="p-button-secondary p-button-outlined"
                    @click="showToken = !showToken"
                    title="Toggle Visibility"
                  />
                </div>
              </div>

              <div v-if="linkedGistId" style="background: rgba(96, 165, 250, 0.1); border-left: 3px solid #60a5fa; padding: 0.8rem; margin-bottom: 1.5rem; border-radius: 4px;">
                <div style="font-size: 0.85em; opacity: 0.8; margin-bottom: 4px;">
                  <i class="pi pi-link" style="margin-right: 4px;"></i> Linked to GitHub Gist:
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <code style="background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px; color: #93c5fd;">{{ linkedGistId.substring(0, 16) }}...</code>
                  <a :href="`https://gist.github.com/${linkedGistId}`" target="_blank" style="color: #60a5fa; text-decoration: none; font-size: 0.85em;">
                    View <i class="pi pi-external-link" style="font-size: 0.8em; margin-left: 2px;"></i>
                  </a>
                </div>
              </div>

              <div class="form-group">
                <label>Filename:</label>
                <InputText v-model="filename" style="width: 100%" :disabled="isExporting" />
              </div>
              
              <div class="form-group checkbox-group">
                <InputSwitch inputId="gistPublic" v-model="isPublic" :disabled="isExporting || isUpdate" />
                <label for="gistPublic" style="cursor: pointer;" :style="{ opacity: (isExporting || isUpdate) ? 0.6 : 1 }">
                  {{ isUpdate ? (isPublic ? 'Gist is Public' : 'Gist is Secret') : 'Make Gist Public (default is Secret)' }}
                </label>
              </div>

              <div class="form-group checkbox-group" style="margin-top: 0.5rem;">
                <InputSwitch inputId="appendLink" v-model="appendLink" :disabled="isExporting" />
                <label for="appendLink" style="cursor: pointer;" :style="{ opacity: isExporting ? 0.6 : 1 }">Include 'Run in Instacode' link in description</label>
              </div>

              <div v-if="errorMessage" style="color: #f87171; margin-top: 1rem; font-size: 0.9em;">
                {{ errorMessage }}
              </div>

              <div class="actions">
                <PrimeButton label="Cancel" class="p-button-secondary p-button-outlined" @click="emit('close')" :disabled="isExporting" />
                
                <template v-if="linkedGistId">
                  <PrimeButton 
                    :label="isExporting ? 'Creating...' : 'Create New'" 
                    :icon="isExporting ? 'pi pi-spinner pi-spin' : 'pi pi-plus'"
                    class="p-button-secondary p-button-outlined" 
                    @click="doExport(false)" 
                    :disabled="isExporting"
                  />
                  <PrimeButton 
                    :label="isExporting ? 'Updating...' : 'Update Gist'" 
                    :icon="isExporting ? 'pi pi-spinner pi-spin' : 'pi pi-save'"
                    class="p-button-primary" 
                    @click="doExport(true)" 
                    :disabled="isExporting"
                  />
                </template>
                <template v-else>
                  <PrimeButton 
                    :label="isExporting ? 'Exporting...' : 'Export to Gist'" 
                    :icon="isExporting ? 'pi pi-spinner pi-spin' : null"
                    class="p-button-primary" 
                    @click="doExport(false)" 
                    :disabled="isExporting"
                  />
                </template>
              </div>
            </div>
          </TabPanel>
          
          <!-- IMPORT TAB -->
          <TabPanel header="Import snippet">
            <div style="margin-top: 1rem;">
              <div class="form-group">
                <label>Gist Hash, Gist URL, or Raw File URL:</label>
                <InputText v-model="importUrl" style="width: 100%" placeholder="https://..." :disabled="isImporting" @keyup.enter="doImport" />
                <p style="font-size: 0.8em; opacity: 0.6; margin-top: 4px; margin-bottom: 0;">
                  Supported: Gist IDs, Gist links, or direct HTTP/HTTPS links to raw code.
                </p>
              </div>

              <div v-if="importErrorMessage" style="color: #f87171; margin-top: 1rem; font-size: 0.9em;">
                {{ importErrorMessage }}
              </div>

              <div class="actions">
                <PrimeButton label="Cancel" class="p-button-secondary p-button-outlined" @click="emit('close')" :disabled="isImporting" />
                <PrimeButton 
                  :label="isImporting ? 'Importing...' : 'Import to New Tab'" 
                  :icon="isImporting ? 'pi pi-spinner pi-spin' : 'pi pi-cloud-download'"
                  class="p-button-primary" 
                  @click="doImport" 
                  :disabled="isImporting"
                />
              </div>
            </div>
          </TabPanel>
        </TabView>
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

/* Beautiful integration of TabView into the Modal */
.gist-modal :deep(.p-tabview-nav) {
  background: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  margin-bottom: 0.5rem;
}
.gist-modal :deep(.p-tabview-nav-link) {
  background: transparent !important;
  color: rgba(255, 255, 255, 0.6) !important;
  border-color: transparent !important;
  box-shadow: none !important;
  padding: 0.5rem 1rem !important;
}
.gist-modal :deep(.p-tabview-nav-link:hover) {
  color: rgba(255, 255, 255, 0.9) !important;
  background: rgba(255, 255, 255, 0.05) !important;
}
.gist-modal :deep(.p-highlight .p-tabview-nav-link) {
  color: #fff !important;
  border-bottom: 2px solid #60a5fa !important;
  background: transparent !important;
}
.gist-modal :deep(.p-tabview-panels) {
  background: transparent !important;
  padding: 0 !important;
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
