<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Help',
  props: {
    visible: Boolean,
  },
});
</script>

<style lang="scss" scoped>

$padding: 12px;

.help {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  padding: 0;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  display: flex;
  justify-content: center;
  align-items: center;

  visibility: hidden;
  &.visible {
    visibility: visible;
  }

  .window {
    padding: $padding $padding * 4;
    border-radius: $padding * 2;
    // height: calc(100% - 100px);
    // width: calc(100% - 100px);
    line-height: 1.5;
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(32, 32, 32, 0.6);
    overflow-y: auto;

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
  }
}
</style>

<template>
  <div
    class="help"
    :class="{ visible: this.visible }"
    @click="$emit('close')"
  >
    <div class="window" @click.stop>
      <div class="header">
        <h3>Keyboard Shorcuts</h3>
      </div>
      <div class="content">
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
            <b>⌘Com + Shift + ?</b>
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
      </div>
    </div>
  </div>
</template>
