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

async function stubShowcase(page: Page, stage: 'clip' | 'photo' | 'cover') {
  const response = await page.request.get('preorder-showcase.json');
  expect(response.ok()).toBe(true);
  const candidates: StorePreorderShowcaseCandidate[] = await response.json();
  expect(Array.isArray(candidates)).toBe(true);
  const source = candidates.find((candidate) => candidate.slug === listing.storeItemSlug);
  if (!source) throw new Error('Expected canonical Disintegration showcase candidate');
  expect(source.coverUrl).toMatch(/\/_image\?|\/_astro\//);
  expect(source.artistPhotoUrl).toMatch(/\/_image\?|\/_astro\//);
  expect(source.storePath).toMatch(/\/store\/disintegration-black-vinyl-lp\/$/);
  expect(Object.keys(source).sort()).toEqual([
    'artist',
    'artistPhotoUrl',
    'clips',
    'coverUrl',
    'firstClipId',
    'listen',
    'option',
    'recording',
    'releaseDate',
    'slug',
    'storePath',
    'summary',
    'title',
    'trackCount',
  ]);
  const candidate: StorePreorderShowcaseCandidate = {
    ...source,
    firstClipId: stage === 'clip' ? 'abcdefghijk' : null,
    clips:
      stage === 'clip'
        ? [
            { id: 'abcdefghijk', title: 'First official video', posterUrl: source.coverUrl },
            { id: '01234567890', title: 'Second official video', posterUrl: source.coverUrl },
          ]
        : [],
    artistPhotoUrl: stage === 'cover' ? null : source.artistPhotoUrl,
  };
  let listingReads = 0;
  let candidateReads = 0;
  const providerRequests: string[] = [];
  page.on('request', (request) => {
    if (/youtube|ytimg|googlevideo/.test(new URL(request.url()).hostname)) providerRequests.push(request.url());
  });
  await page.route(
    /^https:\/\/(?:[^/]*\.)?(?:youtube\.com|youtube-nocookie\.com|ytimg\.com|googlevideo\.com)\//,
    (route) => route.fulfill({ contentType: 'text/html', body: '<button>Video fixture</button>' }),
  );
  await page.route('**/api/store/listing-prices*', (route) => {
    if (new URL(route.request().url()).searchParams.get('scope') === 'preorders') listingReads += 1;
    return route.fulfill({ json: [listing] });
  });
  await page.route('**/preorder-showcase.json', (route) => {
    candidateReads += 1;
    return route.fulfill({ json: [candidate] });
  });
  return { candidate, providerRequests, reads: () => ({ listingReads, candidateReads }) };
}

async function waitForShowcaseImages(showcase: Locator) {
  for (const image of await showcase.locator('img').all()) {
    await expect(image).toHaveJSProperty('complete', true);
    await expect
      .poll(() => image.evaluate((node) => (node instanceof HTMLImageElement ? node.naturalWidth : 0)))
      .toBeGreaterThan(0);
  }
}

test('Home no-video poster presents the selected record and opens the existing shell player', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 920 });
  await page.clock.setFixedTime(new Date('2026-10-03T12:00:00Z'));
  const fixture = await stubShowcase(page, 'photo');
  const candidate = {
    ...fixture.candidate,
    option: "Black Vinyl LP 12''",
    trackCount: 6,
    recording: 'BlackBox Studio',
    summary: "Afterwise's six-track debut album blends instrumental post-rock atmosphere with post-metal weight.",
  };
  await page.route('**/preorder-showcase.json', (route) =>
    route.fulfill({ json: [{ ...candidate, slug: 'other-record', title: 'Other record' }, candidate] }),
  );
  await page.route('**/api/store/listing-prices*', (route) =>
    route.fulfill({ json: [{ ...listing, storeItemSlug: 'other-record' }, listing] }),
  );
  await page.route('https://bandcamp.com/EmbeddedPlayer/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>Local player fixture</p>' }),
  );
  await page.goto('./');
  await waitForShell(page);
  const showcase = page.getByRole('region', { name: 'Pre-orders', exact: true });
  await showcase.getByRole('button', { name: /Disintegration Afterwise/ }).click();
  await expect(showcase.getByRole('heading', { name: 'Disintegration', exact: true })).toBeVisible();
  await expect(showcase.locator('dl dt')).toHaveText(['Format', 'Tracks', 'Recorded and mixed', 'Vinyl ships']);
  await expect(showcase.getByText('Six', { exact: true })).toBeVisible();
  await expect(showcase.getByText('BlackBox Studio', { exact: true })).toBeVisible();
  await expect(showcase.locator('iframe')).toHaveCount(0);
  await waitForShowcaseImages(showcase);
  await showcase.scrollIntoViewIfNeeded();
  await showcase.screenshot({ path: '.codex-artifacts/preorders/home-no-video-desktop.png' });
  expect(fixture.providerRequests).toEqual([]);
  await showcase.getByRole('button', { name: 'Listen', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').locator('iframe')).toHaveAttribute('src', /bandcamp\.com\/EmbeddedPlayer\//);
});

