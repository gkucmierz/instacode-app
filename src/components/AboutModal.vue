<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import ModalWindow from './ModalWindow.vue';
import { createLangtonsAnt } from '@gkucmierz/utils';

// High-performance bounded grid for Canvas UI (Zero GC overhead)
const createGrid = (width, height) => {
  const cells = new Uint8Array(width * height);
  const set = (x, y, val) => {
    if (x >= 0 && x < width && y >= 0 && y < height) cells[y * width + x] = val;
  };
  const get = (x, y) => {
    return (x >= 0 && x < width && y >= 0 && y < height) ? cells[y * width + x] : 0;
  };
  return { set, get };
};

const props = defineProps({
  visible: Boolean,
});

const emit = defineEmits(['close']);
const version = __APP_VERSION__;

const canvasRef = ref(null);
const logoRef = ref(null);
let animationFrameId = null;
const CELL_SIZE = 4; // size of each grid cell in pixels

const initLangtonsAnt = () => {
  if (!canvasRef.value || !logoRef.value) return;
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d', { alpha: false });

  // Get dimensions of the container
  const containerRect = canvas.parentElement.getBoundingClientRect();
  canvas.width = containerRect.width;
  canvas.height = containerRect.height;

  const gridWidth = Math.ceil(canvas.width / CELL_SIZE);
  const gridHeight = Math.ceil(canvas.height / CELL_SIZE);

  const grid = createGrid(gridWidth, gridHeight);

  // Fill background
  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate start position relative to canvas (center of logo)
  const logoRect = logoRef.value.getBoundingClientRect();

  const logoCenterX = (logoRect.left - containerRect.left) + logoRect.width / 2;
  const logoCenterY = (logoRect.top - containerRect.top) + logoRect.height / 2;

  const startX = Math.floor(logoCenterX / CELL_SIZE);
  const startY = Math.floor(logoCenterY / CELL_SIZE);

  // Spawn 16 ants in a circle around the logo for an absolute visual chaos!
  const numAnts = 46;
  const radius = Math.floor(140 / 2 / CELL_SIZE); // Match the radius to the logo size

  const ants = [];
  for (let i = 0; i < numAnts; i++) {
    const angle = (i / numAnts) * Math.PI * 2;
    const px = startX + Math.floor(Math.cos(angle) * radius);
    const py = startY + Math.floor(Math.sin(angle) * radius);

    // Pass 'i % 4' as initial direction to keep a predictable symmetrical spread
    ants.push(createLangtonsAnt(grid, px, py, i % 4));
  }

  const color0 = '#1e1e1e'; // background color (off)
  const color1 = '#4b5563'; // Grayed out so it doesn't blend with the logo

  const fadingTrails = []; // Array to hold {x, y, alpha} for the user ants' glowing trails

  const drawStep = () => {
    // Run multiple logic steps per frame for speed
    for (let s = 0; s < 25; s++) {
      for (let i = 0; i < ants.length; i++) {
        const ant = ants[i];
        if (ant.dead) continue;

        const result = ant.step();
        // Check bounds manually since the unlimited grid ant doesn't know about boundaries
        if (result.x < 0 || result.x >= gridWidth || result.y < 0 || result.y >= gridHeight) {
          ant.dead = true;
          continue;
        }
        
        ctx.fillStyle = result.state ? color1 : color0;
          ctx.fillRect(result.x * CELL_SIZE, result.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          
          if (ant.isUser) {
            fadingTrails.push({ x: result.x, y: result.y, alpha: 1.0 });
          }
      }
    }

    // Draw and update fading trails
    for (let i = fadingTrails.length - 1; i >= 0; i--) {
      const trail = fadingTrails[i];
      trail.alpha -= 0.015; // Fade out speed (0.015 = ~1 second at 60fps)
      
      // Always redraw the underlying base grid color first
      const state = grid.get(trail.x, trail.y);
      ctx.fillStyle = state ? color1 : color0;
      ctx.fillRect(trail.x * CELL_SIZE, trail.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      
      if (trail.alpha <= 0) {
        // If fully faded, remove from array (the base color is already drawn)
        fadingTrails.splice(i, 1);
      } else {
        // Draw the glowing cyan overlay
        ctx.fillStyle = `rgba(122, 206, 215, ${trail.alpha})`;
        ctx.fillRect(trail.x * CELL_SIZE, trail.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Continue if any ant is alive or trails are still fading
    if (ants.some(a => !a.dead) || fadingTrails.length > 0) {
      animationFrameId = requestAnimationFrame(drawStep);
    } else {
      animationFrameId = null;
    }
  };
  
  // Interactive Easter Egg: Spawn an ant on click!
  logoRef.value.onclick = () => {
    // Spawn exactly from the center of the logo with a random direction
    const newAnt = createLangtonsAnt(grid, startX, startY);
    newAnt.isUser = true; // Flag it so it leaves a glowing trail
    ants.push(newAnt);
    
    // If the animation had already finished, restart it!
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(drawStep);
    }
  };

  animationFrameId = requestAnimationFrame(drawStep);
};

const stopLangtonsAnt = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

watch(() => props.visible, async (isVisible) => {
  if (isVisible) {
    await nextTick();
    // delay slightly to ensure layout is settled
    setTimeout(initLangtonsAnt, 300);
  } else {
    stopLangtonsAnt();
  }
});

onBeforeUnmount(() => {
  stopLangtonsAnt();
});
</script>

<template>
  <ModalWindow :visible="visible" @close="emit('close')">
    <template #body>
      <div class="about-wrapper">
        <canvas ref="canvasRef" class="ant-canvas"></canvas>
        <div class="about-container">
          <div class="content-col">
            <div class="header-row">
              <h1>Instacode <span class="version">v{{ version }}</span></h1>
            </div>

            <p class="description">
              A lightning-fast, zero-configuration JavaScript scratchpad designed for maximum focus and
              speed.
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
                <a href="https://gitea.7u.pl/gkucmierz/instacode-app" target="_blank"
                  rel="noopener noreferrer">gitea.7u.pl/gkucmierz/instacode-app</a>
              </div>
            </div>
          </div>

          <div class="logo-col">
            <img ref="logoRef" src="/img/icons/android-chrome-192x192.png" alt="Instacode Logo" class="large-logo" draggable="false" />
          </div>
        </div>
      </div>
    </template>
  </ModalWindow>
</template>

<style lang="scss" scoped>
.about-wrapper {
  position: relative;
  overflow: hidden;
  margin: -48px; // Negate the 48px padding from ModalWindow
  border-radius: 24px; // Match the ModalWindow's border-radius
  display: flex;
  min-height: 450px;
}

.ant-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.7;
  /* Increased opacity to make ants more visible */
  z-index: 1;
}

.about-container {
  position: relative;
  z-index: 10;
  display: flex;
  width: 100%;
  max-width: 750px;
  align-items: stretch;
  color: #dcdcdc;

  .content-col {
    flex: 1;
    background: rgba(15, 15, 15, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 48px;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 8px 0 32px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .logo-col {
    flex: 0 0 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;

    .large-logo {
      width: 140px;
      height: 140px;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      z-index: 20;
      cursor: pointer;
      transition: transform 0.1s ease-out;

      &:active {
        transform: scale(0.92);
      }
    }
  }

  .header-row {
    display: flex;
    align-items: center;
    margin-bottom: 0.5em;

    h1 {
      font-size: 2.2em;
      margin: 0;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;

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
    backdrop-filter: blur(4px);

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
