<script>
import { defineComponent } from 'vue';
import settingsService from '../services/settingsService';

export default defineComponent({
  name: 'ResultCode',
  props: [
    'data'
  ],
  watch: {
    data() {
      if (!settingsService.getItem('autoScroll')) return;
      const div = this.$refs.div;
      setTimeout(() => div.scrollTo(0, div.scrollHeight), 1);
    },
  }
});
</script>

<style lang="scss" scoped>
.result-code {
  overflow-x: auto;
  overflow-y: auto;
  margin: 0;
  padding: 8px;
  height: 100%;
  display: block;
  font-family: monospace;
  white-space: pre;
  line-height: normal;

  pre {
    margin-top: 0;
  }
}
</style>

<template>
  <div class="result-code" ref="div">
    <pre class="selectable">{{ data }}</pre>
  </div>
</template>
