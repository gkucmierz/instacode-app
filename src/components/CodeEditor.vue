<script setup>
import { shallowRef, ref } from 'vue';

import { Codemirror } from 'vue-codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import * as allThemes from '@uiw/codemirror-themes-all';
import settingsService from '../services/settingsService';
import { linter, forceLinting } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import { getPackageExports } from '../services/PackageManager.js';

import codeService from '../services/codeService.mjs';

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

import { computed } from 'vue';

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

const myCompletions = async (context) => {
  const line = context.state.doc.lineAt(context.pos);
  const text = line.text;
  
  const importRegex = /^import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/;
  const match = importRegex.exec(text);
  
  if (match) {
    const pkgName = match[2];
    const braceStart = text.indexOf('{');
    const braceEnd = text.indexOf('}');
    const cursorInLine = context.pos - line.from;
    
    if (cursorInLine > braceStart && (braceEnd === -1 || cursorInLine <= braceEnd)) {
      let word = context.matchBefore(/[\w]*/);
      if (word.from === word.to && !context.explicit) return null;
      
      const cdns = settingsService.getItem('cdns') || [];
      const exportsList = await getPackageExports(pkgName, 'latest', cdns);
      
      return {
        from: word.from,
        options: exportsList.map(e => ({
          label: e,
          type: "variable",
          info: `from ${pkgName}`
        }))
      };
    }
  }
  return null;
};

const props = defineProps({
  tabId: String
});

const extensions = computed(() => [javascript(), currentTheme.value, myLinter, customTheme, autocompletion(), javascriptLanguage.data.of({ autocomplete: myCompletions })]);
const view = shallowRef();
const code = ref(codeService.getTab(props.tabId)?.code || '');

const handleReady = payload => {
  view.value = payload.view;
};

import { onMounted, onUnmounted, watch } from 'vue';

const syncCode = (newCode) => {
  if (code.value !== newCode) {
    code.value = newCode;
  }
};

watch(code, (newCode) => {
  codeService.change(newCode, props.tabId);
});

const handleSuggestionsChanged = () => {
  if (view.value) forceLinting(view.value);
};

onMounted(() => {
  codeService.ee.on(`change:${props.tabId}`, syncCode);
  codeService.ee.on('suggestions-changed', handleSuggestionsChanged);
});

onUnmounted(() => {
  codeService.ee.off(`change:${props.tabId}`, syncCode);
  codeService.ee.off('suggestions-changed', handleSuggestionsChanged);
});
</script>

<template>
  <div class="code">
    <codemirror
      v-model="code"
      placeholder="Code goes here..."
      :style="{ height: '100%' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
      @ready="handleReady"
    />
  </div>
</template>

<style scoped>
.code {
  height: 100%;
}
</style>
