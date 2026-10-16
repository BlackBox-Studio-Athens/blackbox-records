import {
  expect,
  expectNoHorizontalOverflow,
  type Page,
  plantSentinel,
  sentinelIntact,
  test,
  waitForShell,
} from './fixtures';

const film = (page: Page) => page.locator('video[data-home-hero-film]');
const filmState = (page: Page) =>
  film(page).evaluate((video: HTMLVideoElement) => ({
    paused: video.paused,
    muted: video.muted,
    source: video.currentSrc,
    ready: video.hasAttribute('data-ready'),
  }));
const still = (page: Page) => page.locator('.homepage-hero-section__media-image');
// Flags any frame that would paint the still, so a film-capable visit proves the film is what appears first.
const recordStill = (page: Page) =>
  page.addInitScript(() => {
    const record = () => {
      const image = document.querySelector('.homepage-hero-section__media-image');
      if (image && getComputedStyle(image).visibility === 'visible') Object.assign(window, { stillShown: true });
      requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
  });
const stillShown = (page: Page) => page.evaluate(() => 'stillShown' in window);
const filmRequests = (page: Page) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('home-hero-intro-')) requests.push(request.url());
  });
  return requests;
};

test('the hero film plays the landscape loop, pauses on request and out of view, and survives shell navigation', async ({
  page,
}) => {
  const requests = filmRequests(page);
  await recordStill(page);
  await page.goto('./');
  await waitForShell(page);
  await plantSentinel(page);

  await expect(film(page)).toHaveAttribute('data-ready', '', { timeout: 15_000 });
  const playing = await filmState(page);
  expect(playing).toMatchObject({ paused: false, muted: true });
  expect(playing.source).toContain('home-hero-intro-landscape');
  expect(requests.every((url) => url.includes('landscape'))).toBe(true);
  // The still stays the hero's eager image for the fallback, but never painted before the film.
  await expect(still(page)).toHaveAttribute('fetchpriority', 'high');
  await expect(still(page)).toBeHidden();
  expect(await stillShown(page)).toBe(false);
  await expect(page.locator('.homepage-hero-section__media-layer')).toHaveAttribute('aria-hidden', 'true');

  // The hero carries no film control; pausing is automatic.
  await expect(page.locator('#homepage-hero-section').getByRole('button')).toHaveCount(0);

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.7));
  await expect.poll(async () => (await filmState(page)).paused).toBe(true);
  // A paused film keeps its frame instead of returning to the still.
  expect((await filmState(page)).ready).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(async () => (await filmState(page)).paused).toBe(false);

  await page.evaluate(() => document.documentElement.setAttribute('data-music-player-session', ''));
  await expect.poll(async () => (await filmState(page)).paused).toBe(true);
  await page.evaluate(() => document.documentElement.removeAttribute('data-music-player-session'));
  await expect.poll(async () => (await filmState(page)).paused).toBe(false);

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Who we are' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(film(page)).toHaveCount(0);
  await page.getByRole('banner').getByRole('link', { name: 'BlackBox Records' }).click();
  await expect(page).toHaveURL(/\/blackbox-records\/$/);
  await expect(film(page)).toHaveAttribute('data-ready', '', { timeout: 15_000 });
  expect((await filmState(page)).paused).toBe(false);
  expect(await stillShown(page)).toBe(false);
  expect(await sentinelIntact(page)).toBe(true);
});

test('reduced motion keeps the still without requesting the film', async ({ page }) => {
  const requests = filmRequests(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await waitForShell(page);
  await expect(still(page)).toBeVisible();
  await page.waitForTimeout(2_000);
  expect(await filmState(page)).toMatchObject({ paused: true, ready: false, source: '' });
  expect(requests).toEqual([]);
});

test('a failed film shows the still at once', async ({ page }) => {
  // An undecodable file fails like a broken source without a network error in the console.
  await page.route('**/home-hero-intro-*', (route) => route.fulfill({ contentType: 'video/mp4', body: 'broken' }));
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await waitForShell(page);
  await expect(page.locator('#homepage-hero-section')).toHaveAttribute('data-still', '');
  await expect(still(page)).toBeVisible();
  expect((await filmState(page)).ready).toBe(false);
});

test('a film that never arrives leaves the dark ground for the still within 2.5 s', async ({ page }) => {
  // The request is never answered, as on a stalled connection.
  await page.route('**/home-hero-intro-*', () => {});
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(still(page)).toBeHidden();
  await expect(still(page)).toBeVisible({ timeout: 4_000 });
  expect((await filmState(page)).ready).toBe(false);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the hero shows the still and never requests the film', async ({ page }) => {
    const requests = filmRequests(page);
    await page.goto('./');
    await expect(still(page)).toBeVisible();
    await expect(film(page)).not.toHaveAttribute('src');
    expect(requests).toEqual([]);
  });
});

test('@phone portrait screens play only the centre crop', async ({ page }) => {
  const requests = filmRequests(page);
  await recordStill(page);
  await page.goto('./');
  await waitForShell(page);
  await expect(film(page)).toHaveAttribute('data-ready', '', { timeout: 15_000 });
  expect((await filmState(page)).source).toContain('home-hero-intro-portrait');
  expect(requests.every((url) => url.includes('portrait'))).toBe(true);
  expect(await stillShown(page)).toBe(false);
  await expectNoHorizontalOverflow(page);
});

test('@phone turning the phone sideways swaps to the landscape crop and keeps the hero on screen', async ({ page }) => {
  await recordStill(page);
  await page.goto('./');
  await waitForShell(page);
  await expect(film(page)).toHaveAttribute('data-ready', '', { timeout: 15_000 });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect
    .poll(async () => (await filmState(page)).source, { timeout: 15_000 })
    .toContain('home-hero-intro-landscape');
  await expect.poll(async () => (await filmState(page)).paused).toBe(false);
  const hero = (await page.locator('#homepage-hero-section').boundingBox())!;
  expect(hero.height).toBeLessThanOrEqual(390);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () => (await filmState(page)).source, { timeout: 15_000 })
    .toContain('home-hero-intro-portrait');
  await expect.poll(async () => (await filmState(page)).paused).toBe(false);
  // The film frame holds through each swap; the still never shows in between.
  expect(await stillShown(page)).toBe(false);
  await expectNoHorizontalOverflow(page);
});