test('Home stays empty without pre-orders and never reads static candidates or a video provider', async ({ page }) => {
  let listingReads = 0;
  let candidateReads = 0;
  const providerRequests: string[] = [];
  page.on('request', (request) => {
    if (/youtube|ytimg|googlevideo/.test(new URL(request.url()).hostname)) providerRequests.push(request.url());
  });
  await page.route('**/api/store/listing-prices*', (route) => {
    expect(new URL(route.request().url()).searchParams.get('scope')).toBe('preorders');
    listingReads += 1;
    return route.fulfill({ json: [] });
  });
  await page.route('**/preorder-showcase.json', (route) => {
    candidateReads += 1;
    return route.fulfill({ json: [] });
  });
  await page.goto('./');
  await waitForShell(page);
  await waitForIsland(page, 'StorePreorderShowcase');
  await expect.poll(() => listingReads).toBe(1);
  await expect(page.locator('.home-preorders')).toHaveCount(0);
  expect(candidateReads).toBe(0);
  expect(providerRequests).toEqual([]);
  const sitemap = await page.request.get('sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).not.toContain('preorder-showcase.json');
});

test('Home clip stage uses Worker price and waits for Play, then survives shell navigation away and back', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 920 });
  await page.clock.setFixedTime(new Date('2026-10-03T12:00:00Z'));
  const fixture = await stubShowcase(page, 'clip');
  const noVideo = {
    ...fixture.candidate,
    slug: 'no-video-record',
    title: 'No-video record',
    firstClipId: null,
    clips: [],
  };
  await page.route('**/preorder-showcase.json', (route) => route.fulfill({ json: [fixture.candidate, noVideo] }));
  await page.route('**/api/store/listing-prices*', (route) =>
    route.fulfill({ json: [listing, { ...listing, storeItemSlug: noVideo.slug }] }),
  );
  await page.goto('./');
  await waitForShell(page);
  await plantSentinel(page);
  const showcase = page.getByRole('region', { name: 'Pre-orders', exact: true });
  await expect(showcase).toBeVisible();
  await expect(showcase.locator('.home-preorders__buy').getByText('€28.00', { exact: true })).toBeVisible();
  await expect(showcase.getByText('Ships around October 2026 · charged today', { exact: true })).toBeVisible();
  await expect(showcase.getByRole('heading', { name: 'Disintegration', exact: true })).toBeVisible();
  await expect(showcase.locator('dl')).toHaveCount(0);
  const videos = showcase.getByRole('group', { name: 'Official videos' });
  const currentClip = videos.locator('[aria-current="true"]');
  const firstClip = videos.getByRole('button', { name: 'First official video', exact: true });
  const secondClip = videos.getByRole('button', { name: 'Second official video', exact: true });
  await expect(currentClip).toHaveText('First official video');
  await expect(currentClip).toHaveJSProperty('tagName', 'SPAN');
  await expect(currentClip).toHaveCSS('text-decoration-line', 'none');
  await expect(currentClip).not.toHaveCSS('cursor', 'pointer');
  await expect(firstClip).toHaveCount(0);
  expect((await secondClip.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await secondClip.focus();
  await expect(secondClip).toBeFocused();
  await secondClip.press('Enter');
  await expect(currentClip).toHaveText('Second official video');
  await expect(secondClip).toHaveCount(0);
  expect(fixture.providerRequests).toEqual([]);
  await firstClip.focus();
  await firstClip.press('Space');
  await expect(currentClip).toHaveText('First official video');
  await expect(showcase.getByRole('link', { name: 'Pre-order', exact: true })).toHaveAttribute(
    'href',
    fixture.candidate.storePath,
  );
  await expect(showcase.getByRole('link', { name: 'All pre-orders', exact: true })).toHaveAttribute(
    'href',
    /\/store\/#preorders$/,
  );
  expect(fixture.providerRequests).toEqual([]);
  await expect(showcase.locator('iframe')).toHaveCount(0);
  await showcase.scrollIntoViewIfNeeded();
  await waitForShowcaseImages(showcase);
  const capture = `.codex-artifacts/preorders/run7-W13-clip-${Date.now()}.png`;
  await showcase.screenshot({ path: capture });
  console.log('W13 capture:', capture);
  const play = showcase.getByRole('button', { name: 'Play Disintegration', exact: true });
  await play.focus();
  await play.press('Space');
  await expect(showcase.getByTitle('Disintegration video')).toHaveAttribute(
    'src',
    'https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1&playsinline=1&rel=0&color=white&controls=1&fs=1',
  );
  await expect(showcase.getByTitle('Disintegration video')).toHaveAttribute('allowfullscreen', '');
  await expect.poll(() => fixture.providerRequests.length).toBe(1);
  await secondClip.click();
  await expect(showcase.locator('iframe')).toHaveCount(0);
  expect(fixture.providerRequests).toHaveLength(1);
  await play.click();
  await expect(showcase.getByTitle('Disintegration video')).toHaveAttribute(
    'src',
    'https://www.youtube-nocookie.com/embed/01234567890?autoplay=1&playsinline=1&rel=0&color=white&controls=1&fs=1',
  );
  await expect.poll(() => fixture.providerRequests.length).toBe(2);
  await expect(currentClip).toHaveText('Second official video');
  await expect(secondClip).toHaveCount(0);
  await expect(showcase.locator('iframe')).toHaveCount(1);
  await showcase.getByRole('button', { name: /No-video record Afterwise/ }).click();
  await expect(showcase.locator('iframe')).toHaveCount(0);
  await expect(videos).toHaveCount(0);
  await expect(showcase.locator('dl dt')).toHaveText(['Format', 'Tracks', 'Recorded and mixed', 'Vinyl ships']);
  await showcase.getByRole('button', { name: /Disintegration Afterwise/ }).click();
  await expect(currentClip).toHaveText('First official video');
  await expect(firstClip).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Services', exact: true }).click();
  await expect(page).toHaveURL(/\/services\/$/);
  await expect(page.locator('.home-preorders')).toHaveCount(0);
  await expect(page.getByTitle('Disintegration video')).toHaveCount(0);
  await page.goBack();
  await expect(showcase).toBeVisible();
  await expect(showcase.getByRole('button', { name: 'Play Disintegration', exact: true })).toBeVisible();
  await expect(showcase.locator('iframe')).toHaveCount(0);
  expect(await sentinelIntact(page)).toBe(true);
  expect(fixture.providerRequests).toHaveLength(2);
});

