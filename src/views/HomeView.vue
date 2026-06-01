<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';

import ResultCode from '../components/ResultCode.vue';
import CodeEditor from '../components/CodeEditor.vue';
import GistExportModal from '../components/GistExportModal.vue';
import settingsService from '../services/settingsService';
import codeService from '../services/codeService';
import themeMap from '../assets/themes-metadata.json';

import Worker from '../file.worker.js?worker';

import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import ProgressBar from 'primevue/progressbar';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import { setSafeInterval } from '@gkucmierz/utils';

const tabs = ref(codeService.getTabs());
const activeTabIndex = ref(tabs.value.findIndex(t => t.id === codeService.getActiveTabId()));

const updateTabs = () => {
  const oldTabIds = new Set(tabs.value.map(t => t.id));
  tabs.value = [...codeService.getTabs()];
  const newTabIds = new Set(tabs.value.map(t => t.id));

  // Terminate and clean up any tab states that were removed
  oldTabIds.forEach(id => {
    if (!newTabIds.has(id)) {
      terminate(id);
      delete tabStates.value[id];
    }
  });

  const idx = tabs.value.findIndex(t => t.id === codeService.getActiveTabId());
  if (idx !== -1 && idx !== activeTabIndex.value) {
    activeTabIndex.value = idx;
  }
};

const onTabChange = (index) => {
  activeTabIndex.value = index;
  const tab = tabs.value[index];
  if (tab) {
    codeService.setActiveTab(tab.id);
  }
};

const handleKeydown = (e) => {
  if (!e) e = window.event;
  const cmdCtrl = e.ctrlKey || e.metaKey;

  // Cmd+N (New Tab)
  if (cmdCtrl && e.keyCode === 78) {
    e.preventDefault();
    codeService.newTab('');
  }
  
  // Cmd+W (Close Tab)
  if (cmdCtrl && e.keyCode === 87 && !e.shiftKey) {
    e.preventDefault();
    codeService.closeTab(codeService.getActiveTabId());
  }

  // Cmd+Shift+W or Cmd+Shift+T (Restore Tab)
  if (cmdCtrl && e.shiftKey && (e.keyCode === 87 || e.keyCode === 84)) {
    e.preventDefault();
    codeService.restoreTab();
  }

  // Cmd+G (Export Gist)
  if (cmdCtrl && e.keyCode === 71 && !e.shiftKey) {
    e.preventDefault();
    openGistModal();
  }

  // Switch tabs: Cmd+Option+Arrows / Ctrl+Option+Arrows (Mac) or Ctrl+Alt+Arrows (Windows)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
  const isSwitchModifier = isMac ? ((e.metaKey && e.altKey) || (e.ctrlKey && e.altKey)) : (e.ctrlKey && e.altKey);

  if (isSwitchModifier && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    const len = tabs.value.length;
    if (len > 1) {
      const direction = e.key === 'ArrowLeft' ? -1 : 1;
      const nextIndex = (activeTabIndex.value + direction + len) % len;
      onTabChange(nextIndex);
    }
  }
};

const isGistModalVisible = ref(false);

const openGistModal = () => {
  isGistModalVisible.value = true;
};

const editingTabId = ref(null);
const editTabTitle = ref('');

const startEditTab = (tab) => {
  editingTabId.value = tab.id;
  editTabTitle.value = tab.title;
  setTimeout(() => {
    const input = document.querySelector('.tab-edit-input');
    if (input) {
      input.focus();
      input.select();
    }
  }, 0);
};

const saveEditTab = (tabId) => {
  if (editingTabId.value === tabId) {
    codeService.renameTab(tabId, editTabTitle.value);
    editingTabId.value = null;
  }
};

const cancelEditTab = () => {
  editingTabId.value = null;
};

const tabStates = ref({});

const handleOpenJsonTab = (jsonString) => {
  codeService.newTab(jsonString, 'output.json');
};

const initTabStates = () => {
  tabs.value.forEach(tab => {
    if (!tabStates.value[tab.id]) {
      tabStates.value[tab.id] = {
        worker: null,
        result: '',
        isLoading: false,
        workerStatus: 'idle',
        lastPongReceived: Date.now(),
        pingInterval: null,
        canvasVisible: false,
        canvasKey: 0,
        resizeObserver: null
      };
    }
  });
};
initTabStates(); // Initialize immediately before render

