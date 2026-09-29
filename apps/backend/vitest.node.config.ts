import { defineConfig } from 'vitest/config';
import { validationReporters } from '../../scripts/validation-reporters.ts';

import { filteredViteLogger, filterBackendTestConsoleLog } from './test/setup/filtered-vite-logger';

export default defineConfig({
  customLogger: filteredViteLogger,
  test: {
    ...validationReporters('backend-node'),
    maxWorkers: 1,
    environment: 'node',
    include: ['test/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/*.worker.{test,spec}.{ts,tsx}'],
    onConsoleLog: filterBackendTestConsoleLog,
  },
});
