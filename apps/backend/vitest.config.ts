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
          PRODUCT_ENVIRONMENT: 'LOCAL',
          LOCAL_OPERATOR_EMAIL: 'operator@blackboxrecords.example',
          CHECKOUT_RETURN_ORIGINS: 'http://127.0.0.1:4321,http://localhost:4321',
          EMAIL_BRAND_HOME_URL: 'https://blackbox-studio-athens.github.io/blackbox-records/',
          EMAIL_BRAND_LOGO_URL:
            'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
          STRIPE_API_BASE_URL: 'http://127.0.0.1:12110',
          STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_test_blackbox_workers_pool',
          STRIPE_SECRET_KEY: 'sk_test_workers_pool',
          STRIPE_WEBHOOK_SECRET: 'whsec_workers_pool',
          RESEND_API_KEY: 're_mock_blackbox_local',
          RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
          RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
          RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
          RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
          TEST_MIGRATIONS: migrations,
        },
        compatibilityDate: '2026-08-31',
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
      'test/http/stripe-webhook-routes.test.ts',
      'test/scripts/**/*.test.ts',
    ],
    include: ['test/**/*.test.ts'],
    onConsoleLog: filterBackendTestConsoleLog,
    setupFiles: ['./test/setup/apply-d1-migrations.ts'],
  },
});
