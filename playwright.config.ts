import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { defineConfig, devices } from 'playwright/test';

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
// Phone projects run these specs whole (each skips its desktop-only cases) plus every test titled @phone elsewhere.
// A project's grep sees the spec file name in the title path, so one grep selects both. Desktop projects skip @phone
// tests: a 390px viewport there still reports a mouse, hover and a fine pointer.
const phoneSpecs =
  /\b(routes|shell-navigation|store-cart|withdrawal|player-continuity|public-image-fallback)\.spec\.ts\b/;
const phone = /@phone\b/;

export default defineConfig({
  testDir: 'e2e',
  outputDir: `${artifacts}/test-results`,
  fullyParallel: true,
  // ponytail: astro dev compiles each route and lazy chunk on first request and re-renders the Store listing every
  // time (about 7 s here, slower with more workers). Two workers and long waits keep it stable; the built preview that
  // the push run serves does not need them, so it uses every core of the 4-vCPU runner.
  workers: process.env.BLACKBOX_E2E_PREVIEW === '1' ? 4 : 2,
  // A push runs the Chromium and Firefox projects in four shards and webkit-mobile in its own job; one retry keeps a
  // network hiccup (a font download, a slow first paint) from failing the release, and the report marks it flaky.
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 30_000 },
  reporter: [['list'], ['json', { outputFile: `${artifacts}/summary.json` }]],
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    // Home and Releases render open pre-orders from this projection, as the hosted renderer does from commerce.
    env: { BLACKBOX_E2E: '1', BLACKBOX_PREORDER_PROJECTION: path.join(__dirname, 'e2e', 'preorder-projection.json') },
    // Reuses whatever already serves this checkout's URL (site:dev:bg or the full stack); otherwise runs astro dev for
    // this run only. Plain node, not `pnpm site:dev`: pnpm runs its script in another process group, which Playwright's
    // teardown does not stop, so on Linux the run never exits after the last test.
    command: `node --import tsx apps/web/scripts/start-static-site-dev.mjs${process.env.BLACKBOX_E2E_PREVIEW === '1' ? ' --preview' : ''}`,
    url: baseURL,
    reuseExistingServer: process.env.BLACKBOX_E2E_PREVIEW !== '1',
    timeout: 180_000,
  },
  projects: [
    { name: 'chromium-desktop', use: { viewport: { width: 1440, height: 900 } }, grepInvert: phone },
    {
      name: 'chromium-mobile',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
      grep: [phoneSpecs, phone],
    },
    {
      name: 'firefox-desktop',
      use: { browserName: 'firefox', viewport: { width: 1440, height: 900 } },
      testMatch: /(store-cart|home-preorders|home-swipe-rows|release-merchandising|catalog-video-contact)\.spec\.ts$/,
      grepInvert: phone,
    },
    {
      // Firefox has no isMobile; its phone tests come from the specs firefox-desktop runs.
      name: 'firefox-compact',
      use: { browserName: 'firefox', viewport: { width: 390, height: 844 }, hasTouch: true },
      testMatch: /(store-cart|home-preorders|home-swipe-rows|release-merchandising|catalog-video-contact)\.spec\.ts$/,
      grep: [/\bstore-cart\.spec\.ts\b/, phone],
    },
    {
      // The iOS Safari engine on the shell, cart and player paths; CI installs it in its own leg.
      name: 'webkit-mobile',
      use: { ...devices['iPhone 13'] },
      testMatch:
        /(routes|shell-navigation|store-cart|store-crate|withdrawal|player-continuity|public-image-fallback|home-preorders|home-swipe-rows|home-motto|home-touch-prefetch|about-contact)\.spec\.ts$/,
      grep: [phoneSpecs, phone],
    },
  ],
});
