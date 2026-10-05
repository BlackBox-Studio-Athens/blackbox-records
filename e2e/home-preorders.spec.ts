import { readFile } from 'node:fs/promises';
import type { Locator, Page } from 'playwright/test';
import type { PublicApiComponents } from '../packages/api-client/src/public-client';
import type { StorePreorderShowcaseCandidate } from '../apps/web/src/components/store/StorePreorderShowcase';
import { expect, plantSentinel, sentinelIntact, test, waitForIsland, waitForShell } from './fixtures';

type ListingPrice = PublicApiComponents['schemas']['PublicStoreListingPrice'];
const listing: ListingPrice = {
  storeItemSlug: 'disintegration-black-vinyl-lp',
  presentationState: 'ready',
  availabilityState: 'stocked',
  displayPrice: '€28.00',
  preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
};
const nativeVideoUrl = '/blackbox-records/home-scene-loop.mp4';

async function stubShowcase(page: Page, stage: 'clip' | 'native' | 'photo' | 'cover') {
  const response = await page.request.get('preorder-showcase.json');
  expect(response.ok()).toBe(true);
  const accepted: StorePreorderShowcaseCandidate[] = await response.json();
  const source = accepted.find((candidate) => candidate.slug === listing.storeItemSlug);
  if (!source) throw new Error('Expected the accepted Disintegration showcase candidate');
  const acceptedImage = /\/_image\?|\/_astro\/|\/media\/content\/[a-f\d]{64}$/;
  expect(source.coverUrl).toMatch(acceptedImage);
  expect(source.artistPhotoUrl).toMatch(acceptedImage);
  expect(source.storePath).toMatch(/\/store\/disintegration-black-vinyl-lp\/$/);
  const hasClip = stage === 'clip' || stage === 'native';
  const candidate: StorePreorderShowcaseCandidate = {
    ...source,
    firstClipId: hasClip ? 'MOA5YZDOR6A' : null,
    clips: hasClip
      ? [
          {
            id: 'MOA5YZDOR6A',
            title: 'First official video',
            posterUrl: source.coverUrl,
            ...(stage === 'native' ? { backgroundVideoUrl: nativeVideoUrl } : {}),
          },
          { id: '01234567890', title: 'Second official video', posterUrl: source.coverUrl },
        ]
      : [],
    artistPhotoUrl: stage === 'cover' ? null : source.artistPhotoUrl,
  };
  const candidates = [candidate];
  const listings = [listing];
  let listingReads = 0;
  let candidateReads = 0;
  const providerRequests: string[] = [];
  const mediaRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (/youtube|ytimg|googlevideo/.test(url.hostname)) providerRequests.push(request.url());
    if (url.pathname === nativeVideoUrl) mediaRequests.push(request.url());
  });
  await page.route(
    /^https:\/\/(?:[^/]*\.)?(?:youtube\.com|youtube-nocookie\.com|ytimg\.com|googlevideo\.com)\//,
    (route) => route.fulfill({ contentType: 'text/html', body: '<button>Video fixture</button>' }),
  );
  await page.route('**/api/store/listing-prices*', (route) => {
    if (new URL(route.request().url()).searchParams.get('scope') === 'preorders') listingReads += 1;
    return route.fulfill({ json: listings });
  });
  await page.route('**/preorder-showcase.json', (route) => {
    candidateReads += 1;
    return route.fulfill({ json: candidates });
  });
  if (stage === 'native') {
    const body = await readFile('apps/web/src/pages/_assets/video-posters/sidus-embrace-the-void-loop.mp4');
    await page.route('**/home-scene-loop.mp4', (route) => route.fulfill({ contentType: 'video/mp4', body }));
  }
  return {
    candidate,
    candidates,
    listings,
    providerRequests,
    mediaRequests,
    reads: () => ({ listingReads, candidateReads }),
  };
}

function chapter(page: Page, title = 'Disintegration') {
  return page.getByRole('article', { name: title, exact: true });
}

