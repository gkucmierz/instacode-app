<template>
  <Dialog v-model:visible="needRefresh" modal header="Aktualizacja Instacode" :closable="false" :style="{ width: '400px' }">
    <div class="pwa-prompt-content">
      <i class="pi pi-cloud-download update-icon"></i>
      <p>Dostępna jest nowa wersja środowiska!</p>
      
      <div class="version-info">
        <div class="version-row">
          <span>Obecna wersja:</span>
          <strong>v{{ currentVersion }}</strong>
        </div>
        <div class="version-row" v-if="newVersion">
          <span>Najnowsza wersja:</span>
          <strong class="highlight">v{{ newVersion }}</strong>
        </div>
      </div>
    </div>
    
    <template #footer>
      <PrimeButton label="Później" icon="pi pi-times" @click="close" class="p-button-text p-button-secondary" />
      <PrimeButton label="Odśwież teraz" icon="pi pi-refresh" @click="updateServiceWorker()" autofocus />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import Dialog from 'primevue/dialog';
import PrimeButton from 'primevue/button';

const currentVersion = __APP_VERSION__;
const newVersion = ref(null);

const {
  needRefresh,
  updateServiceWorker,
} = useRegisterSW();

watch(needRefresh, async (isNeeded) => {
  if (isNeeded) {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        newVersion.value = data.version;
      }
    } catch (e) {
      console.error('Failed to fetch new version info:', e);
    }
  }
});

const close = () => {
  needRefresh.value = false;
};
</script>

<style scoped>
.pwa-prompt-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem 0;
}

.update-icon {
  font-size: 3rem;
  color: var(--primary-color, #7ACED7);
  margin-bottom: 1rem;
}

.version-info {
  width: 100%;
  margin-top: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
}

.version-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.version-row:last-child {
  border-bottom: none;
}

.highlight {
  color: var(--primary-color, #7ACED7);
}
</style>