for (const stage of ['photo', 'cover'] as const) {
  test(`Home no-clip ${stage} stage links to the Store filter without contacting a provider`, async ({ page }) => {
    const fixture = await stubShowcase(page, stage);
    await page.goto('./');
    await waitForShell(page);
    const showcase = page.getByRole('region', { name: 'Pre-orders', exact: true });
    await expect(showcase).toBeVisible();
    await expect(showcase.locator('.home-preorders__buy').getByText('€28.00', { exact: true })).toBeVisible();
    await expect(showcase.locator('.home-preorders__poster-photo')).toHaveCount(stage === 'photo' ? 1 : 0);
    await expect(showcase.getByRole('button', { name: /^Play / })).toHaveCount(0);
    await expect(showcase.locator('iframe')).toHaveCount(0);
    expect(fixture.providerRequests).toEqual([]);
    await showcase.scrollIntoViewIfNeeded();
    await waitForShowcaseImages(showcase);
    const capture = `.codex-artifacts/preorders/run7-W13-${stage}-${Date.now()}.png`;
    await showcase.screenshot({ path: capture });
    console.log('W13 capture:', capture);
    await showcase.getByRole('link', { name: 'All pre-orders', exact: true }).click();
    await expect(page).toHaveURL(/\/store\/#preorders$/);
    await expect(page.getByRole('button', { name: 'Pre-orders 1', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
}

test('390px Home showcase keeps the stage, facts and purchase link usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const fixture = await stubShowcase(page, 'photo');
  const video = {
    ...fixture.candidate,
    slug: 'mobile-video-record',
    title: 'Mobile video record',
    firstClipId: 'abcdefghijk',
    clips: [
      { id: 'abcdefghijk', title: 'First official video with a long title', posterUrl: fixture.candidate.coverUrl },
    ],
  };
  await page.route('**/preorder-showcase.json', (route) => route.fulfill({ json: [fixture.candidate, video] }));
  await page.route('**/api/store/listing-prices*', (route) =>
    route.fulfill({ json: [listing, { ...listing, storeItemSlug: video.slug }] }),
  );
  await page.goto('./');
  await waitForShell(page);
  const showcase = page.getByRole('region', { name: 'Pre-orders', exact: true });
  await expect(showcase).toBeVisible();
  await showcase.scrollIntoViewIfNeeded();
  await waitForShowcaseImages(showcase);
  await expect(showcase.locator('dl dt')).toHaveText(['Format', 'Tracks', 'Recorded and mixed', 'Vinyl ships']);
  await expect(showcase.locator('.home-preorders__buy').getByText('€28.00', { exact: true })).toBeVisible();
  const purchase = showcase.getByRole('link', { name: 'Pre-order', exact: true });
  expect((await purchase.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const capture = `.codex-artifacts/preorders/run7-W13-mobile-${Date.now()}.png`;
  await showcase.screenshot({ path: capture });
  console.log('W13 capture:', capture);
  expect(fixture.providerRequests).toEqual([]);
  await showcase.getByRole('button', { name: /Mobile video record Afterwise/ }).click();
  await expect(showcase.getByRole('heading', { name: 'Mobile video record', exact: true })).toBeVisible();
  const videos = showcase.getByRole('group', { name: 'Official videos' });
  await expect(videos.getByRole('button')).toHaveCount(0);
  await expect(videos.getByRole('link')).toHaveCount(0);
  const currentClip = videos.locator('span[aria-current="true"]');
  await expect(currentClip).toHaveText('First official video with a long title');
  await expect(currentClip).toHaveCSS('text-decoration-line', 'none');
  await expect(currentClip).not.toHaveCSS('cursor', 'pointer');
  await expect(showcase.getByRole('button', { name: 'Play Mobile video record', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await showcase.screenshot({ path: '.codex-artifacts/preorders/home-video-mobile.png' });
  expect(fixture.providerRequests).toEqual([]);
});
