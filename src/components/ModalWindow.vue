<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ModalWindow',
  props: {
    visible: Boolean,
  },
  data() {
    window.addEventListener('keydown', e => {
      if (!e) e = event;
      if (!this.visible) return;
      const ESC_KEY = 27;
      if (e.keyCode === ESC_KEY) {
        this.$emit('close');
        e.preventDefault();
        e.stopPropagation();
      }
    });
    return {};
  },
});
</script>

<style lang="scss" scoped>

$padding: 12px;

.modal-window {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  padding: 0;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  display: flex;
  justify-content: center;
  align-items: center;

  visibility: hidden;
  &.visible {
    visibility: visible;
  }

  .window {
    padding: $padding $padding * 4;
    border-radius: $padding * 2;
    // height: calc(100% - 100px);
    // width: calc(100% - 100px);
    line-height: 1.5;
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(32, 32, 32, 0.6);
    overflow-y: auto;
  }
}
</style>

<template>
  <div
    class="modal-window"
    :class="{ visible: this.visible }"
    @click="$emit('close')"
  >
    <div class="window" @click.stop>
      <div class="header">
        <slot name="header" />
      </div>
      <div class="body">
        <slot name="body" />
      </div>
      <div class="footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
