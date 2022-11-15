<script>
import { RouterLink, RouterView } from 'vue-router';
import { defineComponent } from 'vue';

export default defineComponent({
  data() {
    window.addEventListener('keydown', e => {
      if (!e) e = event;
      const COMMA_CODE = 188;
      if ((e.ctrlKey || e.metaKey) && e.keyCode === COMMA_CODE) {
        this.$router.push({ name: 'settings' });
        e.preventDefault();
      }
    });
    return {};
  },
});
</script>

<template>
  <RouterView />
</template>

<style scoped>
</style>
