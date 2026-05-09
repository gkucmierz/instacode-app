<script setup>
import ModalWindow from './ModalWindow.vue';

const props = defineProps({
  visible: Boolean,
});

const emit = defineEmits(['close']);

const version = __APP_VERSION__;
</script>

<template>
  <ModalWindow :visible="visible" @close="emit('close')">
    <template #body>
      <div class="about-container">
        <div class="header-row">
          <img src="/img/icons/android-chrome-192x192.png" alt="Instacode Logo" class="logo" />
          <h1>Instacode <span class="version">v{{ version }}</span></h1>
        </div>
        
        <p class="description">
          A lightning-fast, zero-configuration JavaScript/TypeScript scratchpad designed for maximum focus and speed.
        </p>

        <div class="section">
          <h3>Why "Insta"?</h3>
          <p>
            Because execution happens <strong>instantly on key up</strong>. 
            There is no "Run" button. There is no waiting. As soon as your fingers leave the keys, 
            your code is bundled, dependencies are resolved dynamically, and the result is rendered.
          </p>
        </div>

        <div class="metadata">
          <div class="meta-row">
            <span class="label">Author:</span>
            <span class="value">Grzegorz Kućmierz</span>
          </div>
          <div class="meta-row">
            <span class="label">License:</span>
            <span class="value">MIT</span>
          </div>
          <div class="meta-row">
            <span class="label">Repository:</span>
            <a href="https://gitea.7u.pl/gkucmierz/instacode-app" target="_blank" rel="noopener noreferrer">gitea.7u.pl/gkucmierz/instacode-app</a>
          </div>
        </div>
      </div>
    </template>
  </ModalWindow>
</template>

<style lang="scss" scoped>
.about-container {
  max-width: 500px;
  color: #dcdcdc;

  .header-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 0.5em;

    .logo {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    h1 {
      font-size: 2em;
      margin: 0;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;

      .version {
      font-size: 0.4em;
      background: rgba(122, 206, 215, 0.2);
      color: #7ACED7;
      padding: 4px 8px;
      border-radius: 12px;
      vertical-align: middle;
      font-family: monospace;
      }
    }
  }

  .description {
    font-size: 1.1em;
    margin-bottom: 20px;
    line-height: 1.6;
    color: #b0b0b0;
  }

  .section {
    background: rgba(255, 255, 255, 0.05);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    border: 1px solid rgba(255, 255, 255, 0.1);

    h3 {
      margin-top: 0;
      margin-bottom: 10px;
      color: #7ACED7;
      font-weight: 600;
    }

    p {
      margin: 0;
      line-height: 1.5;
      font-size: 0.95em;
    }
  }

  .metadata {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 16px;
    padding-bottom: 8px;
    font-family: monospace;
    font-size: 0.9em;

    .meta-row {
      display: flex;
      justify-content: space-between;
      
      .label {
        color: #888;
      }

      .value {
        color: #ddd;
      }

      a {
        color: #7ACED7;
        text-decoration: none;
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}
</style>
