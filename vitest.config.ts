import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/logic/**', 'src/state/**'],
      exclude: ['src/state/actions.ts'],
      thresholds: { statements: 95, branches: 95, functions: 100, lines: 95 },
    },
  },
});
