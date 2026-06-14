# Changelog

All notable changes to this project will be documented in this file.

## [1.5.2] - 2026-06-14

### Fixed
- Fixed a bug where OffscreenCanvas dimensions (width and height) were not updated in the Web Worker on resolve-canvas and canvas-resize events, causing the canvas backing store to remain locked at 300x150.

## [1.5.1] - 2026-06-02

### Added
- Added support for pointer and click events forwarding from main thread to Web Worker (PointerDown, PointerMove, PointerUp, Click).
- Exposed event registration hooks in the `'canvas'` module: `onPointerDown`, `onPointerMove`, `onPointerUp`, `onClick`.
- Documented interaction events in `docs/canvas-events.md`.

### Fixed
- Fixed a regression in version 1.5.0 where `workerWindowPolyfill` defaults were not synchronized between `settingsService.mjs` and `SettingsView.vue`, resulting in the window polyfill being disabled on new visits and breaking Three.js/glassy demo payloads.
- Added comprehensive E2E tests verifying the `workerWindowPolyfill` behavior.

## [1.5.0] - 2026-06-02

### Added
- Added an option in settings to conditionally enable/disable virtual `window` and `devicePixelRatio` polyfill inside Web Workers.
- Documented the virtual window polyfill in `docs/window-polyfill.md`.
- Added help icon button in settings linking to the Gitea repository documentation.

### Fixed
- Optimized Web Worker lifecycle when switching editor tabs.
- Resolved memory leaks and background worker active timer bloat.
- Replaced empty catch blocks in worker error handling to pass lint checks.
- Prevented double overlay scroll on SettingsView by closing theme dropdown overlay on view unmount.

## [1.4.0] - 2026-06-02

### Added
- Integrated responsive HTML5 Canvas support using `OffscreenCanvas` transfer capabilities.
- Magic built-in module `'canvas'` that exposes a native `canvas` object (offscreen) and helper functions (`onResize`, `getDisplaySize`).
- Conditional vertical splitter layout in the output pane: shows the canvas viewport on top and the console output on bottom ONLY when the code imports `'canvas'`.
- Built-in `ResizeObserver` on the canvas container that feeds container dimensional changes back to the Web Worker for real-time redrawing and responsive alignment.

## [1.3.12] - 2026-05-28

### Fixed
- The full-width bright turquoise tab bar bottom border has been replaced with a subtle, theme-appropriate neutral border.
- The thin loading progress bar under the title bar now only activates when the app is actually resolving and downloading packages/assets from external CDNs, rather than showing up on every code evaluation run.
- A bug where empty or invalid imports (e.g. require("") or import "@") would trigger requests to CDNs and cache the esm.sh HTML homepage under the "@latest" key.

### Added
- A build-time script `extract-themes.mjs` that dynamically extracts colors from CodeMirror packages (`@codemirror/theme-one-dark` and `@uiw/codemirror-themes-all`) to generate a static JSON color metadata file, avoiding runtime overhead and keeping the UI shell colors in sync with CodeMirror.
- Npm lifecycle hooks `predev` and `prebuild` to automatically run the theme extraction script.

## [1.3.11] - 2026-05-28

### Added
- Global scrollbar auto-hide behavior (cross-platform OS X style) that only reveals scrollbars during active scrolling.

## [1.3.10] - 2026-05-28

### Fixed
- Indeterminate blue loading progress bar getting stuck permanently by resetting the loading state when workers are terminated or encounter errors.
- Memory leak and orphan background workers left active when closing editor tabs.

### Added
- Standard `<meta name="description">` tag to index.html to improve Google search snippet results.
- Schema.org JSON-LD WebApplication structured data block in the head section to enable Rich Snippets.
- `og:image` and `twitter:image` tags referencing the high-resolution 512x512 maskable app icon.

## [1.3.9] - 2026-05-28

### Added
- Tab switching keyboard shortcuts (`Cmd + Option + Left/Right` and `Ctrl + Option + Left/Right` on macOS, `Ctrl + Alt + Left/Right` on Windows/Linux).
- Shortcut descriptions in the Help modal.

### Fixed
- Persist UI Density selection in `localStorage` by adding `uiDensity` to default settings.
- Contrast and background color mismatches on the Settings page (both General labels and Package Cache tab items) when using light themes (like Eclipse).

### Changed
- Redesigned the UI Density selector from a dropdown to a full-width connected switch-button toggle with theme-matching blue highlights.
- Harmonized the entire application layout with the selected editor theme: dynamically updating the output console, splitter gutters, tab headers, tab container bar, and the Settings page background and tabs.

## [1.3.7]

### Added
- Basic tab management (open, close, rename, restore).
- Code persistence and sharing.
- Settings page with custom theme selection and CDN configurations.
