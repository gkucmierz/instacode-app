<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Help',
  props: {
    visible: Boolean,
  },
});
</script>

<style scoped>
.help {
  visibility: hidden;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  padding: 0;
  backdrop-filter: blur(4px);

  display: flex;
  justify-content: center;
  align-items: center;
}
.help.visible {
  visibility: visible;
}

.window {
  padding: 12px 24px;
  border-radius: 24px;
  height: calc(100% - 100px);
  width: calc(100% - 100px);
  line-height: 1.5;
  font-family: monospace;
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(32, 32, 32, 0.6);
  overflow-y: auto;
}

ul {
  list-style-type: none;
  padding: 0;
}

b {
  color: #8f8;
}
</style>

<template>
  <div
    class="help"
    :class="{ visible: this.visible }"
    @click="$emit('close')"
  >
    <div class="window" @click.stop>
      <div class="header">
        <h3>Keyboard Shorcuts</h3>
      </div>
      <div class="content">
        <!-- ⌘ ⇧ ⌥ ⌃ ⇪ -->
        <ul>
          <li>
            <b>⌘Command-Comma (,)</b> - open app settings
          </li>
          <li>
            <b>⌘Command-Shift-?</b> - show this help window
          </li>
          <li>
            <b>⌃Control-Comma (,)</b> - open app settings
          </li>
          <li>
            <b>⌃Control-Shift-?</b> - show this help window
          </li>
          <li>
            <b>ESC</b> - close window
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