async function showScene(scene: Locator) {
  await scene.locator('[data-preorder-ambient]').scrollIntoViewIfNeeded();
}

async function expectPlaying(video: Locator, playing: boolean) {
  await expect.poll(() => video.evaluate((node) => !(node as HTMLVideoElement).paused)).toBe(playing);
}

for (const failedRead of ['listing', 'candidates'] as const) {
  test(`Home recovers from a first ${failedRead} failure without refresh, including shell return`, async ({ page }) => {
    await stubShowcase(page, 'photo');
    let attempts = 0;
    const pattern = failedRead === 'listing' ? '**/api/store/listing-prices*' : '**/preorder-showcase.json';
    await page.route(pattern, (route) => {
      if (failedRead === 'listing' && new URL(route.request().url()).searchParams.get('scope') !== 'preorders') {
        return route.fallback();
      }
      attempts += 1;
      // A truncated response exercises failed acquisition without expected Chromium HTTP console errors.
      return attempts === 1 ? route.fulfill({ contentType: 'application/json', body: '{' }) : route.fallback();
    });
    let documents = 0;
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents += 1;
    });
    await page.goto('./');
    await waitForShell(page);
    await expect(chapter(page).getByRole('heading', { name: 'Disintegration', exact: true })).toBeVisible({
      timeout: 5000,
    });
    expect(attempts).toBe(2);
    await expect(page.locator('astro-island[component-url*="StorePreorderShowcase"]')).toHaveAttribute(
      'client',
      'load',
    );
    expect(documents).toBe(1);
    await plantSentinel(page);
    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Services', exact: true })
      .click();
    await expect(page).toHaveURL(/\/services\/$/);
    attempts = 0;
    await page.getByRole('link', { name: 'BlackBox Records', exact: true }).click();
    await expect(chapter(page).getByRole('heading', { name: 'Disintegration', exact: true })).toBeVisible({
      timeout: 5000,
    });
    await expect.poll(() => attempts).toBe(2);
    expect(documents).toBe(1);
    expect(await sentinelIntact(page)).toBe(true);
  });
}

test('Home photo chapter shows accepted identity and facts and delegates Listen to the shell', async ({ page }) => {
  const fixture = await stubShowcase(page, 'photo');
  await page.route('https://bandcamp.com/EmbeddedPlayer/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Local player fixture</button>' }),
  );
  await page.goto('./');
  await waitForShell(page);
  const release = chapter(page);
  await expect(release.getByRole('heading', { name: 'Disintegration', exact: true })).toBeVisible();
  await expect(release.getByRole('img', { name: 'Afterwise', exact: true })).toBeVisible();
  await expect(release.locator('dl dt')).toHaveText(['Format', 'Tracks', 'Recorded and mixed', 'Vinyl ships']);
  await expect(release.locator('dl dd').nth(1)).toHaveText(
    fixture.candidate.trackCount?.toString() ?? 'To be confirmed',
  );
  await expect(release.locator('dl dd').nth(2)).toHaveText(fixture.candidate.recording ?? 'To be confirmed');
  await expect(release.getByText('Around October 2026', { exact: true })).toBeVisible();
  await expect(release.getByRole('link', { name: 'Pre-order', exact: true })).toHaveAttribute(
    'href',
    fixture.candidate.storePath,
  );
  await expect(release.locator('video, iframe')).toHaveCount(0);
  await expect(release.getByRole('link', { name: /^Go to / })).toHaveCount(0);
  expect(fixture.providerRequests).toEqual([]);
  await release.getByRole('button', { name: 'Listen', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Music player' })).toBeVisible();
  await expect(page.getByRole('dialog').locator('iframe')).toHaveAttribute('src', /bandcamp\.com\/EmbeddedPlayer\//);
  await expect(page.locator('html')).toHaveAttribute('data-music-player-session', '');
});

test('Home wheel scrolling resumes after repeated detail and player dismissal without refresh', async ({
  page,
  browserName,
}) => {
  await stubShowcase(page, 'photo');
  await page.route('https://bandcamp.com/EmbeddedPlayer/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Local player fixture</button>' }),
  );
  await page.goto('./');
  await waitForShell(page);
  await plantSentinel(page);
  const release = chapter(page);
  await expect(release).toBeVisible();

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await release.getByRole('link', { name: 'Afterwise', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.mouse.move(700, 400);
    await page.mouse.wheel(0, 300);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.locator('body')).not.toHaveClass(/\bis-shell-(?:modal-open|scroll-locked)\b/);
    const detailScroll = await page.evaluate(() => window.scrollY);
    // Keep the pointer still: a removed modal must not retain Firefox's wheel target.
    await page.mouse.wheel(0, detailScroll > 0 ? -250 : 250);
    await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(detailScroll);

    if (cycle === 0) await release.getByRole('button', { name: 'Listen', exact: true }).click();
    else await page.getByRole('button', { name: 'Open player', exact: true }).click();
    const player = page.getByRole('dialog', { name: 'Music player' });
    await expect(player).toBeVisible();
    await player.locator('iframe').contentFrame().getByRole('button', { name: 'Local player fixture' }).click();
    if (browserName === 'firefox') await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.getByRole('button', { name: 'Minimize player', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.locator('body')).not.toHaveClass(/\bis-shell-(?:modal-open|scroll-locked)\b/);
    const playerScroll = await page.evaluate(() => window.scrollY);
    await page.mouse.move(100, 300);
    await page.mouse.wheel(0, playerScroll > 0 ? -250 : 250);
    await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(playerScroll);
    await expect(page.locator('[data-music-player-session]')).toHaveCount(1);
  }
  expect(await sentinelIntact(page)).toBe(true);
});

