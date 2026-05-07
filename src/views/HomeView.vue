<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

import ResultCode from '../components/ResultCode.vue';
import CodeEditor from '../components/CodeEditor.vue';
import settingsService from '../services/settingsService';
import codeService from '../services/codeService';

import Worker from '../file.worker.js?worker';

import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';

const worker = ref(null);
const result = ref('');

const terminate = () => {
  if (worker.value) {
    worker.value.terminate();
    worker.value = null;
  }
};

const run = (code) => {
  terminate();
  result.value = '';

  worker.value = new Worker();

  worker.value.onmessage = ({ data }) => {
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
});

onUnmounted(() => {
  codeService.ee.off('change', run);
  terminate();
});
</script>

<template>
  <main>
    <Splitter style="height: 100%" :step="50" :gutterSize="8" layout="horizontal">
      <SplitterPanel class="left-pane">
        <CodeEditor/>
      </SplitterPanel>
      <SplitterPanel class="right-pane">
        <ResultCode :data="result"/>
      </SplitterPanel>
    </Splitter>
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
