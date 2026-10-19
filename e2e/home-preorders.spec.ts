import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Locator, Page } from 'playwright/test';
import {
  expect,
  expectNoHorizontalOverflow,
  plantSentinel,
  sentinelIntact,
  test,
  waitForIsland,
  waitForShell,
} from './fixtures';

// The e2e build renders Home from e2e/preorder-projection.json: Disintegration vinyl is an open pre-order at €28.00.
// Its accepted content gives a photo chapter; the media cases below mount a local film fixture through its renderer.
const storePath = /\/store\/disintegration-black-vinyl-lp\/$/;
const acceptedImage = /\/_image\?|\/_astro\/|\/media\/content\/[a-f\d]{64}$/;

test('Home defaults to sample films only with the UAT build marker @phone', async ({ page }) => {
  await page.route('https://images.blackboxrecordsathens.com/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720"><rect width="720" height="720" fill="#141414"/></svg>',
    }),
  );
  await page.goto('./');
  await waitForShell(page);
  const note = page.getByText('Video playback test. Sample pre-order details; purchase links open the UAT Store.');
  if (process.env.SHOW_REVIEW_SITE_MARKER !== 'true') {
    await expect(note).toHaveCount(0);
    await expect(page.locator('#preorder-uat-video-lotus')).toHaveCount(0);
    return;
  }
  await expect(note).toBeVisible();
  await expect(page.locator('#preorders video')).toHaveCount(2);
  await waitForIsland(page, 'StorePreorderShowcase');
  for (const slug of ['lotus', 'disintegration']) {
    const video = page.locator(`#preorder-uat-video-${slug} video`);
    await video.scrollIntoViewIfNeeded();
    await expect(video).toHaveAttribute('data-playing', 'true');
    const time = await video.evaluate((media: HTMLVideoElement) => media.currentTime);
    await expect.poll(() => video.evaluate((media: HTMLVideoElement) => media.currentTime)).not.toBe(time);
  }
  await page.reload();
  await waitForIsland(page, 'StorePreorderShowcase');
  const video = page.locator('#preorder-uat-video-disintegration video');
  await video.scrollIntoViewIfNeeded();
  await expect(video).toHaveAttribute('data-playing', 'true');
});

// Exercise the shipped component and real media without changing accepted Local catalog content.
async function mountChapter(
  page: Page,
  source?: string,
  layout: { variant?: 'video' | 'photo' | 'cover'; listen?: boolean; title?: string; metadata?: boolean } = {},
) {
  await waitForIsland(page, 'StorePreorderShowcase');
  // A discrete event completes React's pending hydration before the fixture unmounts this root.
  await page.locator('#home-preorders-title').dispatchEvent('click');
  await page.evaluate(
    async ({ backgroundVideoUrl, layout }) => {
      const island = document.querySelector<HTMLElement>('astro-island[component-url*="StorePreorderShowcase"]')!;
      const { default: Component } = await import(island.getAttribute('component-url')!);
      const { default: render } = await import(island.getAttribute('renderer-url')!);
      const film = document.querySelector<HTMLVideoElement>('video[data-home-hero-film]')!;
      const coverUrl = island.querySelector<HTMLImageElement>('.home-preorders__sleeve')!.src;
      const posterUrl = island.querySelector<HTMLImageElement>('.home-preorders__band-photo')!.src;
      const trigger = island.querySelector<HTMLElement>('[data-music-listen-source-id]')!;
      const listen = layout.listen
        ? {
            releaseId: trigger.dataset.musicListenSourceId,
            bandcampEmbedUrl: trigger.dataset.musicStreamingServiceEmbeddedPlayerBandcampEmbedUrl,
            tidalEmbedUrl: trigger.dataset.musicStreamingServiceEmbeddedPlayerTidalEmbedUrl,
          }
        : undefined;
      const variant = layout.variant ?? 'video';
      const mount = document.createElement('div');
      mount.setAttribute('ssr', '');
      island.dispatchEvent(new CustomEvent('astro:unmount'));
      island.replaceWith(mount);
      render(mount)(
        Component,
        {
          storeUrl: '/blackbox-records/store/',
          items: [
            {
              slug: 'playback-fixture',
              title: layout.title ?? 'Playback fixture',
              artist: 'Local band',
              option: 'Vinyl',
              coverUrl,
              storePath: '/blackbox-records/store/disintegration-black-vinyl-lp/',
              displayPrice: '€28.00',
              shipEstimate: null,
              artistPhotoUrl: variant === 'photo' ? posterUrl : null,
              listen,
              trackCount: layout.metadata === false ? null : 10,
              recording: layout.metadata === false ? null : 'Local studio',
              summary: layout.metadata === false ? undefined : 'The complete release summary.',
              clips:
                variant === 'video'
                  ? [
                      {
                        id: 'MOA5YZDOR6A',
                        title: 'Local film',
                        posterUrl,
                        backgroundVideoUrl: backgroundVideoUrl ?? film.dataset.portraitSrc + '?preorder-fixture=1',
                      },
                    ]
                  : [],
            },
          ],
        },
        {},
        { client: 'only' },
      );
    },
    { backgroundVideoUrl: source, layout },
  );
  const video = page.locator('#preorders video');
  if ((layout.variant ?? 'video') === 'video') {
    await expect(video).toHaveCount(1);
    await video.scrollIntoViewIfNeeded();
  } else await expect(page.locator('#preorder-playback-fixture')).toBeVisible();
  return video;
}

