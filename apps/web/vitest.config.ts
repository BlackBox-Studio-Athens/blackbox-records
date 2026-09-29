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
    ...validationReporters('web-lightweight'),
    maxWorkers: 2,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'test/**/*.{test,spec}.{ts,tsx}'],
    exclude: [...configDefaults.exclude, '**/*.request.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/test/setup-reject-network.ts'],
  },
});
