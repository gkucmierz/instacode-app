/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  globals: {
    __APP_VERSION__: 'readonly',
  },
  overrides: [
    {
      files: [
        'e2e/**/*.js',
        'playwright.config.js',
        '.eslintrc.cjs',
        'vite.config.js',
      ],
      env: {
        node: true,
      },
    },
  ],
  ignorePatterns: ['src/app.config.mjs'],
}

