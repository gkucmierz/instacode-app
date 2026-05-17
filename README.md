# ⚡️ Instacode

**Instacode** is a powerful, strictly in-browser Javascript sandbox designed for evaluating heavy computational code without freezing the UI. Built with Vue 3 and Vite, it leverages Web Workers and Abstract Syntax Tree (AST) transformations to safely execute user scripts "on the fly".

## ✨ Key Features

- 🛡️ **Zero-Blocking Architecture:** Never freeze your browser again. Instacode automatically injects non-blocking yield instructions into your code, allowing even massive CPU-bound tasks (like calculating Lucas-Lehmer primes with `BigInt`) to run smoothly while keeping the Event Loop breathing.
- 📦 **Dynamic Sandbox Imports & Intelligent Autocompletion:** Seamlessly use external dependencies. Instacode's AST parser intercepts native `import()` and `ImportDeclaration` statements, fetching packages from external registries directly into the Worker's virtual file system. The integrated CodeMirror editor provides real-time intelligent autocompletion for package exports directly from the CDN.
- 🌲 **Tree-Shaking & Export Bundling:** Instacode provides a production bundler capable of true tree-shaking by extracting AST module specifiers and resolving only the necessary parts of external packages via `esm.sh`.
- 🌐 **Zero-Trust Offline-First PWA:** Using the `?standalone` ESM flag, our bundler fully extracts and embeds all nested internal dependencies from `package.json`, creating 100% self-contained, offline-ready monolithic bundles safely cached in IndexedDB. A built-in robust Service Worker ensures the application is always available offline, with a dedicated Over-The-Air (OTA) update prompt for seamless version upgrades.
- 🔄 **Smart `require` Hoisting & Linting:** Instacode bridges the gap between CommonJS and ES Modules by intelligently analyzing CommonJS `require()` calls and hoisting them into native ESM `import` statements at the top of the generated bundle. A custom linter actively suggests locking unstable dependency versions.
- ⚡️ **Real-Time Log Streaming:** Forget waiting for a 100% CPU task to finish before seeing the output. Our custom IPC stream with `console.flush()` pushes your logs to the UI instantly, line by line.
- 🗂️ **Multi-Tab Workspace:** Effortlessly manage multiple concurrent scripts with a robust multi-tab interface, fully controllable via keyboard shortcuts (`Cmd+N`, `Cmd+W`, `Cmd+[1-9]`).

## 🧠 How it works (Under the Hood)

When you write code in Instacode:
1. We parse your script into an AST (Abstract Syntax Tree) using the Meriyah parser.
2. We inject micro-task yields (`await __yield()`) and `console.flush()` hooks into your standard logging functions.
3. The transformed code runs inside a secure Web Worker context wrapped in an `AsyncFunction`.
4. Dependencies are resolved, fully bundled with their sub-trees (for offline support), and injected into the execution context using base64 Data URIs.

## 🚀 Development Setup

We recommend using [VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar).

### Installation

Clone the repository and install dependencies:

```sh
npm install
```

### Start Development Server

Compile and hot-reload for development:

```sh
npm run dev
```

### Production Build & PWA Generation

Compile, minify, and generate the `version.json` payload for the PWA Service Worker:

```sh
npm run build
```

### Testing

Instacode uses **Vitest** for unit testing math/logic and **Playwright** for fully-isolated E2E browser testing (bound to deterministic Port Lens tracking):

```sh
# Run unit tests
npm run test

# Run E2E Playwright tests (headless)
npm run test:e2e

# Run E2E Playwright tests with UI
npm run test:e2e:ui
```

### Linting

Lint the codebase with [ESLint](https://eslint.org/):

```sh
npm run lint
```
