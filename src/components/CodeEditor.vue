<script setup>
import { shallowRef, ref } from 'vue';

import { Codemirror } from 'vue-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import * as allThemes from '@uiw/codemirror-themes-all';
import settingsService from '../services/settingsService';
import { linter, forceLinting } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';

import codeService from '../services/codeService';

const myLinter = linter((view) => {
  const suggestions = codeService.getSuggestions();
  if (!suggestions.length) return [];

  const diagnostics = [];
  for (const s of suggestions) {
    try {
      const lineObj = view.state.doc.line(s.line);
      diagnostics.push({
        from: lineObj.from,
        to: lineObj.to,
        severity: "info",
        message: `Unlocked dependency detected. Lock ${s.name} to ${s.resolvedVersion}?`,
        actions: [{
          name: "Lock",
          apply(view, from, to) {
            const lineStr = view.state.doc.sliceString(from, to);
            let replacement = lineStr;
            if (s.isRequire) {
              const quotePattern = `['"\`]${s.name}['"\`]`;
              const reqRegex = new RegExp(`require\\s*\\(\\s*${quotePattern}\\s*\\)`);
              if (reqRegex.test(lineStr)) {
                replacement = lineStr.replace(reqRegex, `$& /* @${s.resolvedVersion} */`);
              } else {
                replacement += ` // @${s.resolvedVersion}`;
              }
            } else {
              replacement += ` // @${s.resolvedVersion}`;
            }
            view.dispatch({ changes: { from, to, insert: replacement } });
            codeService.removeSuggestion(s);
          }
        }]
      });
    } catch (e) {
      // ignore
    }
  }
  return diagnostics;
});

const customTheme = EditorView.theme({
  "& .cm-diagnosticAction": {
    backgroundColor: "#10b981", // Emerald Green
    color: "white",
    border: "none",
    padding: "3px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s ease, transform 0.1s ease",
    marginLeft: "10px"
  },
  "& .cm-diagnosticAction:hover": {
    backgroundColor: "#059669",
    transform: "scale(1.02)"
  },
  "& .cm-diagnosticAction:active": {
    transform: "scale(0.98)"
  }
});

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

const extensions = [javascript(), currentTheme, myLinter, customTheme];
const view = shallowRef();
const code = ref(codeService.get());

const handleReady = payload => {
  view.value = payload.view;
};

const change = (newCode) => {
  codeService.change(newCode);
};

import { onMounted, onUnmounted } from 'vue';

const syncCode = (newCode) => {
  if (code.value !== newCode) {
    code.value = newCode;
  }
};

const handleSuggestionsChanged = () => {
  if (view.value) forceLinting(view.value);
};

onMounted(() => {
  codeService.ee.on('change', syncCode);
  codeService.ee.on('suggestions-changed', handleSuggestionsChanged);
});

onUnmounted(() => {
  codeService.ee.off('change', syncCode);
  codeService.ee.off('suggestions-changed', handleSuggestionsChanged);
});
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
