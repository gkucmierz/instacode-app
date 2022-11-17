<script>

import { WELCOME_CODE, STORAGE_KEY_CODE } from '../app.config';
import Result from '../components/Result.vue';
import Code from '../components/Code.vue';
import settingsService from '../services/settingsService';

import Worker from '../file.worker.js?worker';

// const lodash = await fetch('https://registry.npmjs.org/lodash');

import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';

import { defineComponent, shallowRef } from 'vue';

export default defineComponent({
  components: {
    Splitter, SplitterPanel,
    Result, Code,
  },
  data() {
    const lsCode = localStorage.getItem(STORAGE_KEY_CODE);
    const code = { value: lsCode ? lsCode : WELCOME_CODE };

    return {
      code,
      worker: null,
      result: '',
    }
  },
  mounted() {
    this.run(this.code.value);
  },
  methods: {
    save(code) {
      localStorage.setItem(STORAGE_KEY_CODE, code);
    },
    change(code) {
      this.run(code);
      setTimeout(() => this.save(code), 1);
    },
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

<template>
  <main>
    <Splitter style="height: 100%" :step="50" :gutterSize="8" layout="horizontal">
      <SplitterPanel class="left-pane">
        <Code :code="code" @change="change($event)"/>
      </SplitterPanel>
      <SplitterPanel class="right-pane">
        <Result :data="result"/>
      </SplitterPanel>
    </Splitter>
  </main>
</template>