test('preorder film starts and resumes without reloading its source @phone', async ({ page }) => {
  await page.route('https://www.youtube-nocookie.com/embed/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>Local full-video fixture</p>' }),
  );
  await page.goto('./');
  const video = await mountChapter(page);
  const advancing = async () => {
    await expect(video).toHaveAttribute('data-playing', 'true');
    const time = await video.evaluate((media: HTMLVideoElement) => media.currentTime);
    await expect.poll(() => video.evaluate((media: HTMLVideoElement) => media.currentTime)).not.toBe(time);
    expect(await video.evaluate((media: HTMLVideoElement) => media.muted)).toBe(true);
  };
  await advancing();
  const source = await video.getAttribute('src');
  await page.evaluate(() => Object.assign(window, { filmLoads: 0 }));
  await video.evaluate((media) =>
    media.addEventListener('loadstart', () => {
      Object.assign(window, { filmLoads: (window as unknown as { filmLoads: number }).filmLoads + 1 });
    }),
  );
  for (const pause of ['scroll', 'visibility', 'music']) {
    if (pause === 'scroll') await page.evaluate(() => window.scrollTo(0, 0));
    if (pause === 'visibility')
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
    if (pause === 'music')
      await page.evaluate(() => document.documentElement.setAttribute('data-music-player-session', ''));
    await expect.poll(() => video.evaluate((media: HTMLVideoElement) => media.paused)).toBe(true);
    await expect(video).toHaveAttribute('src', source!);
    if (pause === 'scroll') await video.scrollIntoViewIfNeeded();
    if (pause === 'visibility')
      await page.evaluate(() => {
        delete (document as unknown as { hidden?: boolean }).hidden;
        document.dispatchEvent(new Event('visibilitychange'));
      });
    if (pause === 'music')
      await page.evaluate(() => document.documentElement.removeAttribute('data-music-player-session'));
    await advancing();
  }
  await page.getByRole('button', { name: 'Watch full video', exact: true }).click();
  await expect(page.locator('#preorders iframe')).toHaveCount(1);
  await expect.poll(() => video.evaluate((media: HTMLVideoElement) => media.paused)).toBe(true);
  await expect(video).toHaveAttribute('src', source!);
  await page.getByRole('button', { name: 'Close video', exact: true }).click();
  await expect(page.locator('#preorders iframe')).toHaveCount(0);
  await advancing();
  expect(await page.evaluate(() => (window as unknown as { filmLoads: number }).filmLoads)).toBe(0);
  await page.reload();
  await mountChapter(page);
  await advancing();
});

