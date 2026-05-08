# ⚡️ Instacode

**Instacode** is a powerful, strictly in-browser Javascript sandbox designed for evaluating heavy computational code without freezing the UI. Built with Vue 3 and Vite, it leverages Web Workers and Abstract Syntax Tree (AST) transformations to safely execute user scripts "on the fly".

## ✨ Key Features

- 🛡️ **Zero-Blocking Architecture:** Never freeze your browser again. Instacode automatically injects non-blocking yield instructions into your code, allowing even massive CPU-bound tasks (like calculating Lucas-Lehmer primes with `BigInt`) to run smoothly while keeping the Event Loop breathing.
- 📦 **Dynamic Sandbox Imports:** Seamlessly use external dependencies. Instacode's AST parser intercepts native `import()` and `ImportDeclaration` statements, fetching packages from external registries directly into the Worker's virtual file system in a fraction of a second.
- 🌲 **Tree-Shaking & Export Bundling:** Instacode provides a production bundler capable of true tree-shaking by extracting AST module specifiers and resolving only the necessary parts of external packages via `esm.sh`.
- 🌐 **Zero-Trust Offline-First Caching:** Using the `?standalone` ESM flag, our bundler fully extracts and embeds all nested internal dependencies from `package.json`, creating 100% self-contained, offline-ready monolithic bundles safely cached in IndexedDB.
- 🔄 **Smart `require` Hoisting:** Instacode bridges the gap between CommonJS and ES Modules by intelligently analyzing CommonJS `require()` calls and hoisting them into native ESM `import` statements at the top of the generated bundle, guaranteeing robust compilation.
- ⚡️ **Real-Time Log Streaming:** Forget waiting for a 100% CPU task to finish before seeing the output. Our custom IPC stream with `console.flush()` pushes your logs to the UI instantly, line by line.
- 🛠️ **Modern Stack:** Built on top of **Vue 3** and **Vite** for a blazing fast developer experience.

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

### Production Build

Compile and minify for production:

```sh
npm run build
```

### Linting

Lint the codebase with [ESLint](https://eslint.org/):

```sh
npm run lint
```
