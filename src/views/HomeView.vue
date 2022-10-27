<script>

import Worker from '../file.worker.js?worker';
const worker = new Worker();

// const lodash = await fetch('https://registry.npmjs.org/lodash');

import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';

import { defineComponent, shallowRef } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'


export default defineComponent({
  components: {
    Codemirror,
    Splitter, SplitterPanel,
  },
  setup() {
    const code = `console.log('Hello, world!')`;
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
      log: console.log,
    }
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
</style>

<style>
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
          @change="log('change', $event)"
          @focus="log('focus', $event)"
          @blur="log('blur', $event)"
        />
      </SplitterPanel>
      <SplitterPanel class="right-pane">
        <pre>Right Pane</pre>
      </SplitterPanel>
    </Splitter>
  </main>
</template>
