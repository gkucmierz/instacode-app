<script setup>
import { ref, watch, shallowRef } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import * as allThemes from '@uiw/codemirror-themes-all';
import { EditorState } from '@codemirror/state';
import settingsService from '../services/settingsService';

const themesMap = {
  oneDark,
  dracula: allThemes.dracula,
  githubDark: allThemes.githubDark,
  githubLight: allThemes.githubLight,
  nord: allThemes.nord,
  monokai: allThemes.monokai,
  material: allThemes.material,
  eclipse: allThemes.eclipse
};

const currentTheme = themesMap[settingsService.getItem('theme')] || oneDark;
const extensions = [currentTheme, EditorState.readOnly.of(true)];

const props = defineProps(['data']);
const view = shallowRef(null);

const handleReady = payload => {
  view.value = payload.view;
};

watch(() => props.data, () => {
  if (!settingsService.getItem('autoScroll')) return;
  setTimeout(() => {
    if (view.value) {
      // Scroll CodeMirror to the bottom
      const docHeight = view.value.contentDOM.scrollHeight;
      view.value.scrollDOM.scrollTo(0, docHeight);
    }
  }, 1);
});
</script>

<template>
  <div class="result-code">
    <codemirror
      :modelValue="data"
      :style="{ height: '100%' }"
      :extensions="extensions"
      @ready="handleReady"
    />
  </div>
</template>

<style lang="scss" scoped>
.result-code {
  margin: 0;
  height: 100%;
  display: block;
  font-family: monospace;
}

:deep(.cm-editor) {
  height: 100%;
  outline: none !important;
}

:deep(.cm-scroller) {
  font-family: monospace;
}

:deep(.cm-gutters) {
  display: none !important;
}
</style>
