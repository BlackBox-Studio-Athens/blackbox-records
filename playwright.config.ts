import { defineConfig } from 'playwright/test';

// Canonical Local URL including the Astro base path (apps/web/scripts/start-static-site-dev.mjs).
const baseURL = 'http://127.0.0.1:4321/blackbox-records/';
const artifacts = '.codex-artifacts/e2e';

export default defineConfig({
  testDir: 'e2e',
  outputDir: `${artifacts}/test-results`,
  fullyParallel: true,
  // ponytail: astro dev compiles each route and lazy chunk on first request and re-renders the Store listing every
  // time (about 7 s here, slower with more workers). Two workers and long waits keep it stable; a built site would not need them.
  workers: 2,
  timeout: 90_000,
  expect: { timeout: 30_000 },
  reporter: [['list'], ['json', { outputFile: `${artifacts}/summary.json` }]],
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    // Reuses whatever already serves 4321 (site:dev:bg or the full stack); otherwise runs astro dev for this run only.
    command: 'pnpm site:dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    { name: 'chromium-desktop', use: { viewport: { width: 1440, height: 900 } } },
    {
      name: 'chromium-mobile',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
      testMatch: /(routes|shell-navigation)\.spec\.ts$/,
    },
  ],
});
