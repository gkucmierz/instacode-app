<script>
import { defineComponent } from 'vue';
import HelpModal from './components/HelpModal.vue';
import ShareModal from './components/ShareModal.vue';

import Analytics from 'analytics';
import googleAnalytics from '@analytics/google-analytics';

const analytics = Analytics({
  app: 'instacode-app',
  plugins: [googleAnalytics({ measurementIds: ['G-919025NJDJ'] })]
});

analytics.page();

export default defineComponent({
  components: {
    HelpModal,
    ShareModal,
  },
  data() {
    window.addEventListener('keydown', e => {
      if (!e) e = event;
      const COMMA_CODE = 188;
      const QUESTION_MARK_CODE = 191;
      const S_KEY_CODE = 83;

      const cmdCtrl = e.ctrlKey || e.metaKey;

      // console.log(e.keyCode);
      if (cmdCtrl && e.keyCode === S_KEY_CODE) {
        this.showShare = !this.showShare;
        e.preventDefault();
        e.stopPropagation();
      }
      if (cmdCtrl && e.keyCode === COMMA_CODE) {
        this.$router.push({ name: 'settings' });
        e.preventDefault();
        e.stopPropagation();
      }
      if (cmdCtrl && e.shiftKey && e.keyCode === QUESTION_MARK_CODE) {
        this.showHelp = !this.showHelp;
        e.preventDefault();
        e.stopPropagation();
      }
    });
    return {
      showHelp: false,
      showShare: false,
    };
  },
});
</script>

<style lang="scss" scoped>
</style>

<template>
  <HelpModal :visible="showHelp" @close="showHelp = false" />
  <ShareModal :visible="showShare" @close="showShare = false" />
  <RouterView />
</template>
