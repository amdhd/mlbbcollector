import { defineConfig } from 'vitest/config';

// Vitest configuration. We only unit-test the pure business logic in src/lib,
// which needs no browser APIs, so the lightweight "node" environment is enough.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
