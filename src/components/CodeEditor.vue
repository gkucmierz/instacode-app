<script setup>
import { shallowRef, ref } from 'vue';

import { Codemirror } from 'vue-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

import codeService from '../services/codeService';

const extensions = [javascript(), oneDark];
const view = shallowRef();
const code = ref(codeService.get());

const handleReady = payload => {
  view.value = payload.view;
};

const change = (newCode) => {
  codeService.change(newCode);
};
</script>

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
      @change="change($event)"
    />
  </div>
</template>

<style scoped>
.code {
  height: 100%;
}
</style>
