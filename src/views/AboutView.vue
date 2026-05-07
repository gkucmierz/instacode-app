<script setup>
import { PACKAGE_JSON } from '../app.config';

const name = PACKAGE_JSON.name;
const version = PACKAGE_JSON.version;
const author = PACKAGE_JSON.author;
const homepage = PACKAGE_JSON.homepage;
</script>

<template>
  <div class="about">
    <div>
      <h3>{{ name }}</h3>

      <div class="row">
        <div>version:</div>
        <div class="selectable">{{ version }}</div>
      </div>

      <div class="row">
        <div>source code:</div>
        <div><a :href="homepage" target="_blank">github</a></div>
      </div>

      <div class="row">
        <div>author:</div>
        <div class="selectable">{{ author }}</div>
      </div>

    </div>
  </div>
</template>

<style lang="scss" scoped>
.about {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;

  font-family: monospace;

  div {

    h3 {
      text-align: center;
      color: #4ee;
    }

    .row {
      display: flex;
      flex-direction: row;

      div {
        display: flex;
        flex: 1;
        padding: 2px 4px;
      }

      div:nth-of-type(1) {
        justify-content: flex-end;
        color: #4b4;
      }
      div:nth-of-type(2) {
        justify-content: flex-start;
      }
    }
  }
}
</style>
