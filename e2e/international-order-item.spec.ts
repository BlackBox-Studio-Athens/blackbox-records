import { expect, localRepresentativePaths, test, waitForIsland, waitForShell } from './fixtures';

const storeItemSlug = localRepresentativePaths.storeItem.split('/').filter(Boolean).pop()!;
const readyOffer = {
  storeItemSlug,
  variantId: `${storeItemSlug}_standard`,
  availability: { label: 'In stock', status: 'available' },
  canCheckout: true,
  catalogStatus: 'ready',
  price: { kind: 'fixed', amountMinor: 2800, currencyCode: 'EUR', display: '€28.00' },
};

for (const width of [1440, 390]) {
  test(`International item notice follows the fused low-stock action at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 960 });
    await page.route(`**/api/store/items/${storeItemSlug}`, (route) =>
      route.fulfill({ json: { ...readyOffer, lowStockQuantity: 2 } }),
    );
    let resolveCountry = () => {};
    let countryRequestStarted = () => {};
    const countryReady = new Promise<void>((resolve) => {
      resolveCountry = resolve;
    });
    const countryRequested = new Promise<void>((resolve) => {
      countryRequestStarted = resolve;
    });
    await page.route('**/cdn-cgi/trace', async (route) => {
      countryRequestStarted();
      await countryReady;
      await route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' });
    });
    const navigation = page.goto(localRepresentativePaths.storeItem.replace(/^\//, ''));
    await countryRequested;
    const purchase = page.locator('[data-store-purchase-group]');
    const email = purchase.getByRole('link', { name: 'Email us to order', exact: true });
    try {
      // Release within the real 3s deadline; unrelated islands may still be loading.
      await expect(email).toHaveCount(0);
    } finally {
      resolveCountry();
    }
    const response = await navigation;
    expect(await response!.text()).not.toContain('Ships within Greece only. Outside Greece?');
    await waitForShell(page);
    await waitForIsland(page, 'StoreItemPurchaseActions');
    await waitForIsland(page, 'InternationalOrderNotice');

    await expect(email).toBeVisible();
    await expect(email.locator('..')).toContainText('Ships within Greece only. Outside Greece?');

    const title = (await purchase.getByRole('heading', { level: 1 }).textContent())!.trim();
    const href = await email.getAttribute('href');
    expect(href).toBe(
      `mailto:orders@blackboxrecordsathens.com?subject=Order%20from%20outside%20Greece&body=${encodeURIComponent(`Items: ${title}\nCountry:\nCity:`)}`,
    );
    await expect(purchase.locator('[data-store-item-low-stock]')).toHaveText('Only 2 left');
    await expect(
      purchase.locator('.store-low-stock-purchase > [data-store-item-low-stock] + [data-store-item-add-to-cart]'),
    ).toBeVisible();
    await expect(
      purchase.locator(
        'astro-island[component-url*="StoreItemPurchaseActions"] + astro-island[component-url*="InternationalOrderNotice"] + [data-purchase-information]',
      ),
    ).toHaveCount(1);
    await email.scrollIntoViewIfNeeded();
    expect((await email.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await email.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(email).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('International item notice follows the complete pre-order presentation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' }));
  await page.route(`**/api/store/items/${storeItemSlug}`, (route) =>
    route.fulfill({
      json: { ...readyOffer, preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } } },
    }),
  );
  await page.goto(localRepresentativePaths.storeItem.replace(/^\//, ''));
  await waitForShell(page);
  await waitForIsland(page, 'StoreItemPurchaseActions');
  const purchase = page.locator('[data-store-purchase-group]');
  await expect(purchase.locator('.preorder-facts')).toBeVisible();
  await expect(purchase.getByRole('button', { name: 'Pre-order', exact: true })).toHaveClass(/preorder-action/);
  await expect(purchase.getByText(/We send the vinyl when the copies arrive/)).toBeVisible();
  await expect(purchase.getByRole('link', { name: 'Email us to order', exact: true })).toBeVisible();
  await expect(purchase.locator('[data-purchase-information]')).toBeVisible();
});

test('International item notice stays absent for Greece', async ({ page }) => {
  await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: 'loc=GR\n' }));
  await page.goto(localRepresentativePaths.storeItem.replace(/^\//, ''));
  await waitForShell(page);
  await waitForIsland(page, 'InternationalOrderNotice');
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('blackbox:shopper-country'))).toBe('GR');
  await expect(page.getByRole('link', { name: 'Email us to order', exact: true })).toHaveCount(0);
  await expect(page.getByText('Ships within Greece only. Outside Greece?', { exact: true })).toHaveCount(0);
  await expect(page.locator('[data-store-item-add-to-cart]')).toBeEnabled();
});

test('International item notice stays absent when the country request fails', async ({ page }) => {
  await page.addInitScript(() => {
    const browserFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (new URL(url, location.href).pathname === '/cdn-cgi/trace') {
        return Promise.reject(new TypeError('Deterministic country lookup failure'));
      }
      return browserFetch(input, init);
    };
  });
  await page.goto(localRepresentativePaths.storeItem.replace(/^\//, ''));
  await waitForShell(page);
  await waitForIsland(page, 'InternationalOrderNotice');
  await expect(page.locator('[data-store-item-add-to-cart]')).toBeEnabled();
  await expect(page.getByRole('link', { name: 'Email us to order', exact: true })).toHaveCount(0);
  await expect(page.getByText('Ships within Greece only. Outside Greece?', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem('blackbox:shopper-country'))).toBeNull();
});