const getTabState = (tabId) => {
  return tabStates.value[tabId] || tabStates.value[tabs.value[0]?.id];
};

const activeTabState = computed(() => {
  const tab = tabs.value[activeTabIndex.value];
  return tab ? getTabState(tab.id) : null;
});



// React to settingsService changes if they occur
const currentTheme = computed(() => themeMap[settingsService.getItem('theme')] || themeMap.oneDark);

const mainStyle = computed(() => ({
  backgroundColor: currentTheme.value.bg,
  position: 'relative',
  '--tab-bg': currentTheme.value.tabBg,
  '--tab-active-bg': currentTheme.value.activeTab,
  '--tab-text': currentTheme.value.text,
  '--tab-active-text': currentTheme.value.activeText,
  '--tab-border': currentTheme.value.border,
  '--tab-border-neutral': currentTheme.value.neutralBorder
}));

const statusText = computed(() => {
  if (!activeTabState.value) return '';
  switch (activeTabState.value.workerStatus) {
    case 'idle': return 'Idle / Waiting for input...';
    case 'loading': return 'Loading packages...';
    case 'evaluating': return 'Evaluating...';
    case 'alive_async': return 'Background thread (async)';
    case 'blocked': return 'COMPUTING (CPU 100%)';
    default: return '';
  }
});

const terminate = (tabId) => {
  const state = getTabState(tabId);
  if (state.worker) {
    state.worker.terminate();
    state.worker = null;
  }
  if (state.pingInterval) {
    state.pingInterval(); // Call the cancel function returned by setSafeInterval
    state.pingInterval = null;
  }
  if (state.resizeObserver) {
    state.resizeObserver.disconnect();
    state.resizeObserver = null;
  }
  state.isLoading = false;
  state.workerStatus = 'idle';
};

const run = ({ tabId, code }) => {
  terminate(tabId);
  codeService.clearSuggestions();
  
  const state = getTabState(tabId);
  state.result = '';
  state.isLoading = false;
  state.workerStatus = 'loading';
  state.lastPongReceived = Date.now();
  state.canvasVisible = false;

  state.worker = new Worker(new URL('../file.worker.js', import.meta.url), { type: 'module' });

  state.worker.onmessage = ({ data }) => {
    if (typeof data === 'object') {
      if (data.type === 'request-canvas') {
        state.canvasVisible = true;
        state.canvasKey++;
        nextTick(() => {
          const canvasEl = document.getElementById(`canvas-${tabId}`);
          if (canvasEl) {
            try {
              const offscreen = canvasEl.transferControlToOffscreen();
              state.worker.postMessage({ type: 'resolve-canvas', canvas: offscreen }, [offscreen]);
              
              if (state.resizeObserver) {
                state.resizeObserver.disconnect();
              }
              const wrapperEl = canvasEl.parentElement;
              if (wrapperEl) {
                state.resizeObserver = new ResizeObserver((entries) => {
                  for (const entry of entries) {
                    const { width, height } = entry.contentRect;
                    if (state.worker) {
                      state.worker.postMessage({
                        type: 'canvas-resize',
                        width,
                        height
                      });
                    }
                  }
                });
                state.resizeObserver.observe(wrapperEl);
              }
            } catch (err) {
              console.error('Failed to transfer control to offscreen canvas', err);
            }
          }
        });
        return;
      }
      if (data.type === 'pong') {
        state.lastPongReceived = Date.now();
        if (data.state && state.workerStatus !== data.state) {
           state.workerStatus = data.state;
        }
        return;
      }
      if (data.type === 'worker-state') {
        state.workerStatus = data.state;
        return;
      }
      if (data.type === 'lock-dependency') {
        codeService.addSuggestion(data);
        return;
      }
      if (data.type === 'loading') {
        state.isLoading = data.state;
        if (!data.state) {
          state.workerStatus = 'evaluating';
          state.lastPongReceived = Date.now();
        }
        return;
      }
    }

    if (data === '') return;
    state.result += `${data}\n`;
  };

  state.worker.onerror = error => {
    state.result += error.message;
    state.isLoading = false;
    state.workerStatus = 'idle';
  };

  const safeSettings = JSON.parse(JSON.stringify(settingsService.get()));
  delete safeSettings.githubToken;

  state.worker.postMessage({
    code,
    settings: safeSettings,
  });

  state.pingInterval = setSafeInterval(() => {
    if (state.worker) {
      state.worker.postMessage({ type: 'ping' });
      if (Date.now() - state.lastPongReceived > 400 && state.workerStatus !== 'idle' && state.workerStatus !== 'loading') {
        state.workerStatus = 'blocked';
      }
    }
  }, 200);
};

