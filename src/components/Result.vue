<script>
import { defineComponent } from 'vue';
import settingsService from '../services/settingsService';

export default defineComponent({
  name: 'Result',
  props: [
    'data'
  ],
  watch: {
    data(val) {
      if (!settingsService.getItem('autoScroll')) return;
      const pre = this.$refs.pre;
      setTimeout(() => pre.scrollTo(0, pre.scrollHeight), 1);
    },
  }
});
</script>

<style scoped>
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

<template>
  <div class="result" ref="pre">
    <pre class="selectable">{{ data }}</pre>
  </div>
</template>