test('preorder film preserves pause rules while a cold source is delayed @phone', async ({ page }) => {
  await page.goto('./');
  const asset = await page.locator('video[data-home-hero-film]').getAttribute('data-portrait-src');
  expect(asset).toBeTruthy();
  const upstreamUrl = new URL(asset!, page.url()).href;
  let release = () => {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested = false;
  // WebKit media requests bypass page.route; delay a real Local response in every engine.
  const server = createServer(async (request, response) => {
    requested = true;
    await ready;
    if (response.destroyed) return;
    // Keep the normal asset server's byte-range protocol for native media loaders.
    const upstream = await fetch(upstreamUrl, {
      headers: request.headers.range ? { Range: request.headers.range } : {},
    });
    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (!response.destroyed)
      response.writeHead(upstream.status, { ...Object.fromEntries(upstream.headers), Connection: 'close' }).end(bytes);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const video = await mountChapter(page, `http://127.0.0.1:${(server.address() as AddressInfo).port}/film.mp4`);
    await expect.poll(() => requested).toBe(true);
    await expect(video).not.toHaveAttribute('data-playing', 'true');
    await page.evaluate(() => document.documentElement.setAttribute('data-music-player-session', ''));
    await expect.poll(() => video.evaluate((media: HTMLVideoElement) => media.paused)).toBe(true);
    await video.dispatchEvent('canplay');
    expect(await video.evaluate((media: HTMLVideoElement) => media.paused)).toBe(true);
    await page.evaluate(() => document.documentElement.removeAttribute('data-music-player-session'));
    release();
    await expect(video).toHaveAttribute('data-playing', 'true');
    const time = await video.evaluate((media: HTMLVideoElement) => media.currentTime);
    await expect.poll(() => video.evaluate((media: HTMLVideoElement) => media.currentTime)).not.toBe(time);
  } finally {
    release();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

for (const rejection of ['AbortError', 'NotAllowedError']) {
  test(`preorder film ignores a late ${rejection} while already playing @phone`, async ({ page }) => {
    await page.addInitScript((name) => {
      const play = HTMLMediaElement.prototype.play;
      let first = true;
      HTMLMediaElement.prototype.play = function () {
        const result = play.call(this);
        if (!first || !this.matches('.home-preorders__film')) return result;
        first = false;
        // Hold the first result to exercise an old startup result arriving after real playback.
        return result.then(
          () =>
            new Promise<void>((_resolve, reject) => {
              Object.assign(window, { rejectFilmStart: () => reject(new DOMException('Late startup fixture', name)) });
            }),
        );
      };
    }, rejection);
    await page.goto('./');
    const video = await mountChapter(page);
    await expect(video).toHaveAttribute('data-playing', 'true');
    await expect
      .poll(() => page.evaluate(() => typeof (window as unknown as { rejectFilmStart: unknown }).rejectFilmStart))
      .toBe('function');
    await page.evaluate(async () => {
      (window as unknown as { rejectFilmStart: () => void }).rejectFilmStart();
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
    await expect(video).toHaveAttribute('data-playing', 'true');
    const time = await video.evaluate((media: HTMLVideoElement) => media.currentTime);
    await expect.poll(() => video.evaluate((media: HTMLVideoElement) => media.currentTime)).not.toBe(time);
  });

  test(`preorder film handles ${rejection} at startup @phone`, async ({ page }) => {
    await page.addInitScript((name) => {
      const play = HTMLMediaElement.prototype.play;
      let calls = 0;
      HTMLMediaElement.prototype.play = function () {
        if (this.matches('.home-preorders__film')) {
          Object.assign(window, { filmPlayCalls: ++calls });
          if (calls === 1 || name === 'NotAllowedError') {
            // An interrupted native play has already started resource selection/loading.
            if (name === 'AbortError') {
              this.preload = 'auto';
              this.load();
            }
            return Promise.reject(new DOMException('Startup fixture', name));
          }
        }
        return play.call(this);
      };
    }, rejection);
    await page.goto('./');
    const video = await mountChapter(page);
    if (rejection === 'AbortError') {
      await expect(video).toHaveAttribute('data-playing', 'true');
      const time = await video.evaluate((media: HTMLVideoElement) => media.currentTime);
      await expect.poll(() => video.evaluate((media: HTMLVideoElement) => media.currentTime)).not.toBe(time);
    } else {
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { filmPlayCalls: number }).filmPlayCalls))
        .toBe(1);
      await page.evaluate(() => window.scrollTo(0, 0));
      await video.scrollIntoViewIfNeeded();
      await video.dispatchEvent('canplay');
      expect(await video.evaluate((media: HTMLVideoElement) => media.paused)).toBe(true);
      await expect(video).not.toHaveAttribute('data-playing', 'true');
      await expect(page.locator('#preorders .home-preorders__video-poster')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Pre-order', exact: true })).toBeVisible();
      expect(await page.evaluate(() => (window as unknown as { filmPlayCalls: number }).filmPlayCalls)).toBe(1);
    }
  });
}

for (const preference of ['reduced-motion', 'save-data']) {
  test(`preorder film never loads with ${preference} @phone`, async ({ page }) => {
    if (preference === 'reduced-motion') await page.emulateMedia({ reducedMotion: 'reduce' });
    else
      await page.addInitScript(() =>
        Object.defineProperty(navigator, 'connection', {
          configurable: true,
          value: Object.assign(new EventTarget(), { saveData: true }),
        }),
      );
    await page.goto('./');
    const video = await mountChapter(page);
    await video.dispatchEvent('canplay');
    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      document.documentElement.setAttribute('data-music-player-session', '');
    });
    await page.evaluate(() => document.documentElement.removeAttribute('data-music-player-session'));
    await expect(video).not.toHaveAttribute('src', /.+/);
    expect(await video.evaluate((media: HTMLVideoElement) => media.paused)).toBe(true);
  });
}

// Home's pre-order state is in its HTML: no listing, candidate or video provider request decides it.
function watchShowcase(page: Page) {
  const providerRequests: string[] = [];
  const stateReads: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (/youtube|ytimg|googlevideo/.test(url.hostname)) providerRequests.push(request.url());
    if (url.pathname.endsWith('/preorder-showcase.json') || url.searchParams.get('scope') === 'preorders')
      stateReads.push(request.url());
  });
  return { providerRequests, stateReads };
}

test('Home has its pre-orders in the HTML response and at first paint, on direct and shell entry', async ({ page }) => {
  const fixture = watchShowcase(page);
  const html = await (await page.request.get('./')).text();
  expect(html).toContain('id="preorders"');
  expect(html).toMatch(/<h3[^>]*>Disintegration<\/h3>/);
  expect(html).toContain('€28.00');
  expect(html).toContain('Pre-order &amp; delivery information');
  // Records whether the section is in the parsed document and whether anything inserts it later.
  await page.addInitScript(() => {
    const record = { atParse: false, inserted: 0 };
    (window as unknown as { __preorders: typeof record }).__preorders = record;
    document.addEventListener('DOMContentLoaded', () => {
      record.atParse = Boolean(document.getElementById('preorders'));
      new MutationObserver((mutations) => {
        for (const mutation of mutations)
          for (const node of mutation.addedNodes)
            if (node instanceof Element && (node.id === 'preorders' || node.querySelector('#preorders')))
              record.inserted += 1;
      }).observe(document.body, { childList: true, subtree: true });
    });
  });
  const preorders = () => page.evaluate(() => (window as unknown as { __preorders: unknown }).__preorders);
  await page.goto('./');
  await waitForShell(page);
  await expect(chapter(page).getByRole('heading', { name: 'Disintegration', exact: true })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(await preorders()).toEqual({ atParse: true, inserted: 0 });

  // Shell entry swaps Home's server HTML in with the section already present.
  await plantSentinel(page);
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Services', exact: true }).click();
  await expect(page).toHaveURL(/\/services\/$/);
  await expect(page.locator('#preorders')).toHaveCount(0);
  await page.getByRole('link', { name: 'BlackBox Records', exact: true }).click();
  await expect(chapter(page).getByRole('heading', { name: 'Disintegration', exact: true })).toBeVisible();
  await expect(chapter(page).getByText('€28.00', { exact: true })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(await sentinelIntact(page)).toBe(true);
  expect(fixture.stateReads).toEqual([]);
  expect(fixture.providerRequests).toEqual([]);
  const sitemap = await page.request.get('sitemap.xml');
  expect(await sitemap.text()).not.toContain('preorder-showcase.json');
  expect((await page.request.get('preorder-showcase.json')).ok()).toBe(false);
});

function chapter(page: Page, title = 'Disintegration') {
  return page.getByRole('article', { name: title, exact: true });
}

for (const variant of ['video', 'photo', 'cover'] as const) {
  test(`Thursday desktop ${variant} composition respects the 800px boundary and text enlargement`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    await mountChapter(page, undefined, { variant, listen: true });
    const release = chapter(page, 'Playback fixture');
    const preorder = release.getByRole('link', { name: 'Pre-order', exact: true });
    const listen = release.getByRole('button', { name: 'Listen', exact: true });
    for (const width of [800, 801, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => document.fonts.ready);
      await expectNoHorizontalOverflow(page);
      await expect(listen).toHaveCount(1);
      await expect(listen).toBeVisible();
      const wide = width > 800 && variant !== 'cover';
      const box = (await release.boundingBox())!;
      if (wide) {
        expect(box.x).toBeCloseTo(0, 0);
        expect(box.width).toBeCloseTo(width, 0);
        await expect(release.locator('.home-preorders__actions .home-preorders__listen')).toBeHidden();
        for (const action of [preorder, listen]) {
          expect((await action.boundingBox())!.width).toBeCloseTo(168, 0);
          expect((await action.boundingBox())!.height).toBeCloseTo(44, 0);
        }
        const slot = variant === 'video' ? '.home-preorders__film-tools' : '.home-preorders__identity';
        await expect(release.locator(slot).getByRole('button', { name: 'Listen', exact: true })).toBeVisible();
        if (variant === 'photo') {
          const photo = release.locator('.home-preorders__band-photo');
          expect(await photo.evaluate((image) => getComputedStyle(image).objectFit)).toBe('contain');
          expect((await photo.boundingBox())!.height).toBeCloseTo(520, 0);
          const fill = await release
            .locator('.home-preorders__still-scene')
            .evaluate((scene) => getComputedStyle(scene, '::before').backgroundImage);
          expect(fill).toContain(await photo.getAttribute('src'));
          // Read related positions together so resize scroll anchoring cannot change their coordinate origin.
          const { facts, summary, purchase } = await release.evaluate((chapter) => {
            const rect = (selector: string) => {
              const box = chapter.querySelector(selector)!.getBoundingClientRect();
              return { x: box.x, y: box.y, height: box.height };
            };
            return {
              facts: rect('dl'),
              summary: rect('.home-preorders__summary'),
              purchase: rect('.home-preorders__purchase'),
            };
          });
          expect(summary.y).toBeGreaterThanOrEqual(facts.y + facts.height);
          expect(purchase.y).toBeGreaterThanOrEqual(facts.y + facts.height);
          expect(summary.x).toBeLessThan(purchase.x);
        } else {
          expect((await release.locator('.home-preorders__film-scene').boundingBox())!.height).toBeGreaterThanOrEqual(
            920,
          );
          const { watch, sound } = await release.locator('.home-preorders__film-tools').evaluate((tools) => {
            const rect = (selector: string) => {
              const box = tools.querySelector(selector)!.getBoundingClientRect();
              return { x: box.x, y: box.y, width: box.width, height: box.height };
            };
            return { watch: rect('.site-button'), sound: rect('.home-preorders__listen') };
          });
          expect(sound.y + sound.height / 2).toBeCloseTo(watch.y + watch.height / 2, 0);
          expect(sound.x + sound.width).toBeLessThanOrEqual(watch.x);
          expect((await release.locator('.home-preorders__hero-sleeve').boundingBox())!.width).toBeCloseTo(220, 0);
        }
      } else {
        expect(box.x).toBeGreaterThan(0);
        await expect(
          release.locator('.home-preorders__actions').getByRole('button', { name: 'Listen', exact: true }),
        ).toBeVisible();
      }
      const cover = release.locator('.home-preorders__sleeve');
      expect(await cover.evaluate((image) => getComputedStyle(image).objectFit)).toBe('contain');
      if (width === 1440) {
        await release.screenshot({ path: testInfo.outputPath(`thursday-${variant}-1440.png`) });
        await listen.focus();
        await page.keyboard.press('Tab');
        const next =
          variant === 'video'
            ? release.getByRole('button', { name: 'Watch full video' })
            : variant === 'photo'
              ? preorder
              : release.getByRole('link', { name: 'Pre-order & delivery information' });
        await expect(next).toBeFocused();
        await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
        await expectNoHorizontalOverflow(page);
        for (const action of [preorder, listen]) {
          expect(await action.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
          expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        }
        await page.addStyleTag({ content: 'html { font-size: 16px !important; }' });
      }
    }
  });
}

test('Thursday chapters retain missing-data fallbacks and long Greek identities', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 801, height: 1000 });
  const title = 'Σιωπή και Ντέρτια με μεγάλες ιστορίες και ολόκληρη την ταυτότητα του δίσκου';
  for (const variant of ['video', 'photo', 'cover'] as const) {
    await page.goto('./');
    await mountChapter(page, undefined, { variant, title, metadata: false });
    const release = chapter(page, title);
    await expect(release.getByRole('button', { name: 'Listen', exact: true })).toHaveCount(0);
    await expect(release.locator('.home-preorders__desktop-listen')).toHaveCount(0);
    await expect(release.getByRole('heading', { name: title, exact: true })).toBeVisible();
    expect(await release.locator('h3').evaluate((node) => getComputedStyle(node).fontFamily)).toContain('Inter');
    await expect(release.getByRole('link', { name: 'Pre-order', exact: true })).toHaveAttribute('href', storePath);
    if (variant !== 'video') await expect(release.locator('dl dd').nth(1)).toHaveText('To be confirmed');
    await expectNoHorizontalOverflow(page);
  }
});

