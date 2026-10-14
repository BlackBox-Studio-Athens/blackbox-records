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
  await page.goto('./');
  await waitForShell(page);
  await plantSentinel(page);

  await expect(film(page)).toHaveAttribute('data-ready', '', { timeout: 15_000 });
  const playing = await filmState(page);
  expect(playing).toMatchObject({ paused: false, muted: true });
  expect(playing.source).toContain('home-hero-intro-landscape');
  expect(requests.every((url) => url.includes('landscape'))).toBe(true);
  // The still stays the hero's eager image; the film is decoration only.
  await expect(page.locator('.homepage-hero-section__media-image')).toHaveAttribute('fetchpriority', 'high');
  await expect(page.locator('.homepage-hero-section__media-layer')).toHaveAttribute('aria-hidden', 'true');

  const pause = page.getByRole('button', { name: 'Pause background motion' });
  await pause.click();
  await expect.poll(async () => (await filmState(page)).paused).toBe(true);
  // A paused film keeps its frame instead of returning to the still.
  expect((await filmState(page)).ready).toBe(true);
  await page.getByRole('button', { name: 'Resume background motion' }).click();
  await expect.poll(async () => (await filmState(page)).paused).toBe(false);

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.7));
  await expect.poll(async () => (await filmState(page)).paused).toBe(true);
  await expect(pause).toBeDisabled();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(async () => (await filmState(page)).paused).toBe(false);

  await page.evaluate(() => document.documentElement.setAttribute('data-music-player-session', ''));
  await expect.poll(async () => (await filmState(page)).paused).toBe(true);
  await expect(pause).toBeDisabled();
  await page.evaluate(() => document.documentElement.removeAttribute('data-music-player-session'));
  await expect.poll(async () => (await filmState(page)).paused).toBe(false);

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Who we are' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(film(page)).toHaveCount(0);
  await page.getByRole('banner').getByRole('link', { name: 'BlackBox Records' }).click();
  await expect(page).toHaveURL(/\/blackbox-records\/$/);
  await expect(film(page)).toHaveAttribute('data-ready', '', { timeout: 15_000 });
  expect((await filmState(page)).paused).toBe(false);
  expect(await sentinelIntact(page)).toBe(true);
});

test('reduced motion keeps the still without requesting the film', async ({ page }) => {
  const requests = filmRequests(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await waitForShell(page);
  await page.waitForTimeout(2_000);
  expect(await filmState(page)).toMatchObject({ paused: true, ready: false, source: '' });
  expect(requests).toEqual([]);
  await expect(page.locator('home-hero-film button')).toBeHidden();
});

test('@phone portrait screens play only the centre crop with a 44px pause control', async ({ page }) => {
  const requests = filmRequests(page);
  await page.goto('./');
  await waitForShell(page);
  await expect(film(page)).toHaveAttribute('data-ready', '', { timeout: 15_000 });
  expect((await filmState(page)).source).toContain('home-hero-intro-portrait');
  expect(requests.every((url) => url.includes('portrait'))).toBe(true);
  const pause = page.getByRole('button', { name: 'Pause background motion' });
  const box = (await pause.boundingBox())!;
  expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await expectNoHorizontalOverflow(page);
});

test('@phone turning the phone sideways swaps to the landscape crop and keeps the hero on screen', async ({ page }) => {
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
  const pause = (await page.getByRole('button', { name: 'Pause background motion' }).boundingBox())!;
  expect(pause.y + pause.height).toBeLessThanOrEqual(390);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () => (await filmState(page)).source, { timeout: 15_000 })
    .toContain('home-hero-intro-portrait');
  await expectNoHorizontalOverflow(page);
});
