<script>
import { defineComponent } from 'vue';
import ModalWindow from './ModalWindow.vue';

export default defineComponent({
  name: 'HelpModal',
  props: {
    visible: Boolean,
  },
  components: {
    ModalWindow,
  },
});
</script>

<style lang="scss" scoped>
ul {
  list-style-type: none;
  padding: 0;

  li {
    display: flex;
    flex: 1 1 0px;
    flex-wrap: nowrap;

    * {
      width: 50%;
    }

    b {
      padding-right: 4px;
      white-space: nowrap;
      text-align: right;
    }
    span {
      padding-left: 4px;
      white-space: nowrap;
      text-align: left;
    }
  }
}

b {
  color: #8f8;
}
</style>

<template>
  <div class="help-modal">
    <ModalWindow :visible="visible" @close="$emit('close')">
      <template #header>
        <h3>Keyboard Shortcuts</h3>
      </template>
      <template #body>
        <!-- ⌘ ⇧ ⌥ ⌃ ⇪ -->
        <ul>
          <li>
            <b>⌘Cmd - ,</b>
            <span>- open app settings</span>
          </li>
          <li>
            <b>⌃Ctrl - ,</b>
            <span>- open app settings</span>
          </li>
          <li>
            <b>⌘Cmd + Shift + ?</b>
            <span>- show this help window</span>
          </li>
          <li>
            <b>⌃Ctrl + Shift + ?</b>
            <span>- show this help window</span>
          </li>
          <li>
            <b>ESC</b>
            <span>- close window</span>
          </li>
        </ul>
      </template>
      <!-- <template #footer>
        <button @click="showModal = false">close</button>
      </template> -->
    </ModalWindow>
  </div>
</template>