for (const variant of ['video', 'photo'] as const) {
  test(`Thursday ${variant} Listen remains synchronized across desktop and mobile resizing @phone`, async ({
    page,
    browserName,
  }) => {
    await page.route('https://bandcamp.com/EmbeddedPlayer/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<button>Local player fixture</button>' }),
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('./');
    await waitForShell(page);
    await mountChapter(page, undefined, { variant, listen: true });
    const release = chapter(page, 'Playback fixture');
    await release.getByRole('button', { name: 'Listen', exact: true }).click();
    const modal = page.getByRole('dialog', { name: 'Music player' });
    await expect(modal).toBeVisible();
    const iframe = modal.locator('iframe');
    await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
    const original = await iframe.elementHandle();
    await modal.locator('.music-streaming-service-embedded-player-provider-switcher').waitFor();
    await expect(modal.getByRole('button', { name: 'Close player', exact: true })).toBeFocused();
    await iframe.contentFrame().getByRole('button', { name: 'Local player fixture' }).click();
    // The local iframe fixture uses Firefox's blur signal, as in the existing Home player dismissal coverage.
    if (browserName === 'firefox') await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.getByRole('button', { name: 'Minimize player' }).click();
    await expect(modal).toBeHidden();
    for (const width of [800, 801, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const active = release.getByRole('button', { name: 'In player', exact: true });
      await expect(active).toHaveCount(1);
      await expect(active).toBeDisabled();
      expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
      if (variant === 'video') await expect(release.getByRole('button', { name: 'Watch full video' })).toBeDisabled();
      await expectNoHorizontalOverflow(page);
    }
    await page.getByRole('button', { name: 'Stop player' }).click();
    await expect(page.locator('[data-music-streaming-service-embedded-player-iframe]')).toHaveCount(0);
    await expect(release.getByRole('button', { name: 'Listen', exact: true })).toBeEnabled();
  });
}

