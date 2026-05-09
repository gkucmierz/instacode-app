<script setup>
import { onMounted, onUnmounted } from 'vue';

const props = defineProps({
  visible: Boolean,
});

const emit = defineEmits(['close']);

const handleKeydown = (e) => {
  if (!e) e = window.event;
  if (!props.visible) return;
  const ESC_KEY = 27;
  if (e.keyCode === ESC_KEY) {
    emit('close');
    e.preventDefault();
    e.stopPropagation();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div
      class="modal-window"
      :class="{ visible: visible }"
      @click="emit('close')"
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
  </Teleport>
</template>

<style lang="scss" scoped>

$padding: 12px;

.modal-window {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  padding: 0;
  backdrop-filter: blur(4px);

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
