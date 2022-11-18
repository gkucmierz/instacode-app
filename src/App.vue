<script>
import { defineComponent } from 'vue';
import HelpModal from './components/HelpModal.vue';

export default defineComponent({
  components: {
    HelpModal,
  },
  data() {
    window.addEventListener('keydown', e => {
      if (!e) e = event;
      const COMMA_CODE = 188;
      const QUESTION_MARK_CODE = 191;

      const cmdCtrl = e.ctrlKey || e.metaKey;

      // console.log(e.keyCode);
      if (cmdCtrl && e.keyCode === 83) {
        console.log('share');
        e.preventDefault();
      }
      if (cmdCtrl && e.keyCode === COMMA_CODE) {
        this.$router.push({ name: 'settings' });
        e.preventDefault();
      }
      if (cmdCtrl && e.shiftKey && e.keyCode === QUESTION_MARK_CODE) {
        this.showHelp = !this.showHelp;
        e.preventDefault();
      }
      if (e.keyCode === 27) {
        this.showHelp = false;
        e.preventDefault();
      }
    });
    return {
      showHelp: false,
    };
  },
});
</script>

<style lang="scss" scoped>
</style>

<template>
  <HelpModal :visible="showHelp" @close="showHelp = false" />
  <RouterView />
</template>