async function motion(action: Locator) {
  return action.evaluate((link) => {
    const layer = link.querySelector('.home-preorders__action-motion')!;
    const face = getComputedStyle(layer, '::before');
    const line = getComputedStyle(layer, '::after');
    return {
      face: Number(face.opacity),
      opacity: Number(line.opacity),
      faceDuration: face.transitionDuration,
      lineDuration: line.transitionDuration,
      easing: line.transitionTimingFunction,
      transform: line.transform,
      left: line.left,
      right: line.right,
      bottom: line.bottom,
      height: line.height,
      background: line.backgroundImage,
      outline: getComputedStyle(link).outlineWidth,
      halo: getComputedStyle(link, '::before').top,
      backgroundColor: getComputedStyle(link).backgroundColor,
      controlDuration: getComputedStyle(link).transitionDuration,
    };
  });
}

async function motionAction(page: Page) {
  await page.goto('./');
  await waitForShell(page);
  await waitForIsland(page, 'StorePreorderShowcase');
  const action = chapter(page).getByRole('link', { name: 'Pre-order', exact: true });
  await action.scrollIntoViewIfNeeded();
  // Complete pending hydration before dispatching test-only pointer events.
  await page.locator('#home-preorders-title').dispatchEvent('click');
  return action;
}

async function freezePressClock(page: Page) {
  const time = new Date('2026-10-19T12:00:00Z');
  await page.clock.install({ time });
  await page.clock.pauseAt(new Date(time.getTime() + 1000));
}

test('Home Soft edge desktop hover, focus and press preserve geometry', async ({ page }, testInfo) => {
  const action = await motionAction(page);
  const label = action.locator('.home-preorders__action-label');
  const rest = await action.boundingBox();
  const restLabel = await label.boundingBox();
  expect((await motion(action)).opacity).toBe(0);
  await action.evaluate((link) => {
    link.addEventListener(
      'pointerover',
      () => {
        // Sample the CSS timeline deterministically even when a busy browser misses frames.
        for (const animation of link
          .querySelector('.home-preorders__action-motion')!
          .getAnimations({ subtree: true })) {
          animation.pause();
          animation.currentTime = 110;
        }
      },
      { once: true },
    );
  });
  await action.hover();
  const entering = await motion(action);
  expect(entering.faceDuration).toBe('0.385s');
  expect(entering.lineDuration).toBe('0.7s');
  expect(entering.easing).toContain('cubic-bezier(0.22, 0.61, 0.36, 1)');
  expect(entering.backgroundColor).toBe('rgb(45, 118, 106)');
  const intermediate = await motion(action);
  expect(intermediate.opacity).toBeGreaterThan(0);
  expect(intermediate.opacity).toBeLessThan(0.72);
  await action.evaluate((link) => {
    for (const animation of link.querySelector('.home-preorders__action-motion')!.getAnimations({ subtree: true })) {
      animation.play();
    }
  });
  await expect.poll(async () => (await motion(action)).transform).toBe('matrix(1, 0, 0, 1, 0, 0)');
  const final = await motion(action);
  expect(final).toMatchObject({ left: '6px', right: '6px', bottom: '4px', height: '1px' });
  expect(final.background).toContain('15%');
  expect(final.background).toContain('85%');
  expect(final.opacity).toBeCloseTo(0.72, 2);
  expect(await action.boundingBox()).toEqual(rest);
  expect(await label.boundingBox()).toEqual(restLabel);
  await action.screenshot({ path: testInfo.outputPath('soft-edge-desktop-hover.png') });
  await page.mouse.move(0, 0);
  expect((await motion(action)).lineDuration).toBe('0.455s');
  await expect.poll(async () => (await motion(action)).opacity).toBe(0);
  // Keyboard input must recover full focus motion after a touch interaction on a hybrid device.
  const touch = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 };
  await action.dispatchEvent('pointerdown', touch);
  await action.dispatchEvent('pointercancel', touch);
  await expect(action).toHaveAttribute('data-press-input', '');
  await action.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(action).toBeFocused();
  expect(parseFloat((await motion(action)).outline)).toBeCloseTo(2, 0);
  expect((await motion(action)).faceDuration).toBe('0.385s');
  expect((await motion(action)).lineDuration).toBe('0.7s');
  await action.evaluate((link: HTMLAnchorElement) => link.blur());
  await action.hover();
  await page.mouse.down();
  expect((await motion(action)).faceDuration).toBe('0s');
  expect((await motion(action)).face).toBe(1);
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await action.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  expect((await motion(action)).controlDuration).toBe('0s');
  expect((await motion(action)).faceDuration).toBe('0s');
  expect((await motion(action)).lineDuration).toBe('0s');
});

