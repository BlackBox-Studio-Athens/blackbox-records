import { defineConfig } from 'vitest/config';

import { filteredViteLogger, filterBackendTestConsoleLog } from './test/setup/filtered-vite-logger';

export default defineConfig({
  customLogger: filteredViteLogger,
  test: {
    environment: 'node',
    include: [
      'test/architecture/**/*.test.ts',
      'test/http/internal-order-routes.test.ts',
      'test/http/internal-stock-routes.test.ts',
      'test/http/public-commerce-routes.test.ts',
      'test/http/stripe-webhook-services.test.ts',
      'test/http/stripe-webhook-routes.test.ts',
      'test/scripts/**/*.test.ts',
    ],
    onConsoleLog: filterBackendTestConsoleLog,
  },
});
