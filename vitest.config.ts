import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 90000,
    hookTimeout: 60000,
    // Enable threads by default for pure unit tests
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 3,
        minThreads: 1,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.test.ts',
        '**/*.config.ts',
      ],
    },
    retry: 3,
    // Run tests in parallel by default
    sequence: {
      shuffle: false,
      concurrent: true,
    },
    maxConcurrency: 3,
    slowTestThreshold: 5000,
    isolate: true,
    // Group tests by tags for better organization
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    // Tests with @rpc tag will run in sequence
    typecheck: {
      tsconfig: './tsconfig.json',
      include: ['**/*.{test,spec}.{ts,tsx}'],
    },
  },
});
