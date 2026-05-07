<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

import ResultCode from '../components/ResultCode.vue';
import CodeEditor from '../components/CodeEditor.vue';
import settingsService from '../services/settingsService';
import codeService from '../services/codeService';

import Worker from '../file.worker.js?worker';

import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import ProgressBar from 'primevue/progressbar';

const worker = ref(null);
const result = ref('');
const isLoading = ref(false);
const workerStatus = ref('idle');
let lastPongReceived = Date.now();
let pingInterval = null;

const statusText = computed(() => {
  switch (workerStatus.value) {
    case 'idle': return 'Ready';
    case 'loading': return 'Loading packages...';
    case 'evaluating': return 'Evaluating...';
    case 'alive_async': return 'Background thread (async)';
    case 'blocked': return 'COMPUTING (CPU 100%)';
    default: return '';
  }
});

const terminate = () => {
  if (worker.value) {
    worker.value.terminate();
    worker.value = null;
  }
};

const run = (code) => {
  terminate();
  codeService.clearSuggestions();
  result.value = '';
  isLoading.value = true;
  workerStatus.value = 'loading';
  lastPongReceived = Date.now();

  worker.value = new Worker();

  worker.value.onmessage = ({ data }) => {
    if (typeof data === 'object') {
      if (data.type === 'pong') {
        lastPongReceived = Date.now();
        if (workerStatus.value === 'blocked') {
           workerStatus.value = 'evaluating';
        }
        return;
      }
      if (data.type === 'worker-state') {
        workerStatus.value = data.state;
        return;
      }
      if (data.type === 'lock-dependency') {
        codeService.addSuggestion(data);
        return;
      }
      if (data.type === 'loading') {
        isLoading.value = data.state;
        if (!data.state) {
          workerStatus.value = 'evaluating';
          lastPongReceived = Date.now();
        }
        return;
      }
    }

    if (data === '') return;
    result.value += `${data}\n`;
  };

  worker.value.onerror = error => {
    result.value += error.message;
  };

  worker.value.postMessage({
    code,
    settings: settingsService.get(),
  });
};

onMounted(() => {
  codeService.ee.on('change', run);
  run(codeService.get());

  pingInterval = setInterval(() => {
    if (worker.value) {
      worker.value.postMessage({ type: 'ping' });
      if (Date.now() - lastPongReceived > 400 && workerStatus.value !== 'idle' && workerStatus.value !== 'loading') {
        workerStatus.value = 'blocked';
      }
    }
  }, 200);
});

onUnmounted(() => {
  codeService.ee.off('change', run);
  terminate();
  clearInterval(pingInterval);
});
</script>

<template>
  <main style="position: relative">
    <ProgressBar v-if="isLoading" mode="indeterminate" style="height: 3px; position: absolute; top: 0; left: 0; width: 100%; z-index: 1000; border-radius: 0" />
    <Splitter style="height: 100%" :step="50" :gutterSize="8" layout="horizontal">
      <SplitterPanel class="left-pane">
        <CodeEditor/>
      </SplitterPanel>
      <SplitterPanel class="right-pane">
        <ResultCode :data="result"/>
      </SplitterPanel>
    </Splitter>

    <div class="worker-status" v-if="workerStatus !== 'idle'">
      <div class="status-dot" :class="workerStatus"></div>
      <span>{{ statusText }}</span>
    </div>
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
</style>
<style>
.p-splitter {
  border: none !important;
}
.p-splitter-gutter {
  outline-width: 0;
}
.p-splitter-gutter-handle:focus {
  box-shadow: none !important;
}
</style>
