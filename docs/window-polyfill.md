# Window Polyfill in Sandbox Worker

This document explains the **Window Polyfill (Worker)** configuration option in Instacode and how it affects code execution inside the sandbox.

## What is it?

Instacode executes your JavaScript code inside an isolated browser **Web Worker** to prevent computational tasks from freezing the main user interface.

Web Workers operate in a specialized scope (`DedicatedWorkerGlobalScope`) where the standard browser `window` object and DOM APIs do not exist. Instead, the global scope is referenced via `self` or `globalThis`.

Some third-party libraries (e.g., **Three.js** or other WebGL/canvas engines) are designed primarily for the main browser thread. During their module initialization, they may directly reference `window` or `window.devicePixelRatio`. When imported inside a standard worker, they will immediately throw a runtime exception: `window is not defined`.

The **Window Polyfill** option solves this by dynamically simulating basic global objects:
- `self.window` is aliased to `self` (the global worker context).
- `self.devicePixelRatio` is polyfilled with a default fallback of `1` if not provided by the browser environment.

## When to Enable

Keep this option **enabled** (default) if you are working with:
- WebGL rendering libraries (like Three.js or custom shaders).
- Computational libraries that expect a standard `window` environment to configure themselves.
- Inline assets or setups that query pixel density through `devicePixelRatio`.

## When to Disable

You may want to **disable** this option if:
- You are importing libraries that explicitly check `typeof window === 'undefined'` to detect if they are running inside a Web Worker and execute a dedicated, optimized worker-safe code path.
- The presence of the virtual `window` object tricks a library into thinking it has access to the main thread DOM, causing it to attempt unsupported operations (e.g., `document.appendChild`).
