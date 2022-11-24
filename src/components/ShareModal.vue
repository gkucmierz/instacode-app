<script>
import { defineComponent } from 'vue';

import InputText from 'primevue/inputtext';
import PrimeButton from 'primevue/button';

import copy from 'copy-to-clipboard';

import { APP_URL, SHARE_CODE_ROUTE_NAME } from '../app.config';
import ModalWindow from './ModalWindow.vue';
import codeService from '../services/codeService';

export default defineComponent({
  name: 'ShareModal',
  props: {
    visible: Boolean,
  },
  components: {
    ModalWindow,
    InputText,
    PrimeButton,
  },
  data() {
    return {
      code: '',
    };
  },
  methods: {
    encode(code) {
      return [APP_URL, SHARE_CODE_ROUTE_NAME, btoa(code)].join('/');
    },
    copy() {
      copy(this.encode(this.code));
      this.$emit('close');
    },
  },
  watch: {
    visible(visible) {
      if (!visible) return;
      this.code = codeService.get();
    },
  },
});
</script>

<style lang="scss" scoped>
.p-inputgroup {
  width: 320px;
}
</style>

<template>
  <div class="share-modal">
    <ModalWindow :visible="visible" @close="$emit('close')">
      <template #header>
        <h3>Share Code</h3>
      </template>
      <template #body>
        <div class="p-inputgroup">
          <InputText :modelValue="encode(code)" readonly />
          <PrimeButton icon="pi pi-copy" class="p-button-info" @click="copy()" />
        </div>
      </template>
      <!-- <template #footer>
        <button @click="showModal = false">close</button>
      </template> -->
    </ModalWindow>
  </div>
</template>
