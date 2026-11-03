import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    // The first run downloads a MongoDB binary for mongodb-memory-server
    hookTimeout: 120_000,
    // env.ts validates these at import time. The real database connection comes from
    // the in-memory MongoDB started in tests/setup.ts, so MONGODB_URI is never used.
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/unused',
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
    },
  },
});
