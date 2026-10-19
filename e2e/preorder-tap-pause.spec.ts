import type { Locator, Page } from 'playwright/test';
import { expect, expectNoHorizontalOverflow, test, waitForIsland, waitForShell } from './fixtures';

async function mountFilms(page: Page, variant: 'video' | 'photo' | 'missing' = 'video') {
  await page.goto('./');
  await waitForShell(page);
  await waitForIsland(page, 'StorePreorderShowcase');
  await page.locator('#home-preorders-title').dispatchEvent('click');
  await page.evaluate(async (variant) => {
    const island = document.querySelector<HTMLElement>('astro-island[component-url*="StorePreorderShowcase"]')!;
    const { default: Component } = await import(island.getAttribute('component-url')!);
    const { default: render } = await import(island.getAttribute('renderer-url')!);
    const source = document.querySelector<HTMLVideoElement>('video[data-home-hero-film]')!.dataset.portraitSrc!;
    const coverUrl = island.querySelector<HTMLImageElement>('.home-preorders__sleeve')!.src;
    const posterUrl = island.querySelector<HTMLImageElement>('.home-preorders__band-photo')!.src;
    const trigger = island.querySelector<HTMLElement>('[data-music-listen-source-id]')!;
    const mount = document.createElement('div');
    mount.setAttribute('ssr', '');
    island.dispatchEvent(new CustomEvent('astro:unmount'));
    island.replaceWith(mount);
    const props = {
      storeUrl: '/blackbox-records/store/',
      items: ['first', 'second'].map((slug) => ({
        slug,
        title: `${slug} fixture`,
        artist: 'Local band',
        artistPath: '/blackbox-records/artists/chronoboros/',
        option: 'Vinyl',
        coverUrl,
        artistPhotoUrl: posterUrl,
        storePath: '/blackbox-records/store/disintegration-black-vinyl-lp/',
        displayPrice: '€28.00',
        shipEstimate: null,
        releaseDate: null,
        firstClipId: null,
        listen: {
          releaseId: trigger.dataset.musicListenSourceId,
          bandcampEmbedUrl: trigger.dataset.musicStreamingServiceEmbeddedPlayerBandcampEmbedUrl,
          tidalEmbedUrl: trigger.dataset.musicStreamingServiceEmbeddedPlayerTidalEmbedUrl,
        },
        clips:
          variant === 'photo'
            ? []
            : [
                {
                  id: slug === 'first' ? 'MOA5YZDOR6A' : 'dQw4w9WgXcQ',
                  title: `${slug} local film`,
                  posterUrl,
                  backgroundVideoUrl: variant === 'missing' ? null : source + '?tap-pause-fixture=' + slug,
                },
              ],
      })),
    };
    const paint = () => render(mount)(Component, props, {}, { client: 'only' });
    await paint();
    (window as unknown as { changePreorderClip: (id: string) => Promise<void> }).changePreorderClip = async (id) => {
      props.items[0]!.clips[0]!.id = id;
      await paint();
    };
  }, variant);
  const chapter = page.locator('#preorder-first');
  await chapter.locator('.home-preorders__media, .home-preorders__band-photo').first().scrollIntoViewIfNeeded();
  return chapter;
}

async function advancing(video: Locator) {
  await expect.poll(() => video.evaluate((media: HTMLVideoElement) => media.paused)).toBe(false);
  const time = await video.evaluate((media: HTMLVideoElement) => media.currentTime);
  await expect.poll(() => video.evaluate((media: HTMLVideoElement) => media.currentTime)).not.toBe(time);
}

async function frozen(video: Locator) {
  await expect.poll(() => video.evaluate((media: HTMLVideoElement) => media.paused)).toBe(true);
  await expect(video).toBeVisible();
  const time = await video.evaluate((media: HTMLVideoElement) => media.currentTime);
  await video.page().waitForTimeout(180);
  expect(await video.evaluate((media: HTMLVideoElement) => media.currentTime)).toBe(time);
}

