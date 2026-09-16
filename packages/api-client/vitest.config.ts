import { defineConfig } from 'vitest/config';
import { validationReporters } from '../../scripts/validation-reporters.ts';

export default defineConfig({
  test: {
    ...validationReporters('api-client'),
    setupFiles: ['./src/test/setup-msw.ts'],
  },
});
