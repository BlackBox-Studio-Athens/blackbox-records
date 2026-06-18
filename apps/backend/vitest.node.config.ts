import { defineConfig } from 'vitest/config';

import { filteredViteLogger, installFilteredViteConsoleWarningFilter } from './test/setup/filtered-vite-logger';

installFilteredViteConsoleWarningFilter();

export default defineConfig({
  customLogger: filteredViteLogger,
  test: {
    environment: 'node',
    include: [
      'test/architecture/**/*.test.ts',
      'test/http/internal-order-routes.test.ts',
      'test/http/internal-stock-routes.test.ts',
      'test/http/public-commerce-routes.test.ts',
      'test/http/stripe-webhook-routes.test.ts',
      'test/scripts/**/*.test.ts',
    ],
  },
});
