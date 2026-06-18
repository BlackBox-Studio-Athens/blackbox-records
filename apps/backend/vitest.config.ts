import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

import {
  filteredViteLogger,
  filterBackendTestConsoleLog,
  installBackendWorkerPoolSourcemapStderrFilter,
} from './test/setup/filtered-vite-logger';

installBackendWorkerPoolSourcemapStderrFilter();

const backendRoot = dirname(fileURLToPath(import.meta.url));
const migrations = await readD1Migrations(join(backendRoot, 'prisma/migrations'));

export default defineConfig({
  customLogger: filteredViteLogger,
  plugins: [
    cloudflareTest({
      main: './src/index.ts',
      miniflare: {
        bindings: {
          APP_ENV: 'local',
          CHECKOUT_RETURN_ORIGINS: 'http://127.0.0.1:4321,http://localhost:4321',
          STRIPE_API_BASE_URL: 'http://127.0.0.1:12110',
          STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_test_blackbox_workers_pool',
          STRIPE_SECRET_KEY: 'sk_test_workers_pool',
          STRIPE_WEBHOOK_SECRET: 'whsec_workers_pool',
          TEST_MIGRATIONS: migrations,
        },
        compatibilityDate: '2026-04-20',
        compatibilityFlags: ['nodejs_compat'],
        d1Databases: {
          COMMERCE_DB: 'blackbox-records-workers-pool-test',
        },
      },
    }),
  ],
  test: {
    exclude: [
      'test/architecture/**/*.test.ts',
      'test/http/internal-order-routes.test.ts',
      'test/http/internal-stock-routes.test.ts',
      'test/http/public-commerce-routes.test.ts',
      'test/http/stripe-webhook-services.test.ts',
      'test/http/stripe-webhook-routes.test.ts',
      'test/scripts/**/*.test.ts',
    ],
    include: ['test/**/*.test.ts'],
    onConsoleLog: filterBackendTestConsoleLog,
    setupFiles: ['./test/setup/apply-d1-migrations.ts'],
  },
});
