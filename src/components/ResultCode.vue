<script setup>
import { ref, watch } from 'vue';
import settingsService from '../services/settingsService';

const props = defineProps(['data']);
const div = ref(null);

watch(() => props.data, () => {
  if (!settingsService.getItem('autoScroll')) return;
  setTimeout(() => {
    if (div.value) {
      div.value.scrollTo(0, div.value.scrollHeight);
    }
  }, 1);
});
</script>

<template>
  <div class="result-code" ref="div">
    <pre class="selectable">{{ data }}</pre>
  </div>
</template>

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
