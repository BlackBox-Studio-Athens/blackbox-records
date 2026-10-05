import { expect, test, waitForIsland, waitForShell } from './fixtures';

for (const category of [
  { path: 'store/', label: 'All' },
  { path: 'store/blackbox-releases/', label: 'BlackBox Releases' },
  { path: 'store/distro/', label: 'Distro' },
]) {
  test(`international shipping strip precedes ${category.label} Store results`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' }));
    await page.goto(category.path);
    await waitForShell(page);
    const notice = page.getByRole('complementary', { name: 'Shipping outside Greece' });
    await expect(notice).toBeVisible();
    await expect(notice).toContainText('We ship within Greece only, for now.');
    await expect(notice).toContainText("Ordering from abroad? Email us and we'll arrange it with you.");
    await expect(
      page.getByRole('navigation', { name: 'Store categories' }).locator('[aria-current="page"]'),
    ).toHaveText(category.label);
    expect(
      await notice.evaluate((element) => {
        const categories = document.querySelector('[aria-label="Store categories"]')!;
        const results = document.querySelector('[data-store-search-root], [data-distro-search-root]')!;
        return {
          afterCategories: Boolean(categories.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING),
          beforeResults: Boolean(element.compareDocumentPosition(results) & Node.DOCUMENT_POSITION_FOLLOWING),
          outsideFilters: element.closest('[data-store-search-root], [data-distro-search-root]') === null,
        };
      }),
    ).toEqual({ afterCategories: true, beforeResults: true, outsideFilters: true });
    const email = notice.getByRole('link', { name: 'Email us to order', exact: true });
    const mailto = new URL((await email.getAttribute('href'))!);
    expect(mailto.protocol).toBe('mailto:');
    expect(mailto.pathname).toBe('orders@blackboxrecordsathens.com');
    expect(mailto.searchParams.get('subject')).toBe('Order from outside Greece');
    expect(mailto.searchParams.get('body')).toMatch(/^Items:[ \t]*\nCountry:\nCity:$/);
    expect((await email.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.getByRole('link', { name: 'Delivery rates and terms', exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(email).toBeFocused();
    await expect(email).toHaveCSS('outline-style', 'solid');
    await expect(email).toHaveCSS('outline-width', '2px');
  });
}

for (const country of ['GR', 'XX']) {
  test(`Store shipping strip stays hidden for ${country}`, async ({ page }) => {
    await page.route('**/cdn-cgi/trace', (route) =>
      route.fulfill({ contentType: 'text/plain', body: `loc=${country}\n` }),
    );
    const trace = page.waitForResponse('**/cdn-cgi/trace');
    await page.goto('store/');
    await trace;
    await waitForIsland(page, 'InternationalOrderNotice');
    await expect(page.getByRole('complementary', { name: 'Shipping outside Greece' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Email us to order' })).toHaveCount(0);
    await expect(page.locator('#all-store-catalog')).toBeVisible();
    expect(
      await page
        .locator('astro-island[component-url*="InternationalOrderNotice"]')
        .evaluate((island) => island.parentElement!.getBoundingClientRect().height),
    ).toBe(0);
  });
}

test('Store remains usable when its country request fails', async ({ page }) => {
  await page.addInitScript(() => {
    const fetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      if (input === '/cdn-cgi/trace') {
        document.documentElement.dataset.e2eCountryRequest = 'failed';
        return Promise.reject(new TypeError('Country lookup failed'));
      }
      return fetch(input, init);
    };
  });
  await page.goto('store/');
  await waitForIsland(page, 'InternationalOrderNotice');
  await expect(page.locator('html')).toHaveAttribute('data-e2e-country-request', 'failed');
  await expect(page.getByRole('complementary', { name: 'Shipping outside Greece' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Email us to order' })).toHaveCount(0);
  await expect(page.locator('#all-store-catalog')).toBeVisible();
});

test('Store shipping strip fits 390px without squeezing its email target', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' }));
  await page.goto('store/');
  const notice = page.getByRole('complementary', { name: 'Shipping outside Greece' });
  await expect(notice).toBeVisible();
  const email = notice.getByRole('link', { name: 'Email us to order', exact: true });
  const box = (await notice.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(16);
  expect(box.x + box.width).toBeLessThanOrEqual(374);
  expect((await email.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await notice.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await email.focus();
  await expect(email).toBeFocused();
});