onMounted(() => {
  codeService.ee.on('change', run);
  codeService.ee.on('tabs-changed', () => {
    updateTabs();
    initTabStates();
  });
  window.addEventListener('keydown', handleKeydown, { capture: true });
  
  // Initialize all existing tabs
  tabs.value.forEach(tab => {
    run({ tabId: tab.id, code: tab.code });
  });
});

onUnmounted(() => {
  codeService.ee.off('change', run);
  codeService.ee.off('tabs-changed', updateTabs);
  window.removeEventListener('keydown', handleKeydown, { capture: true });
  tabs.value.forEach(tab => terminate(tab.id));
});
</script>

<template>
  <main :style="mainStyle">
    <ProgressBar v-if="activeTabState?.isLoading" mode="indeterminate" style="height: 3px; position: absolute; top: 0; left: 0; width: 100%; z-index: 1000; border-radius: 0" />
    <TabView :activeIndex="activeTabIndex" @update:activeIndex="onTabChange" class="code-tabs" :class="{ 'single-tab': tabs.length === 1 }">
      <TabPanel v-for="tab in tabs" :key="tab.id">
        <template #header>
          <div class="tab-header">
            <div class="status-dot-mini" :class="getTabState(tab.id).workerStatus" :title="getTabState(tab.id).workerStatus"></div>
            <span v-if="editingTabId !== tab.id" @dblclick="startEditTab(tab)" class="tab-title-text">{{ tab.title }}</span>
            <input v-else type="text" v-model="editTabTitle" @blur="saveEditTab(tab.id)" @keyup.enter="saveEditTab(tab.id)" @keyup.esc="cancelEditTab()" class="tab-edit-input" />
            <i class="pi pi-times close-icon" @click.stop="codeService.closeTab(tab.id)" v-if="tabs.length > 1"></i>
          </div>
        </template>
        <div class="editor-container">
          <Splitter style="height: 100%" :step="50" :gutterSize="8" layout="horizontal" stateKey="instacode-splitter-state" stateStorage="local">
            <SplitterPanel class="left-pane">
              <CodeEditor :tabId="tab.id"/>
            </SplitterPanel>
            <SplitterPanel class="right-pane">
              <template v-if="getTabState(tab.id).canvasVisible">
                <Splitter layout="vertical" style="height: 100%" :gutterSize="8" stateKey="instacode-canvas-splitter" stateStorage="local">
                  <SplitterPanel :size="50" class="canvas-panel">
                    <div class="canvas-wrapper">
                      <canvas :id="`canvas-${tab.id}`" :key="getTabState(tab.id).canvasKey" class="instacode-canvas"></canvas>
                    </div>
                  </SplitterPanel>
                  <SplitterPanel :size="50" style="overflow: auto">
                    <ResultCode 
                      :data="getTabState(tab.id).result" 
                      :status="getTabState(tab.id).workerStatus"
                      @open-new-tab="handleOpenJsonTab"
                    />
                  </SplitterPanel>
                </Splitter>
              </template>
              <template v-else>
                <ResultCode 
                  :data="getTabState(tab.id).result" 
                  :status="getTabState(tab.id).workerStatus"
                  @open-new-tab="handleOpenJsonTab"
                />
              </template>
            </SplitterPanel>
          </Splitter>
        </div>
      </TabPanel>
    </TabView>

    <div class="worker-status" v-if="activeTabState">
      <div class="status-dot" :class="activeTabState.workerStatus"></div>
      <span>{{ statusText }}</span>
    </div>

    <GistExportModal 
      :visible="isGistModalVisible" 
      :tabTitle="tabs[activeTabIndex]?.title"
      :tabCode="tabs[activeTabIndex]?.code"
      @close="isGistModalVisible = false"
    />
  </main>
</template>

<style scoped>
main {
  height: 100%;
}