test('Home stays empty without buyable pre-orders and never reads static candidates or a video provider', async ({
  page,
}) => {
  const fixture = await stubShowcase(page, 'clip');
  fixture.listings.length = 0;
  await page.goto('./');
  await waitForShell(page);
  await waitForIsland(page, 'StorePreorderShowcase');
  await expect.poll(fixture.reads).toEqual({ listingReads: 1, candidateReads: 0 });
  await expect(page.getByRole('region', { name: 'Pre-orders', exact: true })).toHaveCount(0);
  expect(fixture.providerRequests).toEqual([]);
  const sitemap = await page.request.get('sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).not.toContain('preorder-showcase.json');
});

test('Home chapters use fresh prices and explicit Watch, close and clip switching before shell navigation', async ({
  page,
}) => {
  const fixture = await stubShowcase(page, 'clip');
  fixture.candidates.push({
    ...fixture.candidate,
    slug: 'next-record',
    title: 'Next record',
    firstClipId: null,
    clips: [],
  });
  fixture.listings.push({ ...listing, storeItemSlug: 'next-record', displayPrice: '€31.00' });
  await page.goto('./');
  await waitForShell(page);
  await plantSentinel(page);
  const showcase = page.getByRole('region', { name: 'Pre-orders', exact: true });
  const release = chapter(page);
  await expect(showcase.getByRole('article')).toHaveCount(2);
  await expect(release.getByText('€28.00', { exact: true })).toBeVisible();
  await expect(chapter(page, 'Next record').getByText('€31.00', { exact: true })).toBeVisible();
  await expect(release.getByRole('link', { name: 'Go to Next record by Afterwise', exact: true })).toHaveAttribute(
    'href',
    '#preorder-next-record',
  );
  await expect(chapter(page, 'Next record').getByRole('link', { name: /^Go to / })).toHaveCount(0);
  const videos = release.getByRole('group', { name: 'Official videos' });
  const current = videos.locator('[aria-current="true"]');
  await expect(current).toHaveText('First official video');
  await expect(current).toHaveJSProperty('tagName', 'SPAN');
  await expect(current).toHaveCSS('text-decoration-line', 'none');
  await expect(current).not.toHaveCSS('cursor', 'pointer');
  const second = videos.getByRole('button', { name: 'Second official video', exact: true });
  expect((await second.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await second.focus();
  await second.press('Enter');
  await expect(current).toHaveText('Second official video');
  expect(fixture.providerRequests).toEqual([]);
  const watch = release.getByRole('button', { name: 'Watch full video', exact: true });
  await watch.focus();
  await watch.press('Space');
  const fullVideo = release.locator('iframe');
  await expect(fullVideo).toHaveAttribute(
    'src',
    'https://www.youtube-nocookie.com/embed/01234567890?autoplay=1&playsinline=1&rel=0&color=white&controls=1&fs=1',
  );
  await expect(fullVideo).toHaveAttribute('allowfullscreen', '');
  await expect.poll(() => fixture.providerRequests.length).toBe(1);
  await release.getByRole('button', { name: 'Close video', exact: true }).click();
  await expect(fullVideo).toHaveCount(0);
  await expect(watch).toBeFocused();
  await watch.click();
  await expect(fullVideo).toHaveCount(1);
  await videos.getByRole('button', { name: 'First official video', exact: true }).click();
  await expect(fullVideo).toHaveCount(0);
  await expect(current).toHaveText('First official video');
  const requestsBeforeNavigation = fixture.providerRequests.length;
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Services', exact: true }).click();
  await expect(page).toHaveURL(/\/services\/$/);
  await expect(showcase).toHaveCount(0);
  await page.goBack();
  await expect(watch).toBeVisible();
  await expect(fullVideo).toHaveCount(0);
  expect(await sentinelIntact(page)).toBe(true);
  expect(fixture.providerRequests).toHaveLength(requestsBeforeNavigation);
});

for (const stage of ['photo', 'cover'] as const) {
  test(`Home no-video ${stage} chapter preserves artwork and links to the Store filter`, async ({ page }) => {
    const fixture = await stubShowcase(page, stage);
    await page.goto('./');
    await waitForShell(page);
    const release = chapter(page);
    await expect(release.getByRole('img', { name: 'Disintegration cover', exact: true })).toHaveAttribute(
      'src',
      fixture.candidate.coverUrl,
    );
    await expect(release.getByRole('link', { name: /artwork/i })).toHaveCount(0);
    await expect(release.getByRole('img', { name: 'Afterwise', exact: true })).toHaveCount(stage === 'photo' ? 1 : 0);
    await expect(release.locator('video, iframe')).toHaveCount(0);
    await expect(release.getByRole('button', { name: /Watch|background/ })).toHaveCount(0);
    expect(fixture.providerRequests).toEqual([]);
    await page.getByRole('link', { name: 'All pre-orders', exact: true }).click();
    await expect(page).toHaveURL(/\/store\/#preorders$/);
    await expect(page.getByRole('button', { name: 'Pre-orders 1', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
}

test('Home Base sweep respects focus and reduced motion without shifting its label or making artwork clickable', async ({
  page,
}) => {
  const fixture = await stubShowcase(page, 'clip');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  await waitForShell(page);
  const release = chapter(page);
  const action = release.getByRole('link', { name: 'Pre-order', exact: true });
  await action.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const label = action.locator('span');
  const initial = await label.boundingBox();
  const actionBounds = (await action.boundingBox())!;
  const purchaseBounds = (await release.locator('.home-preorders__purchase').boundingBox())!;
  expect(actionBounds.x + actionBounds.width / 2).toBeCloseTo(purchaseBounds.x + purchaseBounds.width / 2, 0);
  const termsBounds = (await release
    .getByRole('link', { name: 'Pre-order & delivery information', exact: true })
    .boundingBox())!;
  expect(Math.round(termsBounds.y - actionBounds.y - actionBounds.height)).toBeGreaterThanOrEqual(16);
  const sweep = () =>
    action.evaluate((node) => {
      const fill = getComputedStyle(node, '::before');
      return { y: new DOMMatrixReadOnly(fill.transform).m42, duration: fill.transitionDuration };
    });
  expect((await sweep()).y).toBeGreaterThan(0);
  expect((await sweep()).duration).toBe('0.24s');
  await action.hover();
  await expect.poll(async () => (await sweep()).y).toBe(0);
  expect(await label.boundingBox()).toEqual(initial);
  await page.mouse.move(0, 0);
  await page.keyboard.press('Tab');
  await action.focus();
  await expect(action).toHaveCSS('outline-offset', '0px');
  await expect(action).toHaveCSS('outline-style', 'solid');
  await expect(action).toBeFocused();
  await expect.poll(async () => (await sweep()).y).toBe(0);
  expect(await label.boundingBox()).toEqual(initial);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await sweep()).duration).toBe('0s');
  await expect(release.locator('.home-preorders__sleeve')).toHaveCount(1);
  await expect(release.locator('a:has(.home-preorders__sleeve), button:has(.home-preorders__sleeve)')).toHaveCount(0);
  await expect(release.getByRole('heading', { name: 'Album details', exact: true })).toHaveCount(0);
  await expect(release.locator('dt')).toHaveCount(0);
  await expect(release.getByRole('link', { name: 'Pre-order & delivery information', exact: true })).toHaveAttribute(
    'href',
    /\/terms\/$/,
  );
  const artist = release.getByRole('link', { name: 'Afterwise', exact: true });
  await expect(artist).toHaveAttribute('href', fixture.candidate.artistPath!);
  await plantSentinel(page);
  await artist.click();
  await expect(page).toHaveURL(/\/artists\/afterwise\/$/);
  await expect(page.getByRole('heading', { name: 'Afterwise', exact: true })).toBeVisible();
  expect(await sentinelIntact(page)).toBe(true);
  await page.goBack();
  await expect(chapter(page)).toBeVisible();
  await expect(chapter(page).getByRole('link', { name: 'Pre-order', exact: true })).toBeVisible();
  expect(await sentinelIntact(page)).toBe(true);
});

test('Home video and photo chapters keep controls reachable without overflow from 320px to wide desktop', async ({
  page,
}) => {
  const fixture = await stubShowcase(page, 'clip');
  fixture.candidates[0] = { ...fixture.candidate, clips: fixture.candidate.clips?.slice(0, 1) };
  fixture.candidates.push({
    ...fixture.candidate,
    slug: 'photo-record',
    title: 'Photo record',
    firstClipId: null,
    clips: [],
  });
  fixture.listings.push({ ...listing, storeItemSlug: 'photo-record' });
  await page.goto('./');
  await waitForShell(page);
  const showcase = page.getByRole('region', { name: 'Pre-orders', exact: true });
  await expect(showcase.getByRole('article')).toHaveCount(2);
  for (const [width, height] of [
    [320, 740],
    [390, 844],
    [768, 900],
    [1024, 768],
    [1120, 900],
    [1280, 720],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    if (width >= 1280) {
      const availableWidth = await page.evaluate(() => document.documentElement.clientWidth);
      await expect.poll(async () => (await showcase.boundingBox())?.width).toBeCloseTo(availableWidth, 0);
      await expect
        .poll(async () => (await chapter(page).locator('[data-preorder-ambient]').boundingBox())?.width)
        .toBeCloseTo(availableWidth, 0);
    }
    for (const purchase of await showcase.getByRole('link', { name: 'Pre-order', exact: true }).all()) {
      await purchase.scrollIntoViewIfNeeded();
      expect(Math.round((await purchase.boundingBox())!.height), `${width}px purchase target`).toBeGreaterThanOrEqual(
        44,
      );
    }
    const watch = chapter(page).getByRole('button', { name: 'Watch full video', exact: true });
    const panel = chapter(page).locator('.home-preorders__watch-area');
    await expect(chapter(page).locator('.home-preorders__sleeve')).toHaveCount(1);
    await expect(panel).toHaveCount(0);
    await watch.scrollIntoViewIfNeeded();
    expect(Math.round((await watch.boundingBox())!.height), `${width}px Watch target`).toBeGreaterThanOrEqual(44);
    await watch.click();
    await expect(panel).toBeVisible();
    await expect(panel).toBeFocused();
    await expect(panel.locator('img, dl, a')).toHaveCount(0);
    await expect(chapter(page).locator('.home-preorders__sleeve')).toHaveCount(1);
    const box = await panel.boundingBox();
    const availableWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(Math.round(box!.width), `${width}px player stays inside the viewport`).toBeLessThanOrEqual(
      availableWidth - 32,
    );
    expect(Math.round(box!.width), `${width}px player stays within the desktop cap`).toBeLessThanOrEqual(1040);
    if (width <= 800) expect(box!.width, `${width}px full-width mobile player`).toBeCloseTo(availableWidth - 32, 0);
    expect(box!.x + box!.width / 2, `${width}px centered player`).toBeCloseTo(availableWidth / 2, 0);
    const close = panel.getByRole('button', { name: 'Close video', exact: true });
    expect(Math.round((await close.boundingBox())!.height), `${width}px Close target`).toBeGreaterThanOrEqual(44);
    await close.click();
    await expect(panel).toHaveCount(0);
    await expect(watch).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `${width}px overflow`,
    ).toBe(true);
  }
  await expect(
    chapter(page).getByRole('group', { name: 'Official video', exact: true }).getByRole('button'),
  ).toHaveCount(0);
  expect(fixture.providerRequests.length).toBeGreaterThan(0);
});

test('Native ambience plays one visible scene, preserves manual pause and stops for a hidden document', async ({
  page,
}) => {
  const fixture = await stubShowcase(page, 'native');
  fixture.candidates.push({ ...fixture.candidate, slug: 'second-film', title: 'Second film' });
  fixture.listings.push({ ...listing, storeItemSlug: 'second-film' });
  await page.goto('./');
  await waitForShell(page);
  const first = chapter(page);
  const second = chapter(page, 'Second film');
  const firstVideo = first.locator('video');
  const secondVideo = second.locator('video');
  await showScene(first);
  await expectPlaying(firstVideo, true);
  await expect(firstVideo).toHaveJSProperty('muted', true);
  await expect(firstVideo).toHaveAttribute('playsinline', '');
  await first.getByRole('button', { name: 'Pause background', exact: true }).click();
  await expectPlaying(firstVideo, false);
  await showScene(second);
  await expectPlaying(secondVideo, true);
  await expectPlaying(firstVideo, false);
  expect(
    await page
      .locator('.home-preorders video')
      .evaluateAll((videos) => videos.filter((video) => !(video as HTMLVideoElement).paused).length),
  ).toBe(1);
  await showScene(first);
  await expectPlaying(firstVideo, false);
  await expectPlaying(secondVideo, false);
  await expect(first.getByRole('button', { name: 'Play background', exact: true })).toBeVisible();
  await first.getByRole('button', { name: 'Play background', exact: true }).click();
  await expectPlaying(firstVideo, true);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expectPlaying(firstVideo, false);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expectPlaying(firstVideo, true);
  expect(fixture.providerRequests).toEqual([]);
});

for (const preference of ['reduced motion', 'data saving'] as const) {
  test(`Native ambience keeps a poster for ${preference} until explicit intent`, async ({ page }) => {
    if (preference === 'reduced motion') await page.emulateMedia({ reducedMotion: 'reduce' });
    else
      await page.addInitScript(() =>
        Object.defineProperty(navigator, 'connection', {
          configurable: true,
          value: Object.assign(new EventTarget(), { saveData: true }),
        }),
      );
    const fixture = await stubShowcase(page, 'native');
    await page.goto('./');
    await waitForShell(page);
    const release = chapter(page);
    await showScene(release);
    await expect(release.locator('video')).not.toHaveAttribute('src', /.+/);
    expect(fixture.mediaRequests).toEqual([]);
    await expect(release.getByRole('link', { name: 'Pre-order', exact: true })).toHaveAttribute(
      'href',
      fixture.candidate.storePath,
    );
    await release.getByRole('button', { name: 'Play background', exact: true }).click();
    await expectPlaying(release.locator('video'), true);
    expect(fixture.providerRequests).toEqual([]);
  });
}

for (const failure of ['autoplay rejection', 'asset failure'] as const) {
  test(`Native ambience falls back after ${failure} without a retry loop`, async ({ page }) => {
    const fixture = await stubShowcase(page, 'native');
    if (failure === 'autoplay rejection')
      await page.addInitScript(() => {
        let attempts = 0;
        Object.defineProperty(window, '__homeScenePlayAttempts', { get: () => attempts });
        HTMLMediaElement.prototype.play = () => {
          attempts += 1;
          return Promise.reject(new DOMException('Fixture autoplay refusal', 'NotAllowedError'));
        };
      });
    else
      await page.route('**/home-scene-loop.mp4', (route) =>
        route.fulfill({ contentType: 'video/mp4', body: Buffer.from('invalid media') }),
      );
    await page.goto('./');
    await waitForShell(page);
    const release = chapter(page);
    await showScene(release);
    if (failure === 'asset failure') {
      await expect(release.getByRole('button', { name: 'Background unavailable', exact: true })).toBeDisabled();
    } else {
      await expect.poll(() => page.evaluate(() => Reflect.get(window, '__homeScenePlayAttempts'))).toBe(1);
      await expect(release.getByRole('button', { name: 'Play background', exact: true })).toBeEnabled();
    }
    await expect(release.getByRole('button', { name: 'Pause background', exact: true })).toHaveCount(0);
    await expect(release.getByRole('button', { name: 'Watch full video', exact: true })).toBeEnabled();
    await expect(release.getByRole('link', { name: 'Pre-order', exact: true })).toHaveAttribute(
      'href',
      fixture.candidate.storePath,
    );
    const requests = fixture.mediaRequests.length;
    await page.evaluate(() => window.scrollTo(0, 0));
    await showScene(release);
    await expect(release.locator('video')).not.toHaveAttribute('src', /.+/);
    expect(fixture.mediaRequests).toHaveLength(requests);
    if (failure === 'autoplay rejection') {
      expect(await page.evaluate(() => Reflect.get(window, '__homeScenePlayAttempts'))).toBe(1);
    }
    expect(fixture.providerRequests).toEqual([]);
  });
}

test('A real minimized shell session pauses ambience and blocks competing full video until Stop', async ({ page }) => {
  const fixture = await stubShowcase(page, 'native');
  await page.route('https://bandcamp.com/EmbeddedPlayer/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  await page.goto('./');
  await waitForShell(page);
  const release = chapter(page);
  await showScene(release);
  await expectPlaying(release.locator('video'), true);
  await release.getByRole('button', { name: 'Listen', exact: true }).click();
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  await iframe.contentFrame().getByRole('button', { name: 'Player fixture', exact: true }).click();
  await page.getByRole('button', { name: 'Minimize player', exact: true }).click();
  const original = await iframe.elementHandle();
  await expect(page.locator('html')).toHaveAttribute('data-music-player-session', '');
  await showScene(release);
  await expectPlaying(release.locator('video'), false);
  await expect(release.getByRole('button', { name: 'Watch full video', exact: true })).toBeDisabled();
  await expect(release.getByRole('status')).toContainText('Use Stop in the music player');
  expect(await original?.evaluate((element) => element.isConnected)).toBe(true);
  expect(fixture.providerRequests).toEqual([]);
  const stop = page.getByRole('button', { name: 'Stop player', exact: true });
  await stop.click();
  await stop.click();
  await expect(page.locator('html')).not.toHaveAttribute('data-music-player-session', /.*/);
  await expect(release.getByRole('button', { name: 'Watch full video', exact: true })).toBeEnabled();
  await showScene(release);
  await expectPlaying(release.locator('video'), true);
  expect(await original?.evaluate((element) => element.isConnected)).toBe(false);
});
