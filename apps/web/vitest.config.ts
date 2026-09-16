import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';
import { validationReporters } from '../../scripts/validation-reporters.ts';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    ...validationReporters('web'),
    maxWorkers: 2,
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}', '../../scripts/**/*.test.ts'],
    // These root contracts run once through test:contracts, also included in scoped validation.
    exclude: [
      ...configDefaults.exclude,
      '../../scripts/check-frontend-route-isolation.test.ts',
      '../../scripts/pages-workflow-contract.test.ts',
    ],
    setupFiles: ['./src/test/setup-msw.ts'],
  },
});
