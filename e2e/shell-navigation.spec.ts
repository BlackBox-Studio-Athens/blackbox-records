import { expect, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';

const main = 'main[data-app-shell-main]';

test('header section link swaps main in place and shows the delayed Store status', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The primary header navigation is desktop only.');
  await page.goto('./');
  await waitForShell(page);
  await plantSentinel(page);
  // Delay only the shell's fetch of the Store page so the 750 ms "Loading Store" feedback is deterministic.
  await page.route('**/blackbox-records/store/', async (route) => {
    if (route.request().resourceType() === 'fetch') {
      await new Promise((resolve) => setTimeout(resolve, 1_200));
    }
    await route.continue();
  });

  const storeLink = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Store' });
  await storeLink.click();
  const routeStatus = page.locator('.app-shell-route-loading-indicator');
  await expect(routeStatus.getByText('Loading Store')).toBeVisible();
  await expect(routeStatus.getByText('Loading Store')).toBeHidden();
  await expect(routeStatus).toHaveAttribute('data-state', 'closed');

  await expect(page).toHaveURL(/\/blackbox-records\/store\/$/);
  await expect(page.getByRole('searchbox', { name: 'Search Store' })).toBeVisible();
  await expect(page.locator(main)).toBeFocused();
  await expect(storeLink).toHaveAttribute('aria-current', 'page');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  expect(await sentinelIntact(page)).toBe(true);
});

test('detail link opens an overlay that closes back to the list; a direct load renders the full page', async ({
  page,
}) => {
  await page.goto('releases/');
  await waitForShell(page);
  await plantSentinel(page);

  await page.locator('a.prose-card-link[href*="/releases/"]').first().click();
  const overlay = page.getByRole('dialog');
  await expect(overlay).toBeVisible();
  await expect(overlay.locator('[data-app-shell-overlay-kind="releases"]')).toBeVisible();
  await expect(page).toHaveURL(/\/releases\/[^/]+\/$/);
  const detailUrl = page.url();

  await page.getByRole('button', { name: 'Close detail view' }).click();
  await expect(overlay).toBeHidden();
  await expect(page).toHaveURL(/\/releases\/$/);
  expect(await sentinelIntact(page)).toBe(true);

  await page.goto(detailUrl);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator(main).getByRole('heading', { level: 1 })).toBeVisible();
});

test('mobile navigation sheet drives shell navigation without horizontal overflow', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile navigation only renders below the desktop breakpoint.');
  await page.goto('./');
  await waitForShell(page);
  await plantSentinel(page);

  await page.locator('[data-app-shell-mobile-navigation-trigger]').click();
  const mobileNav = page.getByRole('navigation', { name: 'Mobile' });
  await expect(mobileNav).toBeVisible();
  await mobileNav.getByRole('link', { name: 'Store' }).click();

  await expect(page).toHaveURL(/\/blackbox-records\/store\/$/);
  await expect(mobileNav).toBeHidden();
  await expect(page.getByRole('searchbox', { name: 'Search Store' })).toBeVisible();
  await expect(page.locator(main)).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await sentinelIntact(page)).toBe(true);
});