test('Home Soft edge quick mouse tap animates in coarse input without delaying activation @phone', async ({ page }) => {
  const action = await motionAction(page);
  test.skip(
    !(await page.evaluate(() => matchMedia('(hover: none), (pointer: coarse)').matches)),
    'Fine primary pointer',
  );
  await action.evaluate((link) => {
    window.addEventListener(
      'click',
      (event) => {
        if (!(event.target instanceof Element) || !link.contains(event.target)) return;
        // Keep this visual test on Home; a separate test exercises real native navigation.
        event.preventDefault();
        event.stopPropagation();
        link.setAttribute('data-test-click-pressed', String(link.hasAttribute('data-pressed')));
      },
      { capture: true },
    );
  });
  await freezePressClock(page);
  const box = (await action.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.clock.runFor(20);
  await page.mouse.up();
  await expect(action).toHaveAttribute('data-test-click-pressed', 'true');
  await expect(action).toHaveAttribute('data-pressed', '');
  expect((await motion(action)).faceDuration).toBe('0.22s');
  expect((await motion(action)).lineDuration).toBe('0.22s');
  expect((await motion(action)).halo).toBe('-5px');
  await page.clock.runFor(190);
  await expect(action).toHaveAttribute('data-pressed', '');
  await page.clock.runFor(20);
  await expect(action).not.toHaveAttribute('data-pressed');
  expect((await motion(action)).faceDuration).toBe('0.18s');
});

test('Home Soft edge touch, repeated and long presses reset on cancellation and blur @phone', async ({ page }) => {
  const action = await motionAction(page);
  await freezePressClock(page);
  const down = { pointerId: 11, pointerType: 'touch', isPrimary: true, button: 0 };
  await action.dispatchEvent('pointerdown', { ...down, button: 2 });
  await expect(action).not.toHaveAttribute('data-pressed');
  await action.dispatchEvent('pointerdown', down);
  await action.dispatchEvent('pointerdown', { ...down, pointerId: 12, isPrimary: false });
  await action.dispatchEvent('pointerup', { ...down, pointerId: 12, isPrimary: false });
  await expect(action).toHaveAttribute('data-pressed', '');
  await action.dispatchEvent('pointerup', down);
  await page.clock.runFor(150);
  await action.dispatchEvent('pointerdown', { ...down, pointerId: 13 });
  await page.clock.runFor(100);
  await expect(action).toHaveAttribute('data-pressed', '');
  await page.clock.runFor(250);
  await expect(action).toHaveAttribute('data-pressed', '');
  await action.dispatchEvent('pointerup', { ...down, pointerId: 13 });
  await expect(action).not.toHaveAttribute('data-pressed');
  await action.dispatchEvent('pointerdown', down);
  await action.dispatchEvent('pointercancel', down);
  await page.clock.runFor(250);
  await expect(action).not.toHaveAttribute('data-pressed');
  await action.dispatchEvent('pointerdown', down);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(action).not.toHaveAttribute('data-pressed');
  await action.dispatchEvent('pointerdown', { ...down, pointerType: 'mouse' });
  await action.dispatchEvent('pointerout', { ...down, pointerType: 'mouse' });
  await expect(action).not.toHaveAttribute('data-pressed');
});

test('Home Soft edge removes transitions and pending holds when reduced motion changes @phone', async ({ page }) => {
  const action = await motionAction(page);
  const down = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 };
  await action.dispatchEvent('pointerdown', down);
  await action.dispatchEvent('pointerup', down);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(action).not.toHaveAttribute('data-pressed');
  expect((await motion(action)).faceDuration).toBe('0s');
  expect((await motion(action)).lineDuration).toBe('0s');
  await action.dispatchEvent('pointerdown', down);
  await expect(action).toHaveAttribute('data-pressed', '');
  expect((await motion(action)).face).toBe(1);
  await action.dispatchEvent('pointerup', down);
  await expect(action).not.toHaveAttribute('data-pressed');
});

test('Home Soft edge cancels its pending timer when the island unmounts @phone', async ({ page }) => {
  const action = await motionAction(page);
  await freezePressClock(page);
  await page.evaluate(() => {
    const schedule = window.setTimeout;
    const cancel = window.clearTimeout;
    const pending = new Set<number>();
    Object.assign(window, { softEdgeTimers: pending });
    window.setTimeout = ((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
      const id = schedule(callback, delay, ...args);
      if (delay && delay <= 220) pending.add(id);
      return id;
    }) as typeof window.setTimeout;
    window.clearTimeout = (id) => {
      pending.delete(id!);
      cancel(id);
    };
  });
  const down = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 };
  await action.dispatchEvent('pointerdown', down);
  await action.dispatchEvent('pointerup', down);
  const pending = () => page.evaluate(() => (window as unknown as { softEdgeTimers: Set<number> }).softEdgeTimers.size);
  expect(await pending()).toBe(1);
  await action.evaluate((link) => link.closest('astro-island')!.dispatchEvent(new CustomEvent('astro:unmount')));
  expect(await pending()).toBe(0);
  await page.clock.runFor(500);
});

test('Home Soft edge native touch activates immediately and cleans up on shell unmount @phone', async ({ page }) => {
  const action = await motionAction(page);
  await action.evaluate((link) => {
    link.addEventListener('click', () => {
      sessionStorage.setItem('soft-edge-at-click', String(link.hasAttribute('data-pressed')));
    });
  });
  await plantSentinel(page);
  await action.tap();
  await expect(page).toHaveURL(storePath);
  expect(await page.evaluate(() => sessionStorage.getItem('soft-edge-at-click'))).toBe('true');
  expect(await sentinelIntact(page)).toBe(true);
  await page.getByRole('link', { name: 'BlackBox Records', exact: true }).click();
  await waitForIsland(page, 'StorePreorderShowcase');
  await expect(chapter(page).locator('[data-pressed]')).toHaveCount(0);
});

test('Home Soft edge hydrates on cold shell entry and cached return @phone', async ({ page }) => {
  await page.goto('services/');
  await waitForShell(page);
  await plantSentinel(page);
  for (let entry = 0; entry < 2; entry += 1) {
    await page.getByRole('link', { name: 'BlackBox Records', exact: true }).click();
    await waitForIsland(page, 'StorePreorderShowcase');
    const action = chapter(page).getByRole('link', { name: 'Pre-order', exact: true });
    await action.scrollIntoViewIfNeeded();
    await expect(action).not.toHaveAttribute('data-pressed');
    const down = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 };
    await action.dispatchEvent('pointerdown', down);
    await expect(action).toHaveAttribute('data-pressed', '');
    await action.dispatchEvent('pointercancel', down);
    await expect(action).not.toHaveAttribute('data-pressed');
    await page.goBack();
    await expect(page).toHaveURL(/\/services\/$/);
  }
  expect(await sentinelIntact(page)).toBe(true);
});

