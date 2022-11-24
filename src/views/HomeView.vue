<script>

import ResultCode from '../components/ResultCode.vue';
import CodeEditor from '../components/CodeEditor.vue';
import settingsService from '../services/settingsService';
import codeService from '../services/codeService';

import Worker from '../file.worker.js?worker';

// const lodash = await fetch('https://registry.npmjs.org/lodash');

import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';

import { defineComponent } from 'vue';

export default defineComponent({
  components: {
    Splitter, SplitterPanel,
    ResultCode, CodeEditor,
  },
  data() {
    codeService.ee.on('change', code => this.run(code));
    return {
      worker: null,
      result: '',
    }
  },
  mounted() {
    this.run(codeService.get());
  },
  methods: {
    run(code) {
      this.terminate();
      this.result = '';

      this.worker = new Worker();

      this.worker.onmessage = ({ data }) => {
        if (data === '') return;
        this.result += `${data}\n`;
      };

      this.worker.onerror = error => {
        this.result += error.message;
      };

      this.worker.postMessage({
        code,
        settings: settingsService.get(),
      });
    },
    terminate() {
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    },
  }
});
</script>

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
