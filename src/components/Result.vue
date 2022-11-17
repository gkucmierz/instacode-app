<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Result',
  props: [
    'data'
  ],
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
  <div class="result">
    <pre>{{ data }}</pre>
  </div>
</template>
