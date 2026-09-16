import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { validationReporters } from '../../scripts/validation-reporters.ts';

export default defineConfig({
  plugins: [react()],
  test: {
    ...validationReporters('staff'),
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
