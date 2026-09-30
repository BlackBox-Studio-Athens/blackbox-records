import { expect, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';

// Provider embeds are replaced by a local fixture, as in apps/backend/scripts/smoke-content-preview.mjs.
const providerEmbeds = /^https:\/\/(bandcamp\.com|embed\.tidal\.com)\//;

test('player survives shell navigation, minimize/reopen and history; Stop destroys it', async ({ page }) => {
  await page.route(providerEmbeds, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  await page.goto('releases/');
  await waitForShell(page);
  await plantSentinel(page);

  await page.locator('[data-music-streaming-service-embedded-player-trigger]').first().click();
  const modal = page.getByRole('dialog', { name: 'Music player' });
  await expect(modal).toBeVisible();
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  // Real embed interaction is what turns close into minimize.
  await iframe.contentFrame().getByRole('button', { name: 'Player fixture' }).click();
  await page.getByRole('button', { name: 'Minimize player' }).click();
  await expect(modal).toBeHidden();
  const originalIframe = await iframe.elementHandle();
  const isOriginalIframeConnected = () => originalIframe.evaluate((element) => element.isConnected);

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Store' }).click();
  await expect(page.getByRole('searchbox', { name: 'Search Store' })).toBeVisible();
  expect(await isOriginalIframeConnected()).toBe(true);

  await page.getByRole('button', { name: 'Open player' }).click();
  await expect(modal).toBeVisible();
  expect(await isOriginalIframeConnected()).toBe(true);
  await page.getByRole('button', { name: 'Minimize player' }).click();
  await expect(modal).toBeHidden();

  await page.goBack();
  await expect(page).toHaveURL(/\/releases\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Releases' })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('searchbox', { name: 'Search Store' })).toBeVisible();
  expect(await sentinelIntact(page)).toBe(true);
  expect(await isOriginalIframeConnected()).toBe(true);

  await page.getByRole('button', { name: 'Stop player' }).click();
  await expect(iframe).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open player' })).toBeHidden();
});
