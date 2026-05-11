<script setup>
import { ref, onMounted } from 'vue';
import ModalWindow from './ModalWindow.vue';

defineProps({
  visible: Boolean,
});

defineEmits(['close']);

const isMac = ref(true);

onMounted(() => {
  isMac.value = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
});
</script>

<template>
  <div class="help-modal">
    <ModalWindow :visible="visible" @close="$emit('close')">
      <template #header>
        <div class="header-content">
          <h3>Keyboard Shortcuts</h3>
          <div class="os-toggle">
            <button :class="{ active: isMac }" @click="isMac = true">Mac</button>
            <button :class="{ active: !isMac }" @click="isMac = false">Win</button>
          </div>
        </div>
      </template>
      <template #body>
        <ul>
          <li>
            <div class="shortcut-keys">
              <kbd v-if="isMac">⌘ Cmd</kbd><kbd v-else>Ctrl</kbd>
              <span class="plus">+</span>
              <kbd>,</kbd>
            </div>
            <span class="desc">&mdash; open app settings</span>
          </li>
          <li>
            <div class="shortcut-keys">
              <kbd v-if="isMac">⌘ Cmd</kbd><kbd v-else>Ctrl</kbd>
              <span class="plus">+</span>
              <kbd>h</kbd>
            </div>
            <span class="desc">
              &mdash; show this help window
              <span class="alt-key">(or <kbd v-if="isMac">⌘ Cmd</kbd><kbd v-else>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>?</kbd>)</span>
            </span>
          </li>
          <li>
            <div class="shortcut-keys">
              <kbd v-if="isMac">⌘ Cmd</kbd><kbd v-else>Ctrl</kbd>
              <span class="plus">+</span>
              <kbd>s</kbd>
            </div>
            <span class="desc">&mdash; open share code modal</span>
          </li>
          <li>
            <div class="shortcut-keys">
              <kbd>ESC</kbd>
            </div>
            <span class="desc">&mdash; close window</span>
          </li>
        </ul>
      </template>
      <!-- <template #footer>
        <button @click="showModal = false">close</button>
      </template> -->
    </ModalWindow>
  </div>
</template>

<style lang="scss" scoped>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
  }
}

.os-toggle {
  display: flex;
  background: #161b22;
  border-radius: 6px;
  padding: 2px;
  border: 1px solid #30363d;

  button {
    background: transparent;
    border: none;
    color: #8b949e;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      color: #c9d1d9;
    }

    &.active {
      background: #21262d;
      color: #c9d1d9;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
  }
}

ul {
  list-style-type: none;
  padding: 0;
  display: table;
  margin: 0 auto;

  li {
    display: table-row;

    .shortcut-keys {
      display: table-cell;
      text-align: right;
      padding-right: 12px;
      padding-bottom: 12px;
      white-space: nowrap;
      vertical-align: middle;

      .plus {
        display: inline-block;
        padding: 0 6px;
        color: #666;
        font-size: 0.9em;
      }
    }
    .desc {
      display: table-cell;
      text-align: left;
      padding-bottom: 12px;
      vertical-align: middle;
      color: #aaa;
    }
  }
}

kbd {
  display: inline-block;
  padding: 3px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85em;
  font-weight: 600;
  color: #8f8;
  background-color: #161b22;
  border: 1px solid #30363d;
  border-bottom-color: #8b949e;
  border-radius: 6px;
  box-shadow: inset 0 -1px 0 #8b949e;
  line-height: 1.2;
}

.alt-key {
  font-size: 0.9em;
  color: #777;
  margin-left: 6px;
  
  kbd {
    padding: 2px 4px;
    font-size: 0.8em;
  }
}
</style>
