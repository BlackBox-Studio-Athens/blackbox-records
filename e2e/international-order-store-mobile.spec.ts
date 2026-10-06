import { expect, plantSentinel, sentinelIntact, test, waitForIsland, waitForShell } from './fixtures';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('mobile Store shares its country lookup through categories and refreshes it on reload', async ({ page }) => {
  let requests = 0;
  await page.route('**/cdn-cgi/trace', (route) => {
    requests++;
    return route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' });
  });
  await page.goto('store/');
  await waitForShell(page);
  await plantSentinel(page);
  const notice = page.getByRole('complementary', { name: 'Shipping outside Greece' });
  await expect(notice).toBeVisible();
  await expect(notice).toHaveCSS('flex-direction', 'column');
  const email = notice.getByRole('link', { name: 'Email us to order', exact: true });
  expect((await email.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const mailto = new URL((await email.getAttribute('href'))!);
  expect(mailto.pathname).toBe('orders@blackboxrecordsathens.com');
  expect(mailto.searchParams.get('subject')).toBe('Order from outside Greece');
  expect(mailto.searchParams.get('body')).toBe('Items:\nCountry:\nCity:');
  await page.getByRole('link', { name: 'Delivery rates and terms', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(email).toBeFocused();
  await expect(email).toHaveCSS('outline-width', '2px');

  const categories = page.getByRole('navigation', { name: 'Store categories' });
  for (const label of ['BlackBox Releases', 'Distro', 'All']) {
    await categories.getByRole('link', { name: label, exact: true }).click();
    await expect(categories.locator('[aria-current="page"]')).toHaveText(label);
    await expect(notice).toHaveCount(1);
    await expect(notice).toBeVisible();
    expect(await sentinelIntact(page)).toBe(true);
  }
  expect(requests).toBe(1);
  // Merch remains a valid route even while an empty catalog keeps it out of navigation.
  await page.goto('store/merch/');
  await expect(notice).toBeVisible();
  await page.reload();
  await expect(notice).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('blackbox:shopper-country'))).toBeNull();
  expect(requests).toBe(3);
});

test('mobile delivery correction survives shell navigation and reload, and can be changed back', async ({ page }) => {
  let requests = 0;
  await page.route('**/cdn-cgi/trace', (route) => {
    requests++;
    return route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' });
  });
  await page.goto('store/');
  await waitForShell(page);
  await plantSentinel(page);
  const notice = page.getByRole('complementary', { name: 'Shipping outside Greece' });
  const correction = notice.getByRole('button', { name: 'Deliver to Greece', exact: true });
  await expect(correction).toBeVisible();
  expect((await correction.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await correction.click();
  const change = page.getByRole('button', { name: 'Change delivery to outside Greece', exact: true });
  await expect(notice).toHaveCount(0);
  await expect(page.locator('.international-order-delivery')).toContainText('Delivery: Greece');
  await expect(change).toBeFocused();
  const categories = page.getByRole('navigation', { name: 'Store categories' });
  for (const label of ['Distro', 'BlackBox Releases', 'All', 'Distro']) {
    await categories.getByRole('link', { name: label, exact: true }).click();
    await expect(categories.locator('[aria-current="page"]')).toHaveText(label);
    await expect(notice).toHaveCount(0);
    await expect(change).toBeVisible();
    expect(await sentinelIntact(page)).toBe(true);
  }
  expect(requests).toBe(1);
  await page.reload();
  await waitForIsland(page, 'InternationalOrderNotice');
  await expect(notice).toHaveCount(0);
  await expect(change).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('blackbox:delivery-destination'))).toBe('GR');
  await change.click();
  await expect(notice.getByRole('link', { name: 'Email us to order', exact: true })).toBeVisible();
  await expect(correction).toBeFocused();
  expect(await page.evaluate(() => sessionStorage.getItem('blackbox:delivery-destination'))).toBe('international');
});

test('mobile Store discards a stale foreign session hint and detects a changed Greek network on reload', async ({
  page,
}) => {
  await page.addInitScript(() => sessionStorage.setItem('blackbox:shopper-country', 'US'));
  let country = 'US';
  await page.route('**/cdn-cgi/trace', (route) =>
    route.fulfill({ contentType: 'text/plain', body: `loc=${country}\n` }),
  );
  await page.goto('store/');
  const notice = page.getByRole('complementary', { name: 'Shipping outside Greece' });
  await expect(notice).toBeVisible();
  country = 'GR';
  const trace = page.waitForResponse('**/cdn-cgi/trace');
  await page.reload();
  await trace;
  await waitForIsland(page, 'InternationalOrderNotice');
  await expect(notice).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Deliver to Greece', exact: true })).toHaveCount(0);
  await expect(page.locator('#all-store-catalog')).toBeVisible();
});

for (const country of ['GR', 'XX', 'failed']) {
  test(`mobile Store hides the shipping strip for ${country}`, async ({ page }) => {
    await page.addInitScript((value) => {
      const fetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        if (input === '/cdn-cgi/trace') {
          document.documentElement.dataset.e2eCountryRequest = value;
          return value === 'failed'
            ? Promise.reject(new TypeError('Country lookup failed'))
            : Promise.resolve(new Response(`loc=${value}\n`));
        }
        return fetch(input, init);
      };
    }, country);
    await page.goto('store/');
    await waitForIsland(page, 'InternationalOrderNotice');
    await expect(page.locator('html')).toHaveAttribute('data-e2e-country-request', country);
    await expect(page.getByRole('complementary', { name: 'Shipping outside Greece' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Email us to order' })).toHaveCount(0);
    await expect(page.locator('#all-store-catalog')).toBeVisible();
  });
}

test('mobile shipping notice reflows at the CSS width of 200 percent zoom', async ({ page }) => {
  await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' }));
  await page.goto('store/');
  const notice = page.getByRole('complementary', { name: 'Shipping outside Greece' });
  await expect(notice).toBeVisible();
  // A 195px layout viewport checks reflow equivalent to 200% browser zoom at 390px.
  await page.setViewportSize({ width: 195, height: 422 });
  await expect(notice).toHaveCSS('flex-direction', 'column');
  expect(await notice.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const email = notice.getByRole('link', { name: 'Email us to order', exact: true });
  expect((await email.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('link', { name: 'Delivery rates and terms', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(email).toBeFocused();
});
