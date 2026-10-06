import { readFile } from 'node:fs/promises';
import type { StorePreorderShowcaseCandidate } from '../apps/web/src/components/store/StorePreorderShowcase';
import { expect, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';

test('Share your demo selects the existing inquiry flow and submits without leaving the shell', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/services/inquiries', (route) => route.fulfill({ json: { status: 'submitted' } }));
  await page.goto('./services/');
  await waitForShell(page);
  await plantSentinel(page);
  const demoAction = page.getByRole('link', { name: 'Share your demo', exact: true });
  await expect(demoAction).toBeVisible();
  expect((await demoAction.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await demoAction.click();
  await expect(page.getByLabel('Service', { exact: true })).toHaveValue('Share your demo');
  await page.getByLabel('Name', { exact: true }).fill('Demo test');
  await page.getByLabel('Email', { exact: true }).fill('demo-test@example.com');
  await page.getByLabel('Band / Project', { exact: true }).fill('Local test band');
  await page.getByLabel('Demo / Listening link', { exact: false }).fill('https://example.com/listen');
  await page.getByLabel('Message', { exact: true }).fill('A local demo inquiry test.');
  const submission = page.waitForRequest(
    (request) => request.url().endsWith('/api/services/inquiries') && request.method() === 'POST',
  );
  await page.locator('.services-inquiry-form button[type="submit"]').click();
  expect((await submission).postDataJSON()).toEqual({
    name: 'Demo test',
    email: 'demo-test@example.com',
    bandOrProject: 'Local test band',
    service: 'Share your demo',
    serviceDetails: 'https://example.com/listen',
    message: 'A local demo inquiry test.',
  });
  await expect(page.getByRole('heading', { name: 'Inquiry submitted' })).toBeVisible();
  expect(await sentinelIntact(page)).toBe(true);
  await page.getByRole('button', { name: 'Send another inquiry' }).click();
  await expect(page.getByLabel('Service', { exact: true })).toHaveValue('General');
  await page.locator('.site-footer-shell').getByRole('link', { name: 'Artists', exact: true }).click();
  await expect(page).toHaveURL(/\/artists\/$/);
  await page.goBack();
  await expect(page.getByLabel('Service', { exact: true })).toHaveValue('General');
  expect(await sentinelIntact(page)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const width of [320, 390, 430, 768, 1440]) {
  test(`footer links and description flow naturally at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('./services/');
    await waitForShell(page);
    const footer = page.locator('.site-footer-shell');
    await footer.scrollIntoViewIfNeeded();
    const description = footer.locator('.site-footer-description');
    await expect(description).toBeVisible();
    expect(await description.evaluate((element) => element.children.length)).toBe(0);
    expect(await description.evaluate((element) => getComputedStyle(element).whiteSpace)).toBe('normal');
    const links = footer.locator('.site-footer-nav-list a');
    const boxes = await links.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { text: element.textContent?.trim(), x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }),
    );
    expect(boxes.length).toBeGreaterThanOrEqual(6);
    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 0.01);
      if (width < 768) expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const delivery = footer.getByRole('link', { name: 'Delivery information', exact: true });
    await expect(delivery).toBeVisible();
    if (width < 768) {
      expect(
        await footer.locator('.site-footer-nav-list').evaluate((element) => getComputedStyle(element).columnCount),
      ).toBe('2');
      const deliveryBox = boxes.find((box) => box.text === 'Delivery information')!;
      expect(boxes.some((box) => Math.abs(box.y - deliveryBox.y) < 1 && Math.abs(box.x - deliveryBox.x) > 1)).toBe(
        true,
      );
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await plantSentinel(page);
    await footer.getByRole('link', { name: 'Releases', exact: true }).click();
    await expect(page).toHaveURL(/\/releases\/$/);
    await expect(page.getByRole('heading', { name: 'Releases', exact: true, level: 1 })).toBeVisible();
    expect(await sentinelIntact(page)).toBe(true);
  });
}

test('Afterwise prepared film plays silently and opens its full official video only on Watch', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const response = await page.request.get('preorder-showcase.json');
  expect(response.ok()).toBe(true);
  const candidates: StorePreorderShowcaseCandidate[] = await response.json();
  const accepted = candidates.find((candidate) => candidate.slug === 'disintegration-black-vinyl-lp');
  if (!accepted) throw new Error('Accepted Local Disintegration candidate is required');
  const filmUrl = '/blackbox-records/afterwise-film-fixture.mp4';
  const posterUrl = '/blackbox-records/afterwise-poster-fixture.jpg';
  await page.route('**/preorder-showcase.json', (route) =>
    route.fulfill({
      json: [
        {
          ...accepted,
          firstClipId: 'Cl7rWCTGEqY',
          clips: [
            {
              id: 'Cl7rWCTGEqY',
              title: 'Equilibrium · Live at Fuzz Club Athens',
              backgroundVideoUrl: filmUrl,
              posterUrl,
            },
          ],
        },
      ],
    }),
  );
  await page.route('**/api/store/listing-prices*', (route) =>
    route.fulfill({
      json: [
        {
          storeItemSlug: accepted.slug,
          presentationState: 'ready',
          availabilityState: 'stocked',
          displayPrice: '€25.00',
          preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
        },
      ],
    }),
  );
  const film = await readFile('apps/web/src/pages/_assets/video-posters/afterwise-equilibrium-loop.mp4');
  const poster = await readFile('apps/web/src/pages/_assets/video-posters/afterwise-equilibrium.jpg');
  await page.route('**/afterwise-film-fixture.mp4', (route) => route.fulfill({ contentType: 'video/mp4', body: film }));
  await page.route('**/afterwise-poster-fixture.jpg', (route) =>
    route.fulfill({ contentType: 'image/jpeg', body: poster }),
  );
  const providerRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).hostname.includes('youtube')) providerRequests.push(request.url());
  });
  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>Local full-video provider fixture</p>' }),
  );
  await page.goto('./');
  await waitForShell(page);
  const chapter = page.getByRole('article', { name: 'Disintegration', exact: true });
  const video = chapter.locator('video');
  await video.scrollIntoViewIfNeeded();
  await expect
    .poll(() => video.evaluate((element) => (element as HTMLVideoElement).readyState))
    .toBeGreaterThanOrEqual(2);
  await expect.poll(() => video.evaluate((element) => !(element as HTMLVideoElement).paused)).toBe(true);
  expect(await video.evaluate((element) => (element as HTMLVideoElement).muted)).toBe(true);
  expect(providerRequests).toEqual([]);
  await chapter.screenshot({
    path: `.codex-artifacts/catalog-video-contact/afterwise-${testInfo.project.name}-390.png`,
  });
  const watch = chapter.getByRole('button', { name: 'Watch full video', exact: true });
  await watch.click();
  const iframe = chapter.locator('iframe');
  await expect(iframe).toHaveAttribute(
    'src',
    'https://www.youtube-nocookie.com/embed/Cl7rWCTGEqY?autoplay=1&playsinline=1&rel=0&color=white&controls=1&fs=1',
  );
  await expect.poll(() => video.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(true);
  await chapter.getByRole('button', { name: 'Close video', exact: true }).click();
  await expect(iframe).toHaveCount(0);
  await expect(watch).toBeFocused();
});
