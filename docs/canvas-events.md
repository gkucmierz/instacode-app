# Canvas Interaction Events in Web Workers

To create interactive 3D and 2D canvas experiences (such as drag-to-rotate, click-to-change, drawing boards, etc.), Instacode automatically forwards pointer and click events from the main browser window directly into the sandboxed Web Worker.

Since Web Workers do not have access to the DOM or window elements, you cannot use native `canvas.addEventListener()` directly. Instead, you can import built-in event registration hooks from the magic `'canvas'` module.

## Supported Events

The `'canvas'` module exposes four interaction event listeners:

### 1. `onPointerDown(callback)`
Fires when a mouse is clicked down, a finger touches the screen, or a stylus makes contact with the canvas.
- **Callback argument**: `object`
  - `x`: Relative X coordinate in pixels from the top-left of the canvas.
  - `y`: Relative Y coordinate in pixels from the top-left of the canvas.
  - `button`: The button number pressed (e.g. `0` for primary/left click).
  - `buttons`: A bitmask representing all buttons pressed.
  - `pointerId`: Unique identifier for the pointer source (useful for multi-touch).
  - `canvasWidth`: Current visual width of the canvas viewport.
  - `canvasHeight`: Current visual height of the canvas viewport.

### 2. `onPointerMove(callback)`
Fires when the pointer (mouse cursor or active touch point) is dragged across the canvas surface.
- **Callback argument**: Same `object` schema as `onPointerDown`.

### 3. `onPointerUp(callback)`
Fires when the pointer (mouse button, touch point, or stylus) is released.
- **Callback argument**: Same `object` schema as `onPointerDown`.

### 4. `onClick(callback)`
Fires when a complete click (pointerdown followed by pointerup without significant movement) occurs on the canvas.
- **Callback argument**: `object`
  - `x`: Relative X coordinate in pixels.
  - `y`: Relative Y coordinate in pixels.
  - `button`: The button number clicked.

---

## Code Example: Interactive Drag-to-Rotate

Here is how to import and use these hooks with `three` to implement a mouse/touch controlled rotation on a Mesh:

```javascript
import { canvas, onResize, onPointerDown, onPointerMove, onPointerUp } from 'canvas';
import * as THREE from 'three';

// 1. Setup Three.js Scene, Camera, and Renderer...
const renderer = new THREE.WebGLRenderer({ canvas });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 100);
camera.position.z = 10;

const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshNormalMaterial());
scene.add(mesh);

// 2. Register Interactive Drag Rotation Logic
let isDragging = false;
let previousPointerPos = { x: 0, y: 0 };
const rotationTarget = { x: 0, y: 0 };

onPointerDown((e) => {
  isDragging = true;
  previousPointerPos = { x: e.x, y: e.y };
});

onPointerMove((e) => {
  if (!isDragging) return;

  const deltaX = e.x - previousPointerPos.x;
  const deltaY = e.y - previousPointerPos.y;

  // Orbit rotation adjustments based on cursor drag distance
  rotationTarget.y += deltaX * 0.01;
  rotationTarget.x += deltaY * 0.01;

  previousPointerPos = { x: e.x, y: e.y };
});

onPointerUp(() => {
  isDragging = false;
});

// 3. Render and Animation loop
onResize((w, h) => {
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

function animate() {
  requestAnimationFrame(animate);

  if (canvas.width === 0 || canvas.height === 0) return;

  if (isDragging) {
    // Smoothly transition towards drag rotation target
    mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, rotationTarget.y, 0.15);
    mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, rotationTarget.x, 0.15);
  } else {
    // Idle rotation when not interacting
    mesh.rotation.y += 0.01;
  }

  renderer.render(scene, camera);
}
animate();
```

---

## Thread Activity Status Indicator

Instacode features a real-time status indicator in the bottom-right corner representing the execution state of the Web Worker:

- **Idle (Green)**: The Web Worker is idle, waiting for input. No active tasks or animation loops are scheduled in the background.
- **Background thread (async) (Blue)**: The Web Worker is actively running code asynchronously. This is triggered by:
  - Background asynchronous timers (`setTimeout`, `setInterval`).
  - Active animation frames (`requestAnimationFrame`, `cancelAnimationFrame`).
  - Scheduled idle callbacks (`requestIdleCallback`, `cancelIdleCallback`).
- **Evaluating (Blue with pulse)**: The Web Worker is currently compiling and executing the code block.
- **Blocked (Red)**: The CPU is 100% busy in a synchronous blocking loop, preventing incoming event processing.

Because of this, any continuous animation loop (such as Three.js `requestAnimationFrame`) will correctly keep the status as **Background thread (async)** (Blue), indicating that the graphics thread is running and rendering in the background.

---

## Live Examples & Gists

You can load pre-configured interactive scripts directly inside Instacode using the Gist integration.

*   [Interactive Dichroic X-Cube](https://gist.github.com/gkucmierz/843e36d822e2fc3f14721e835e60ab8b)
