<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import HelpModal from './components/HelpModal.vue';
import ShareModal from './components/ShareModal.vue';
import AboutModal from './components/AboutModal.vue';
import PwaReloadPrompt from './components/PwaReloadPrompt.vue';
import settingsService from './services/settingsService';

const showHelp = ref(false);
const showShare = ref(false);
const showAbout = ref(false);
const router = useRouter();

const settings = settingsService.get();

watch(() => settings.uiDensity, (newDensity) => {
  document.documentElement.dataset.uiDensity = newDensity || 'compact';
}, { immediate: true });

const handleKeydown = (e) => {
  if (!e) e = window.event;
  const COMMA_CODE = 188;
  const QUESTION_MARK_CODE = 191;
  const S_KEY_CODE = 83;
  const H_KEY_CODE = 72;
  const I_KEY_CODE = 73;

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
  if (cmdCtrl && e.keyCode === I_KEY_CODE) {
    showAbout.value = !showAbout.value;
    e.preventDefault();
    e.stopPropagation();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown, { capture: true });
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown, { capture: true });
});
</script>

<template>
  <HelpModal :visible="showHelp" @close="showHelp = false" />
  <ShareModal :visible="showShare" @close="showShare = false" />
  <AboutModal :visible="showAbout" @close="showAbout = false" />
  <PwaReloadPrompt />
  <RouterView v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </RouterView>
</template>

<style lang="scss" scoped>
</style>
