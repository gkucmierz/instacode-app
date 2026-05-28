<script setup>
import { watch, shallowRef, computed } from 'vue';
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

const currentTheme = computed(() => themesMap[settingsService.getItem('theme')] || oneDark);
const extensions = computed(() => [currentTheme.value, EditorState.readOnly.of(true)]);

const props = defineProps(['data', 'status']);
const emit = defineEmits(['open-new-tab']);
const view = shallowRef(null);

const handleReady = payload => {
  view.value = payload.view;
};

const parsedJson = computed(() => {
  // Prevent JSON parsing overhead during active worker execution
  // to avoid choking the main thread with heavy output.
  if (props.status !== 'idle') return null;
  if (!props.data || typeof props.data !== 'string') return null;
  const trimmed = props.data.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  
  try {
    const obj = JSON.parse(trimmed);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    // Maybe JSONL?
    try {
      const lines = trimmed.split('\n').filter(l => l.trim());
      if (lines.length > 1) {
        const objs = lines.map(l => JSON.parse(l));
        return JSON.stringify(objs, null, 2);
      }
    } catch (e2) {
      // Ignored: Not a valid JSON Lines (JSONL) format, proceed to fallback
    }
    
    // Fallback: JS object syntax from javascript-stringify
    try {
      // Evaluate string as a JS expression (safe here since it's just the stringified output of user's own code)
      const obj = new Function('return ' + trimmed)();
      if (obj && typeof obj === 'object') {
        return JSON.stringify(obj, null, 2);
      }
    } catch (e3) {
      return null;
    }
  }
  return null;
});

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
    <div v-if="parsedJson" class="json-actions">
      <button class="json-btn" @click="emit('open-new-tab', parsedJson)" title="Format and open in new tab">
        <i class="pi pi-external-link"></i> Open JSON
      </button>
    </div>
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
  position: relative;
}

.json-actions {
  position: absolute;
  top: 8px;
  right: 16px;
  z-index: 10;
}

.json-btn {
  background: rgba(40, 44, 52, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #abb2bf;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(4px);
  transition: all 0.2s;
  
  &:hover {
    background: rgba(60, 64, 72, 0.9);
    color: #fff;
  }
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
