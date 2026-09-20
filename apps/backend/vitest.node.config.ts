import { defineConfig } from 'vitest/config';
import { validationReporters } from '../../scripts/validation-reporters.ts';
import { backendNodeTestFiles } from './vitest-test-selection.ts';

import { filteredViteLogger, filterBackendTestConsoleLog } from './test/setup/filtered-vite-logger';

export default defineConfig({
  customLogger: filteredViteLogger,
  test: {
    ...validationReporters('backend-node'),
    maxWorkers: 2,
    environment: 'node',
    include: [
      'test/architecture/**/*.test.ts',
      'test/http/internal-order-routes.test.ts',
      'test/http/internal-stock-routes.test.ts',
      'test/http/public-commerce-routes.test.ts',
      'test/http/stripe-webhook-routes.test.ts',
      'test/scripts/**/*.test.ts',
      ...backendNodeTestFiles,
    ],
    onConsoleLog: filterBackendTestConsoleLog,
  },
});
