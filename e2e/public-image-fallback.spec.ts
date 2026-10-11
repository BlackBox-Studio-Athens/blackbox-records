import { expect, test } from 'playwright/test';

import { waitForShell } from './fixtures';

test('public Images quota failures recover to the published original without repeating on resize', async ({ page }) => {
  const original = `https://blackbox-records-web-uat.pages.dev/media/content/${'a'.repeat(64)}`;
  const candidate = `https://images.blackboxrecordsathens.com/cdn-cgi/image/width=360,format=webp/${original}`;
  const shared = candidate.replace('width=360', 'width=720');
  const requests: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://www.glancelytics.com/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: '' }),
  );
  await page.route('**/api/store/listing-prices', (route) => route.fulfill({ json: [] }));
  await page.route(`${candidate.split('/cdn-cgi/')[0]}/cdn-cgi/**`, async (route) => {
    requests.push(route.request().url());
    await route.fulfill({ status: 429, contentType: 'text/plain', body: 'ERROR 9422: Free transformations exhausted' });
  });
  await page.route(original, async (route) => {
    requests.push(route.request().url());
    await route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M0 0h100v100H0z"/></svg>',
    });
  });
  await page.goto('releases/');
  await waitForShell(page);
  await page.evaluate(
    ({ candidate, shared }) => {
      const image = document.createElement('img');
      image.id = 'quota-fallback-probe';
      image.alt = 'Controlled public media';
      image.srcset = `${candidate} 360w, ${shared} 720w`;
      image.sizes = '100px';
      image.src = shared;
      document.querySelector('main')!.append(image);
    },
    { candidate, shared },
  );
  const image = page.locator('#quota-fallback-probe');
  await expect(image).toHaveAttribute('src', original);
  await image.evaluate((element: HTMLImageElement) => element.decode());
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  await expect(image).not.toHaveAttribute('srcset');
  const completedRequests = requests.slice();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  expect(requests).toEqual(completedRequests);
  expect(requests.filter((url) => url === original)).toHaveLength(1);
  expect(new Set(requests)).toEqual(new Set([candidate, shared, original]));
  // WebKit can start `src` while selecting `srcset`; it must still finish once at the original and stop on resize.
  expect(requests.length).toBeLessThanOrEqual(4);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter((message) => !/status of 429|status code of 429/.test(message))).toEqual([]);
});
