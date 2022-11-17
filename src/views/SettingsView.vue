<script>
import { defineComponent } from 'vue';
import InputSwitch from 'primevue/inputswitch';

export default defineComponent({
  components: {
    InputSwitch,
  },
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
      autoScroll: false,
      autoPrint: true,
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

<style scoped>
.settings {
  padding: 12px 24px;
}
label {
  margin-left: 12px;
}
</style>

<template>
  <div class="settings">
    <h3>App Settings</h3>

    <p>
      <InputSwitch v-model="autoScroll" inputId="autoScroll" />
      <label for="autoScroll">Auto scroll result</label>
    </p>

    <p>
      <InputSwitch v-model="autoPrint" inputId="autoPrint" />
      <label for="autoPrint">Auto print expressions</label>
    </p>

  </div>
</template>
