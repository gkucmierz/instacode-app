<script>
import { RouterLink, RouterView } from 'vue-router';
import { defineComponent } from 'vue';
import Help from './components/Help.vue';

export default defineComponent({
  components: {
    Help,
  },
  data() {
    window.addEventListener('keydown', e => {
      if (!e) e = event;
      const COMMA_CODE = 188;
      const QUESTION_MARK_CODE = 191;

      const cmdCtrl = e.ctrlKey || e.metaKey;

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
      }
    });
    return {
      showHelp: false,
    };
  },
});
</script>

<style scoped>
</style>

<template>
  <Help :visible="showHelp" @close="showHelp = false"/>
  <RouterView />
</template>
