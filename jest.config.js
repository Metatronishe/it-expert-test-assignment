/** @type {import('jest').Config} */
export default {
    verbose: true,
    testEnvironment: 'node',
    globalSetup: './global-setup.js',
    globalTeardown: './global-teardown.js'
  };