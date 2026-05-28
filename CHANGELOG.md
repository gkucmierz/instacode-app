# Changelog

All notable changes to this project will be documented in this file.

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
