import { configDefaults, defineConfig } from 'vitest/config';

import base from './vitest.config.ts';
import { validationReporters } from '../../scripts/validation-reporters.ts';

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    ...validationReporters('web-request'),
    include: ['{src,test}/**/*.request.{test,spec}.{ts,tsx}'],
    exclude: configDefaults.exclude,
    setupFiles: ['./src/test/setup-msw.ts'],
  },
});
