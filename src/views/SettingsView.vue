<script>
import { defineComponent } from 'vue';
import InputSwitch from 'primevue/inputswitch';

import settingsService from '../services/settingsService';

const DEFAULT_SETTINGS = {
  autoScroll: false,
  autoPrint: true,
};

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
      so: Object.keys(DEFAULT_SETTINGS).reduce((so, key) => {
        so[key] = settingsService.getItem(key) ?? DEFAULT_SETTINGS[key];
        return so;
      }, {}),
    };
  },
  watch: {
    so: {
      deep: true,
      handler(val) {
        settingsService.set(val);
      },
    },
  },
  mounted() {
    window.addEventListener('keydown', this.escDown);
  },
  unmounted() {
    window.removeEventListener('keydown', this.escDown);
  },
});
</script>

<style lang="scss" scoped>
.settings {
  padding: 12px 24px;

  .item {
    display: flex;
    align-items: center;

    label {
      margin-left: 12px;
    }
  }
}
</style>

<template>
  <div class="settings">
    <h3>App Settings</h3>

    <p class="item">
      <InputSwitch v-model="so.autoScroll" inputId="autoScroll" />
      <label for="autoScroll">Auto scroll result</label>
    </p>

    <p class="item">
      <InputSwitch v-model="so.autoPrint" inputId="autoPrint" />
      <label for="autoPrint">Auto print expressions</label>
    </p>

    <pre>{{ so }}</pre>
  </div>
</template>
