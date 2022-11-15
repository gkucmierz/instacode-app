<script>

import Worker from '../file.worker.js?worker';
// const worker = new Worker();

// const lodash = await fetch('https://registry.npmjs.org/lodash');

import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';

import { defineComponent, shallowRef } from 'vue';
import { Codemirror } from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

export default defineComponent({
  components: {
    Codemirror,
    Splitter, SplitterPanel,
  },
  data() {
    const code = `
'Hello World!';

new Array(10).fill(0).map((_, i) => '#'.repeat(i+1));

2n ** 42n;

for (let i = 0; i < 42; ++i) {
  console.log(i);
}

`;
    const extensions = [javascript(), oneDark]

    // Codemirror EditorView instance ref
    const view = shallowRef()
    const handleReady = (payload) => {
      view.value = payload.view
    }

    // Status is available at all times via Codemirror EditorView
    const getCodemirrorStates = () => {
      const state = view.value.state
      const ranges = state.selection.ranges
      const selected = ranges.reduce((r, range) => r + range.to - range.from, 0)
      const cursor = ranges[0].anchor
      const length = state.doc.length
      const lines = state.doc.lines
      // more state info ...
      // return ...
    }

    return {
      code,
      extensions,
      handleReady,
      log: _ => _, // console.log,
      worker: null,
      result: '',
    }
  },
  mounted() {
    this.run(this.code);
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

      this.worker.postMessage(code);
    },
    terminate() {
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    },
  }
})

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

.result {
  overflow-x: auto;
  overflow-y: auto;
  margin: 0;
  padding: 8px;
  height: 100%;
  display: block;
  font-family: monospace;
  white-space: pre;
  line-height: normal;
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
        <codemirror
          v-model="code"
          placeholder="Code goes here..."
          :style="{ height: '100%' }"
          :autofocus="true"
          :indent-with-tab="true"
          :tab-size="2"
          :extensions="extensions"
          @ready="handleReady"
          @change="run($event)"
          @focus="log('focus', $event)"
          @blur="log('blur', $event)"
        />
      </SplitterPanel>
      <SplitterPanel class="right-pane">
        <pre class="result">{{ result }}</pre>
      </SplitterPanel>
    </Splitter>
  </main>
</template>
