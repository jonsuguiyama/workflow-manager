const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['./vitest.global-setup.js'],
    setupFiles: ['./vitest.setup.js'],
    hookTimeout: 20000,
    testTimeout: 10000,
    fileParallelism: false
  }
});
