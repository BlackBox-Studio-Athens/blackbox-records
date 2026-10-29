import { expect, localRepresentativePaths, test, waitForIsland, waitForShell } from './fixtures';
import type { Page } from 'playwright/test';

const storeItemSlug = localRepresentativePaths.storeItem.split('/').filter(Boolean).pop()!;

async function openPreorderItem(page: Page, width = 390) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.route(`**/api/store/items/${storeItemSlug}`, (route) =>
    route.fulfill({
      json: {
        storeItemSlug,
        variantId: `${storeItemSlug}_standard`,
        availability: { label: 'In stock', status: 'available' },
        canCheckout: true,
        catalogStatus: 'ready',
        price: { kind: 'fixed', amountMinor: 2800, currencyCode: 'EUR', display: '€28.00' },
        preorder: { shipEstimate: { kind: 'month', month: '2026-11', part: null } },
      },
    }),
  );
  await page.goto(localRepresentativePaths.storeItem.replace(/^\//, ''));
  await waitForShell(page);
  await waitForIsland(page, 'StoreItemPurchaseActions');
}

const bar = (page: Page) => page.getByRole('region', { name: 'Quick purchase' });
const inlineAction = (page: Page) => page.locator('[data-store-item-add-to-cart]');

// Scroll so the inline action's top edge sits `offset` px above the viewport bottom (negative: still below it).
async function scrollInlineActionTo(page: Page, offset: number) {
  await inlineAction(page).evaluate((element, offset) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - window.innerHeight + offset, behavior: 'instant' });
  }, offset);
}

test('phone item page keeps PRE-ORDER reachable until the shopper reaches it @phone', async ({ page }) => {
  await openPreorderItem(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const belowFold = await inlineAction(page).evaluate((element) => element.getBoundingClientRect().top > innerHeight);
  test.skip(!belowFold, 'The representative item shows its inline action on the first screen.');

  await expect(bar(page)).toBeVisible();
  await expect(bar(page)).toHaveAttribute('data-shown', 'true');
  // Fixed to the viewport's bottom edge, with no transformed ancestor in the way.
  const edge = await bar(page).evaluate((element) => Math.round(innerHeight - element.getBoundingClientRect().bottom));
  // A sub-pixel overhang rounds to -0, which toBe (Object.is) rejects; any whole-pixel gap still fails.
  expect(Math.abs(edge)).toBe(0);
  await expect(bar(page)).toContainText('€28.00');
  await expect(bar(page).locator('.store-buy-bar__status--preorder')).toHaveText(/^Pre-order · ships/);
  const barAction = bar(page).getByRole('button', { name: 'Pre-order' });
  await expect(barAction).toHaveCSS('min-height', '44px');

  // Reaching the inline action sends the bar away; reading below keeps it away.
  await scrollInlineActionTo(page, 40);
  await expect(bar(page)).toHaveAttribute('data-shown', 'false');
  await expect(bar(page)).toHaveAttribute('inert', '');
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect(bar(page)).toHaveAttribute('data-shown', 'false');

  // Scrolling back above the inline action brings it back.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(bar(page)).toHaveAttribute('data-shown', 'true');

  // One jump from the top past the action, with no frame showing it, still hides the bar.
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect(bar(page)).toHaveAttribute('data-shown', 'false');

  // The bar's control runs the same add as the inline action and confirms in place.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(bar(page)).toHaveAttribute('data-shown', 'true');
  await barAction.click();
  const drawer = page.getByRole('dialog', { name: 'Cart', exact: true });
  await expect(drawer).toBeVisible();
  // A cart holding a pre-order keeps a readable Sea Green Checkout.
  const checkout = drawer.locator('[data-store-cart-checkout]');
  await expect(checkout).toHaveCSS('background-color', 'rgb(45, 118, 106)');
  await expect(checkout).toHaveCSS('color', 'rgb(245, 245, 245)');
});

test('buy bar transitions perform no layout and stop under reduced motion @phone', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Layout counts come from the Chromium DevTools protocol.');
  await openPreorderItem(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(bar(page)).toHaveAttribute('data-ready', '');
  await expect(bar(page)).toHaveCSS('transition-duration', /0\.3s/);

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const layouts = async () =>
    (await cdp.send('Performance.getMetrics')).metrics.find((metric) => metric.name === 'LayoutCount')!.value;
  await scrollInlineActionTo(page, 40);
  await expect(bar(page)).toHaveAttribute('data-shown', 'false');
  const start = await layouts();
  await page.waitForTimeout(400);
  expect(await layouts()).toBe(start);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(bar(page)).toHaveCSS('transition-duration', '0s');
});

// A stand-in with the shell player's class and open state reads the shared lift rule.
async function miniPlayerLift(page: Page) {
  return page.evaluate(() => {
    const mini = document.createElement('div');
    mini.className = 'music-streaming-service-embedded-player-mini-player';
    mini.dataset.state = 'open';
    document.body.append(mini);
    const transform = getComputedStyle(mini).transform;
    mini.remove();
    return transform === 'none' ? 0 : new DOMMatrix(transform).m42;
  });
}

test('the open mini player lifts above the shown buy bar @phone', async ({ page }) => {
  await openPreorderItem(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(bar(page)).toHaveAttribute('data-shown', 'true');
  const barHeight = await bar(page).evaluate((element) => (element as HTMLElement).offsetHeight);
  await expect.poll(() => miniPlayerLift(page)).toBeCloseTo(-barHeight, 0);

  await scrollInlineActionTo(page, 40);
  await expect(bar(page)).toHaveAttribute('data-shown', 'false');
  await expect.poll(() => miniPlayerLift(page)).toBe(0);
});

test('shell navigation away from the item removes the bar and releases the player offset @phone', async ({ page }) => {
  await openPreorderItem(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(bar(page)).toHaveAttribute('data-shown', 'true');
  await page.getByRole('button', { name: /menu/i }).first().click();
  await page.getByRole('dialog').getByRole('link', { name: 'Releases', exact: true }).click();
  await expect(page).toHaveURL(/\/releases\/$/);
  await expect(page.locator('.store-buy-bar')).toHaveCount(0);
  expect(await miniPlayerLift(page)).toBe(0);
});

test('no buy bar shows from 40rem', async ({ page }) => {
  await openPreorderItem(page, 1280);
  await expect(bar(page)).toBeHidden();
});
