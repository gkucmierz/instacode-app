<script>
import { RouterView } from 'vue-router';
import { defineComponent } from 'vue';

export default defineComponent({
  data() {
    const escDown = e => {
      if (!e) e = event;
      const ESC_CODE = 27;
      if (e.keyCode === ESC_CODE) {
        this.$router.go(-1);
        e.preventDefault();
      }
    };
    return {
      escDown,
    };
  },
  mounted() {
    window.addEventListener('keydown', this.escDown);
  },
  unmounted() {
    window.removeEventListener('keydown', this.escDown);
  },
});
</script>

<template>
  <div class="settings">
    <p>App Settings</p>
  </div>
</template>

<style scoped>
</style>