for (const phone of [false, true]) {
  const suffix = phone ? ' @phone' : '';
  const press = async (button: Locator) => {
    if (phone) await button.tap({ position: { x: 12, y: 12 } });
    else await button.click({ position: { x: 12, y: 12 } });
  };

  test(`preorder direct background toggle freezes real footage without a visible control${suffix}`, async ({
    page,
  }, info) => {
    const chapter = await mountFilms(page);
    const video = chapter.locator('video');
    const toggle = chapter.locator('.home-preorders__ambient-toggle');
    await expect(toggle).toHaveAccessibleName(/^Pause background video/);
    await advancing(video);
    await press(toggle);
    await expect(toggle).toHaveAccessibleName('Resume background video for first fixture by Local band');
    await frozen(video);
    expect(await toggle.textContent()).toBe('');
    expect(await toggle.locator('*').count()).toBe(0);
    expect(await toggle.evaluate((button) => getComputedStyle(button).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    expect(await toggle.evaluate((button) => getComputedStyle(button).outlineStyle)).toBe('none');
    await expectNoHorizontalOverflow(page);
    await chapter.screenshot({ path: info.outputPath('paused-film.png') });
    await press(toggle);
    await advancing(video);
  });

  test(`preorder keyboard control supports Enter and Space with focus only on keyboard use${suffix}`, async ({
    page,
  }) => {
    const chapter = await mountFilms(page);
    const video = chapter.locator('video');
    const toggle = chapter.locator('.home-preorders__ambient-toggle');
    await advancing(video);
    await toggle.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(toggle).toBeFocused();
    expect(await toggle.evaluate((button) => getComputedStyle(button).outlineStyle)).toBe('solid');
    // Native Tab may reveal only the first pixels of the band, below playback's visibility threshold.
    await toggle.scrollIntoViewIfNeeded();
    await advancing(video);
    await page.keyboard.press('Enter');
    await frozen(video);
    await page.keyboard.press('Space');
    await advancing(video);
  });

  test(`preorder manual pause survives automatic suspension and another record${suffix}`, async ({ page }) => {
    await page.route('https://www.youtube-nocookie.com/embed/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<p>Local full video</p>' }),
    );
    const chapter = await mountFilms(page);
    const video = chapter.locator('video');
    const toggle = chapter.locator('.home-preorders__ambient-toggle');
    await advancing(video);
    await press(toggle);
    await frozen(video);
    const source = await video.getAttribute('src');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      document.documentElement.setAttribute('data-music-player-session', '');
    });
    await page.waitForTimeout(80);
    await page.evaluate(() => {
      delete (document as unknown as { hidden?: boolean }).hidden;
      document.dispatchEvent(new Event('visibilitychange'));
      document.documentElement.removeAttribute('data-music-player-session');
    });
    await frozen(video);
    const other = page.locator('#preorder-second video');
    await other.scrollIntoViewIfNeeded();
    await advancing(other);
    await toggle.scrollIntoViewIfNeeded();
    await frozen(video);
    await chapter.getByRole('button', { name: 'Watch full video', exact: true }).click();
    await expect(chapter.locator('iframe')).toHaveCount(1);
    await chapter.getByRole('button', { name: 'Close video' }).click();
    await expect(chapter.locator('iframe')).toHaveCount(0);
    await toggle.scrollIntoViewIfNeeded();
    await frozen(video);
    await expect(video).toHaveAttribute('src', source!);
    await press(toggle);
    await advancing(video);
  });

  test(`preorder film ignores drag, cancel and child actions${suffix}`, async ({ page }) => {
    await page.route(/^https:\/\/(bandcamp\.com|embed\.tidal\.com)\//, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<p>Local listening fixture</p>' }),
    );
    await page.route('https://www.youtube-nocookie.com/embed/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<p>Local full video</p>' }),
    );
    const chapter = await mountFilms(page);
    const video = chapter.locator('video');
    const toggle = chapter.locator('.home-preorders__ambient-toggle');
    await advancing(video);
    await toggle.dispatchEvent('pointerdown', { pointerId: 1, isPrimary: true, button: 0, clientX: 12, clientY: 12 });
    await toggle.dispatchEvent('pointermove', { pointerId: 1, clientX: 12, clientY: 60 });
    await toggle.dispatchEvent('click', { detail: 1 });
    await toggle.dispatchEvent('pointerdown', { pointerId: 2, isPrimary: true, button: 0, clientX: 12, clientY: 12 });
    await toggle.dispatchEvent('pointercancel', { pointerId: 2 });
    await toggle.dispatchEvent('click', { detail: 1 });
    await advancing(video);
    await chapter.locator('.home-preorders__artist-link').click();
    await page.getByRole('button', { name: 'Close detail view' }).click();
    await expect(page.getByRole('button', { name: 'Close detail view' })).toHaveCount(0);
    await expect(toggle).toHaveAccessibleName(/^Pause background video/);
    await chapter.locator('.home-preorders__listen:visible').click();
    await expect(page.getByRole('dialog', { name: 'Music player' })).toBeVisible();
    await expect(toggle).toHaveAccessibleName(/^Pause background video/);
    await page.getByRole('button', { name: 'Close player', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Music player' })).toHaveCount(0);
    await chapter.getByRole('button', { name: 'Watch full video', exact: true }).click();
    await expect(chapter.locator('iframe')).toHaveCount(1);
    await expect(toggle).toHaveAccessibleName(/^Pause background video/);
    await chapter.getByRole('button', { name: 'Close video' }).click();
    await chapter.locator('.home-preorders__next').click();
    await expect(page).toHaveURL(/#preorder-second$/);
    await expect(toggle).toHaveAccessibleName(/^Pause background video/);
    await toggle.scrollIntoViewIfNeeded();
    await advancing(video);
    if (phone) {
      const box = (await toggle.boundingBox())!;
      const session = await page.context().newCDPSession(page);
      const scroll = await page.evaluate(() => window.scrollY);
      const x = box.x + 12,
        y = box.y + Math.min(box.height - 12, 140);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let distance = 10; distance <= 90; distance += 10)
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - distance }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await session.detach();
      await expect(toggle).toHaveAccessibleName(/^Pause background video/);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scroll);
    }
    await chapter.getByRole('link', { name: 'Pre-order', exact: true }).click();
    await expect(page).toHaveURL(/\/store\/disintegration-black-vinyl-lp\/$/);
  });

  test(`preorder pause during loading survives the eventual media readiness${suffix}`, async ({ page }) => {
    let release!: () => void;
    let requested = false;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(/tap-pause-fixture=first/, async (route) => {
      requested = true;
      await ready;
      await route.continue();
    });
    const chapter = await mountFilms(page);
    const video = chapter.locator('video');
    const toggle = chapter.locator('.home-preorders__ambient-toggle');
    await expect.poll(() => requested).toBe(true);
    await press(toggle);
    release();
    await expect(toggle).toHaveAccessibleName(/^Resume background video/);
    await video.dispatchEvent('canplay');
    expect(await video.evaluate((media: HTMLVideoElement) => media.paused)).toBe(true);
    await expect(video).not.toBeVisible();
    await expect(chapter.locator('.home-preorders__video-poster')).toBeVisible();
    await press(toggle);
    await advancing(video);
  });

  test(`preorder clip changes preserve each clip's own pause intent${suffix}`, async ({ page }) => {
    const chapter = await mountFilms(page);
    const video = chapter.locator('video');
    const toggle = chapter.locator('.home-preorders__ambient-toggle');
    await advancing(video);
    await press(toggle);
    await frozen(video);
    const changeClip = (id: string) =>
      page.evaluate(
        (id) => (window as unknown as { changePreorderClip: (id: string) => Promise<void> }).changePreorderClip(id),
        id,
      );
    await changeClip('new-local-clip');
    await expect(toggle).toHaveAccessibleName(/^Pause background video/);
    await advancing(video);
    await changeClip('MOA5YZDOR6A');
    await expect(toggle).toHaveAccessibleName(/^Resume background video/);
    expect(await video.evaluate((media: HTMLVideoElement) => media.paused)).toBe(true);
    await expect(video).not.toBeVisible();
    await expect(chapter.locator('.home-preorders__video-poster')).toBeVisible();
    await press(toggle);
    await advancing(video);
  });

  for (const preference of ['reduced-motion', 'save-data']) {
    test(`preorder direct toggle preserves ${preference} defaults${suffix}`, async ({ page }) => {
      if (preference === 'reduced-motion') await page.emulateMedia({ reducedMotion: 'reduce' });
      else
        await page.addInitScript(() =>
          Object.defineProperty(navigator, 'connection', {
            configurable: true,
            value: Object.assign(new EventTarget(), { saveData: true }),
          }),
        );
      const chapter = await mountFilms(page);
      const video = chapter.locator('video');
      const toggle = chapter.locator('.home-preorders__ambient-toggle');
      await expect(toggle).toBeDisabled();
      await toggle.dispatchEvent('click');
      await video.dispatchEvent('canplay');
      await expect(video).not.toHaveAttribute('src', /.+/);
      expect(await video.evaluate((media: HTMLVideoElement) => media.paused)).toBe(true);
      await expect(chapter.getByRole('link', { name: 'Pre-order', exact: true })).toBeVisible();
    });
  }

  test(`preorder failed and absent footage never offers an active toggle${suffix}`, async ({ page }) => {
    const chapter = await mountFilms(page);
    const video = chapter.locator('video');
    await advancing(video);
    await video.dispatchEvent('error');
    await expect(chapter.locator('.home-preorders__ambient-toggle')).toBeDisabled();
    await expect(video).not.toBeVisible();
    await expect(chapter.locator('.home-preorders__video-poster')).toBeVisible();
    for (const variant of ['photo', 'missing'] as const) {
      const still = await mountFilms(page, variant);
      await expect(still.locator('.home-preorders__ambient-toggle')).toHaveCount(0);
      await expect(still.getByRole('link', { name: 'Pre-order', exact: true })).toBeVisible();
    }
  });
}
