<script>
import { defineComponent, shallowRef } from 'vue';

import { Codemirror } from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

export default defineComponent({
  name: 'CodeEditor',
  props: {
    code: String,
  },
  components: {
    Codemirror,
  },
  data() {
    const extensions = [javascript(), oneDark]

    // Codemirror EditorView instance ref
    const view = shallowRef();
    const handleReady = payload => {
      view.value = payload.view;
    };

    // Status is available at all times via Codemirror EditorView
    // const getCodemirrorStates = () => {
    //   const state = view.value.state;
    //   const ranges = state.selection.ranges;
    //   const selected = ranges.reduce((r, range) => r + range.to - range.from, 0);
    //   const cursor = ranges[0].anchor;
    //   const length = state.doc.length;
    //   const lines = state.doc.lines;
    //   // more state info ...
    //   // return ...
    // }

    return {
      extensions,
      handleReady,
    }
  },
});
</script>

<style scoped>
.code {
  height: 100%;
}
</style>

<template>
  <div class="code">
    <codemirror
      :modelValue="code"
      placeholder="Code goes here..."
      :style="{ height: '100%' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
      @ready="handleReady"
      @change="$emit('change', $event)"
    />
  </div>
</template>
