<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import HelpModal from './components/HelpModal.vue';
import ShareModal from './components/ShareModal.vue';

const showHelp = ref(false);
const showShare = ref(false);
const router = useRouter();

const handleKeydown = (e) => {
  if (!e) e = window.event;
  const COMMA_CODE = 188;
  const QUESTION_MARK_CODE = 191;
  const S_KEY_CODE = 83;
  const H_KEY_CODE = 72;

  const cmdCtrl = e.ctrlKey || e.metaKey;

  if (cmdCtrl && e.keyCode === S_KEY_CODE) {
    showShare.value = !showShare.value;
    e.preventDefault();
    e.stopPropagation();
  }
  if (cmdCtrl && e.keyCode === COMMA_CODE) {
    router.push({ name: 'settings' });
    e.preventDefault();
    e.stopPropagation();
  }
  if (cmdCtrl && (e.keyCode === H_KEY_CODE || (e.shiftKey && e.keyCode === QUESTION_MARK_CODE))) {
    showHelp.value = !showHelp.value;
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
  <HelpModal :visible="showHelp" @close="showHelp = false" />
  <ShareModal :visible="showShare" @close="showShare = false" />
  <RouterView />
</template>

<style lang="scss" scoped>
</style>