test('Home Soft edge keeps native modified clicks and no-JavaScript links', async ({ page, browser }) => {
  const action = await motionAction(page);
  const popup = page.context().waitForEvent('page');
  await action.click({ modifiers: ['ControlOrMeta'] });
  const opened = await popup;
  await expect(opened).toHaveURL(storePath);
  await opened.close();
  await expect(page).toHaveURL(/\/blackbox-records\/$/);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const fallback = await context.newPage();
  await fallback.goto(page.url());
  const link = fallback.locator('#preorders .preorder-action');
  await expect(link).toHaveAccessibleName('Pre-order');
  await link.click();
  await expect(fallback).toHaveURL(storePath);
  await context.close();
});

test('Home Soft edge stays readable at required widths and enlarged text', async ({ page }, testInfo) => {
  const action = await motionAction(page);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const textZoom of width === 1440 ? [1, 2] : [1]) {
      // Enlarge text without scaling the viewport or boxes: stricter than ordinary page zoom for label fitting.
      await page.addStyleTag({ content: `html { font-size: ${16 * textZoom}px !important; }` });
      await action.scrollIntoViewIfNeeded();
      await expectNoHorizontalOverflow(page);
      const pair = chapter(page).locator('.home-preorders__actions');
      const controls = await chapter(page)
        .locator('.preorder-action:visible, .home-preorders__listen:visible')
        .evaluateAll((elements) =>
          elements.map((element) => {
            const box = element.getBoundingClientRect();
            return { height: box.height, width: box.width, fits: element.scrollWidth <= element.clientWidth };
          }),
        );
      expect(controls).toHaveLength(2);
      if (width <= 800) expect(controls[0]!.width).toBeCloseTo(controls[1]!.width, 0);
      else {
        await expect(pair.getByRole('button', { name: 'Listen', exact: true })).toHaveCount(0);
        await expect(
          chapter(page).locator('.home-preorders__identity').getByRole('button', { name: 'Listen', exact: true }),
        ).toBeVisible();
      }
      for (const control of controls) {
        expect(control.height).toBeGreaterThanOrEqual(44);
        expect(control.fits).toBe(true);
      }
      await pair.screenshot({ path: testInfo.outputPath(`soft-edge-${width}-text-${textZoom}.png`) });
    }
  }
});

test('Home keeps active preorders abroad and preserves a Greece delivery correction on shell return', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let traceRequests = 0;
  await page.route('**/cdn-cgi/trace', (route) => {
    traceRequests += 1;
    return route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' });
  });
  await page.goto('./');
  await waitForShell(page);
  const release = chapter(page);
  await expect(release.getByRole('heading', { name: 'Disintegration', exact: true })).toBeVisible();
  await expect(release.getByText('€28.00', { exact: true })).toBeVisible();
  await expect(release.getByRole('link', { name: 'Pre-order', exact: true })).toHaveAttribute('href', storePath);
  const email = release.getByRole('link', { name: 'Email us to order', exact: true });
  await expect(email).toBeVisible();
  const mailto = new URL((await email.getAttribute('href'))!);
  expect(mailto.pathname).toBe('orders@blackboxrecordsathens.com');
  expect(mailto.searchParams.get('subject')).toBe('Order from outside Greece');
  expect(mailto.searchParams.get('body')).toBe('Items: Disintegration\nCountry:\nCity:');
  await expectNoHorizontalOverflow(page);

  await release.getByRole('button', { name: 'Deliver to Greece', exact: true }).click();
  await expect(email).toHaveCount(0);
  await expect(release.locator('.international-order-delivery')).toContainText('Delivery: Greece');
  await expect(release.getByRole('button', { name: 'Change delivery to outside Greece', exact: true })).toBeFocused();
  await expect(release.getByRole('link', { name: 'Pre-order', exact: true })).toBeVisible();

  await plantSentinel(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Services', exact: true }).click();
  await expect(page).toHaveURL(/\/services\/$/);
  await page.getByRole('link', { name: 'BlackBox Records', exact: true }).click();
  await expect(release.getByRole('heading', { name: 'Disintegration', exact: true })).toBeVisible();
  await expect(release.locator('.international-order-delivery')).toContainText('Delivery: Greece');
  await expect(email).toHaveCount(0);
  expect(traceRequests).toBe(1);
  expect(await sentinelIntact(page)).toBe(true);
});

for (const country of ['GR', 'XX']) {
  test(`Home keeps active preorders and a quiet shipping hint for ${country}`, async ({ page }) => {
    watchShowcase(page);
    await page.route('**/cdn-cgi/trace', (route) =>
      route.fulfill({ contentType: 'text/plain', body: `loc=${country}\n` }),
    );
    const trace = page.waitForResponse('**/cdn-cgi/trace');
    await page.goto('./');
    await waitForShell(page);
    await trace;
    const release = chapter(page);
    await expect(release.getByRole('heading', { name: 'Disintegration', exact: true })).toBeVisible();
    await expect(release.getByRole('link', { name: 'Pre-order', exact: true })).toBeVisible();
    await expect(release.getByRole('link', { name: 'Email us to order', exact: true })).toHaveCount(0);
    await expect(release.getByRole('button', { name: 'Deliver to Greece', exact: true })).toHaveCount(0);
  });
}

test('Home photo chapter shows accepted identity and facts and delegates Listen to the shell', async ({ page }) => {
  const fixture = watchShowcase(page);
  await page.route('https://bandcamp.com/EmbeddedPlayer/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Local player fixture</button>' }),
  );
  await page.goto('./');
  await waitForShell(page);
  const release = chapter(page);
  await expect(release.getByRole('heading', { name: 'Disintegration', exact: true })).toBeVisible();
  await expect(release.getByRole('img', { name: 'Afterwise', exact: true })).toBeVisible();
  await expect(release.locator('dl dt')).toHaveText(['Format', 'Tracks', 'Recorded and mixed', 'Vinyl ships']);
  await expect(release.locator('dl dd').nth(1)).toHaveText(/\S/);
  await expect(release.locator('dl dd').nth(2)).toHaveText(/\S/);
  await expect(release.getByText('Around October 2026', { exact: true })).toBeVisible();
  await expect(release.getByRole('link', { name: 'Pre-order', exact: true })).toHaveAttribute('href', storePath);
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
  watchShowcase(page);
  await page.route('https://www.youtube-nocookie.com/embed/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>Local video fixture</p>' }),
  );
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