.left-pane {
  overflow-x: auto;
}

.right-pane {
  overflow-x: auto;
  overflow-y: auto;
  outline-width: 0;
}

.worker-status {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  z-index: 1000;
  pointer-events: none;
  font-family: monospace;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-dot.idle { background: #4caf50; }
.status-dot.loading { background: #2196f3; animation: pulse 1s infinite; }
.status-dot.evaluating { background: #2196f3; animation: pulse 1s infinite; }
.status-dot.alive_async { background: #2196f3; }
.status-dot.blocked { background: #f44336; animation: blink 0.4s infinite; }

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0.2; }
  100% { opacity: 1; }
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-header span.tab-title-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
  display: inline-block;
  user-select: none;
}

.tab-edit-input {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--tab-border);
  color: var(--tab-active-text);
  border-radius: 4px;
  padding: 0 4px;
  font-size: 0.85rem;
  width: 120px;
  outline: none;
}

.status-dot-mini {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #4caf50;
  transition: background-color 0.3s;
}
.status-dot-mini.idle { background-color: #4caf50; }
.status-dot-mini.loading { background-color: #2196f3; animation: pulse 1s infinite; }
.status-dot-mini.evaluating { background-color: #2196f3; animation: pulse 1s infinite; }
.status-dot-mini.alive_async { background-color: #2196f3; }
.status-dot-mini.blocked { background-color: #f44336; animation: blink 0.4s infinite; }

.close-icon {
  font-size: 0.8rem;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;
}
.close-icon:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ff5252;
}

.editor-container {
  height: 100%;
}

.canvas-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e1e1e;
  overflow: hidden;
  padding: 16px;
  position: relative;
}

.canvas-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.instacode-canvas {
  background: #ffffff;
  max-width: 100%;
  max-height: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  object-fit: contain;
}
</style>
<style>
.p-splitter {
  border: none !important;
  background: transparent !important;
}
.p-splitter-gutter {
  outline-width: 0;
  background: var(--tab-border) !important;
  opacity: 0.15;
  transition: opacity 0.2s;
}
.p-splitter-gutter:hover,
.p-splitter-gutter:active {
  opacity: 0.4;
}
.p-splitter-gutter-handle:focus {
  box-shadow: none !important;
}

/* TabView overrides for full height editor */
.code-tabs.p-tabview {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.code-tabs.single-tab .p-tabview-nav-container {
  display: none !important;
}
.code-tabs.single-tab .p-tabview-panels {
  height: 100% !important;
}
.code-tabs .p-tabview-panels {
  flex: 1;
  padding: 0;
  height: calc(100% - 34px); /* Adjusted for new smaller tab header height */
  overflow: hidden;
  background: transparent;
}
.code-tabs .p-tabview-panel {
  height: 100%;
}
.code-tabs .p-tabview-nav-content {
  border-bottom: 1px solid var(--tab-border-neutral);
}

.code-tabs .p-tabview-ink-bar {
  display: none !important;
}

.code-tabs .p-tabview-nav {
  display: flex;
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  background: var(--tab-bg) !important;
  border-bottom: 1px solid var(--tab-border-neutral) !important;
}

.code-tabs .p-tabview-nav::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.code-tabs .p-tabview-nav-link {
  background: var(--tab-bg) !important;
  color: var(--tab-text) !important;
  border: none !important;
  border-bottom: 2px solid transparent !important;
  border-radius: 0 !important;
  transition: all 0.2s ease;
}
.code-tabs .p-tabview-nav-link:hover {
  color: var(--tab-active-text) !important;
}
.code-tabs .p-tabview-header.p-highlight .p-tabview-nav-link {
  background: var(--tab-active-bg) !important;
  color: var(--tab-active-text) !important;
  border-bottom: 2px solid var(--tab-border) !important;
}

/* Close icon styling to match text */
.code-tabs .p-tabview-nav-link .close-icon {
  color: var(--tab-text);
  opacity: 0.6;
}
.code-tabs .p-tabview-header.p-highlight .p-tabview-nav-link .close-icon {
  color: var(--tab-active-text);
  opacity: 0.8;
}
.code-tabs .p-tabview-nav-link .close-icon:hover {
  opacity: 1;
  color: #ff5252 !important;
}
</style>
