import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { defineConfig } from 'playwright/test';

// This checkout's Local URL including the Astro base path: the port start-static-site-dev.mjs serves on, so a
// linked worktree never tests the site another checkout serves. Playwright compiles this config to CommonJS, which
// cannot load the ES module helper, so a child process prints it.
const baseURL = execFileSync(process.execPath, [path.join(__dirname, 'scripts', 'local-resources.mjs')], {
  cwd: __dirname,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
  windowsHide: true,
}).trim();
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
    env: { BLACKBOX_E2E: '1' },
    // Reuses whatever already serves this checkout's URL (site:dev:bg or the full stack); otherwise runs astro dev for
    // this run only. Plain node, not `pnpm site:dev`: pnpm runs its script in another process group, which Playwright's
    // teardown does not stop, so on Linux the run never exits after the last test.
    command: `node --import tsx apps/web/scripts/start-static-site-dev.mjs${process.env.BLACKBOX_E2E_PREVIEW === '1' ? ' --preview' : ''}`,
    url: baseURL,
    reuseExistingServer: process.env.BLACKBOX_E2E_PREVIEW !== '1',
    timeout: 180_000,
  },
  projects: [
    { name: 'chromium-desktop', use: { viewport: { width: 1440, height: 900 } } },
    {
      name: 'chromium-mobile',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
      testMatch: /(routes|shell-navigation|store-cart)\.spec\.ts$/,
    },
    {
      name: 'firefox-desktop',
      use: { browserName: 'firefox', viewport: { width: 1440, height: 900 } },
      testMatch: /(store-cart|home-preorders|release-merchandising)\.spec\.ts$/,
    },
    {
      name: 'firefox-compact',
      use: { browserName: 'firefox', viewport: { width: 390, height: 844 }, hasTouch: true },
      testMatch: /store-cart\.spec\.ts$/,
    },
  ],
});