test('Home hero links only to the Store, fits phone widths and has no Scroll label', async ({ page }) => {
  watchShowcase(page);
  await page.goto('./');
  await waitForShell(page);
  await expect(page.getByRole('region', { name: 'Pre-orders', exact: true })).toBeVisible();

  const hero = page.locator('#homepage-hero-section');
  const browse = hero.getByRole('link', { name: 'Browse the Store' });
  await expect(browse).toHaveAttribute('href', /\/store\/$/);
  await expect(hero.getByRole('link')).toHaveCount(1);
  await expect(hero).not.toContainText(/scroll/i);

  for (const width of [390, 320, 280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      return {
        logoLeft: box('header img').left,
        mottoLeft: box('.homepage-hero-section__tagline-text').left,
        links: [...document.querySelectorAll('.homepage-hero-section__actions a')].map((link) => {
          const rect = link.getBoundingClientRect();
          return { left: rect.left, right: rect.right, height: rect.height };
        }),
      };
    });
    expect(layout.mottoLeft, `${width}px motto`).toBeCloseTo(layout.logoLeft, 0);
    expect(layout.links).toHaveLength(1);
    for (const link of layout.links) {
      expect(link.height, `${width}px drawn link`).toBeCloseTo(48, 2);
      expect(link.left, `${width}px link`).toBeGreaterThanOrEqual(layout.logoLeft - 0.5);
      expect(link.right, `${width}px link`).toBeLessThanOrEqual(width - layout.logoLeft + 0.5);
    }
  }

  await plantSentinel(page);
  await page.keyboard.press('Tab');
  await browse.focus();
  await expect(browse).toHaveCSS('outline-style', 'solid');
  // Firefox can round the shared 2px outline at fractional device scales.
  expect(await browse.evaluate((link) => parseFloat(getComputedStyle(link).outlineWidth))).toBeGreaterThanOrEqual(1.5);
  await browse.press('Enter');
  await expect(page).toHaveURL(/\/store\/$/);
  await waitForShell(page);
  expect(await sentinelIntact(page)).toBe(true);
});

test('Home photo chapter preserves artwork and links to the Store filter', async ({ page }) => {
  const fixture = watchShowcase(page);
  // The Store keeps its live listing read; only Home and Releases render the projection.
  await page.route('**/api/store/listing-prices*', (route) =>
    route.fulfill({
      json: [
        {
          storeItemSlug: 'disintegration-black-vinyl-lp',
          presentationState: 'ready',
          availabilityState: 'stocked',
          displayPrice: '€28.00',
          preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
        },
      ],
    }),
  );
  await page.goto('./');
  await waitForShell(page);
  const release = chapter(page);
  await expect(release.getByRole('img', { name: 'Disintegration cover', exact: true })).toHaveAttribute(
    'src',
    acceptedImage,
  );
  await expect(release.getByRole('link', { name: /artwork/i })).toHaveCount(0);
  await expect(release.getByRole('img', { name: 'Afterwise', exact: true })).toHaveCount(1);
  await expect(release.locator('video, iframe')).toHaveCount(0);
  await expect(release.getByRole('button', { name: /Watch/ })).toHaveCount(0);
  expect(fixture.providerRequests).toEqual([]);
  await page.getByRole('link', { name: 'All pre-orders', exact: true }).click();
  await expect(page).toHaveURL(/\/store\/#preorders$/);
  await expect(page.getByRole('button', { name: 'Pre-orders 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

// Local content has no clip: the film band and the sleeve row are covered by the component tests.
test('Home photo chapter on a phone is a clean photo band with the identity and purchase under it @phone', async ({
  page,
}) => {
  await page.goto('./');
  await waitForShell(page);
  const release = chapter(page);
  const title = release.getByRole('heading', { name: 'Disintegration', exact: true });
  const photo = release.getByRole('img', { name: 'Afterwise', exact: true });
  await photo.scrollIntoViewIfNeeded();
  await expect(title).toBeVisible();
  const width = page.viewportSize()!.width;
  const band = (await photo.boundingBox())!;
  const heading = (await title.boundingBox())!;
  const sleeve = (await release.getByRole('img', { name: 'Disintegration cover', exact: true }).boundingBox())!;
  expect(band.x).toBeCloseTo(16, 0);
  expect(band.x + band.width).toBeCloseTo(width - 16, 0);
  expect(band.height).toBeCloseTo((band.width * 9) / 16, 0);
  expect(heading.y).toBeGreaterThanOrEqual(band.y + band.height);
  expect(sleeve.y).toBeGreaterThanOrEqual(band.y + band.height);
  expect(sleeve.width).toBeCloseTo(96, 0);
  await expect(release.getByRole('button', { name: 'Watch full video' })).toHaveCount(0);
  // Nothing renders over the band: no visible control or text box overlaps it.
  const overBand = await release.evaluate((article, box) => {
    const photo = article.querySelector('.home-preorders__band-photo');
    return [...article.querySelectorAll('*')]
      .filter((element) => element !== photo && !element.contains(photo) && element.getClientRects().length)
      .filter((element) => getComputedStyle(element).visibility !== 'hidden')
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.top < box.y + box.height - 1 &&
          rect.bottom > box.y + 1 &&
          rect.left < box.x + box.width - 1 &&
          rect.right > box.x + 1
        );
      })
      .map((element) => element.className);
  }, band);
  expect(overBand).toEqual([]);
  await expect(release.locator('dl')).toBeHidden();
  const pair = await Promise.all(
    [
      release.getByRole('link', { name: 'Pre-order', exact: true }),
      release.getByRole('button', { name: 'Listen' }),
    ].map(async (control) => (await control.boundingBox())!),
  );
  for (const control of pair) expect(control.height).toBeCloseTo(44, 0);
  expect(pair[0]!.width).toBeCloseTo(pair[1]!.width, 0);
  await expect(release.getByRole('link', { name: 'Pre-order & delivery information' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
