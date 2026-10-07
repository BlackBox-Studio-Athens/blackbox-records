import { expect, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';

const stocked = { presentationState: 'ready', availabilityState: 'stocked', displayPrice: '€28.00', preorder: null };
const preorder = { ...stocked, preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } } };

test('release backdrop dismissal restores mouse-wheel scrolling', async ({ page }) => {
  await page.goto('releases/');
  await waitForShell(page);
  await plantSentinel(page);
  await page.mouse.move(1380, 750);
  await page.mouse.wheel(0, 200);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  for (let round = 0; round < 2; round++) {
    await page.locator('[data-release-id="anarchotribal"] .release-card-image-shell').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.locator('.app-shell-content-overlay__backdrop').click({ position: { x: 8, y: 450 } });
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page).toHaveURL(/\/releases\/$/);
    await expect(page.locator('.app-shell-content-overlay')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/is-shell-(?:scroll-locked|modal-open)/);
    const before = await page.evaluate(() => window.scrollY);
    const maximum = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    await page.mouse.move(1380, 750);
    await page.mouse.wheel(0, before >= maximum - 100 ? -400 : 400);
    await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(before);
    expect(await sentinelIntact(page)).toBe(true);
  }
});

test('Releases keeps SSR roles and square artwork while offers resolve on direct and shell entry', async ({
  page,
}, testInfo) => {
  let respond: (() => Promise<void>) | undefined;
  await page.route('**/api/store/listing-prices*', (route) => {
    if (new URL(route.request().url()).searchParams.get('scope') === 'preorders') return route.fulfill({ json: [] });
    respond = () =>
      route.fulfill({
        json: [
          { ...preorder, storeItemSlug: 'disintegration-black-vinyl-lp' },
          { ...stocked, storeItemSlug: 'caregivers-vinyl' },
        ],
      });
    return;
  });
  const html = await (await page.request.get('releases/')).text();
  const serverRoles = [...html.matchAll(/data-release-id="([^"]+)"\s+data-release-role="([^"]+)"/g)].map((match) => [
    match[1],
    match[2],
  ]);
  expect(serverRoles).toEqual([
    ['disintegration', 'lead'],
    ['anarchotribal', 'supporting'],
    ['caregivers', 'catalog'],
  ]);
  await page.goto('releases/');
  await waitForShell(page);
  const roles = () =>
    page
      .locator('[data-release-id]')
      .evaluateAll((cards) =>
        cards.map((card) => [card.getAttribute('data-release-id'), card.getAttribute('data-release-role')]),
      );
  await expect.poll(() => Boolean(respond)).toBe(true);
  expect(await roles()).toEqual(serverRoles);
  await expect(page.locator('.purchase-action, .preorder-action')).toHaveCount(0);
  await respond!();
  await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText(
    'Pre-order vinyl',
  );
  expect(await roles()).toEqual(serverRoles);
  for (const width of [2120, 1440, 1024, 320, 390, 430]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    const artwork = await page.locator('[data-release-role]:not([data-release-role="catalog"])').evaluateAll((cards) =>
      cards.map((card) => {
        const frame = card.querySelector('.release-card-image-shell')!.getBoundingClientRect();
        const image = card.querySelector('img')!;
        return {
          width: frame.width,
          height: frame.height,
          fit: getComputedStyle(image).objectFit,
          transform: getComputedStyle(image).transform,
        };
      }),
    );
    for (const image of artwork) {
      expect(Math.abs(image.height - image.width)).toBeLessThan(1);
      expect(image.fit).toBe('contain');
      expect(image.transform).toBe('none');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 2120 || width < 768)
      await page
        .locator('#releases-merchandising')
        .screenshot({ path: `.codex-artifacts/catalog-repairs/releases-${testInfo.project.name}-${width}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await plantSentinel(page);
  await page.getByRole('link', { name: 'BlackBox Records', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'BlackBox Records', exact: true })).toBeVisible();
  respond = undefined;
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Releases', exact: true }).click();
  await expect.poll(() => Boolean(respond)).toBe(true);
  expect(await roles()).toEqual(serverRoles);
  await expect(page.locator('.purchase-action, .preorder-action')).toHaveCount(0);
  await respond!();
  await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText(
    'Pre-order vinyl',
  );
  expect(await roles()).toEqual(serverRoles);
  expect(await sentinelIntact(page)).toBe(true);
});

for (const [label, releaseDate, digitalStatus] of [
  ['released', '2026-06-06', 'Digital out now'],
  ['unreleased', '2099-11-06', 'Album upcoming'],
  ['undated', undefined, ''],
] as const) {
  test(`Upcoming vinyl remains announced while the digital album is ${label}`, async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date('2026-10-05T12:00:00Z'));
    await page.route('**/releases/', async (route) => {
      const response = await route.fetch();
      const html = await response.text();
      const body = html.replace(/<div\b[^>]*\bdata-release-id="anarchotribal"[^>]*>/, (tag) =>
        tag
          .replace(/\sdata-release-stage="[^"]*"/, '')
          .replace(/\sdata-release-date="[^"]*"/, '')
          .replace(
            '<div',
            `<div data-release-stage="upcoming"${releaseDate ? ` data-release-date="${releaseDate}"` : ''}`,
          ),
      );
      expect(body).not.toBe(html);
      await route.fulfill({ response, body });
    });
    let current = { ...stocked, availabilityState: 'sold_out' } as typeof stocked | typeof preorder;
    let failed = false;
    await page.route('**/api/store/listing-prices*', (route) =>
      failed
        ? route.fulfill({ contentType: 'application/json', body: '{' })
        : route.fulfill({
            json: [
              { ...preorder, storeItemSlug: 'disintegration-black-vinyl-lp' },
              { ...stocked, storeItemSlug: 'caregivers-vinyl' },
              { ...current, storeItemSlug: 'anarchotribal-vinyl' },
            ],
          }),
    );
    await page.goto('releases/');
    await waitForShell(page);
    await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText(
      'Pre-order vinyl',
    );
    const announced = page.locator('[data-release-id="anarchotribal"]');
    await expect(announced).toHaveAttribute('data-release-role', 'supporting');
    await expect(announced.locator('[data-release-badges]')).toHaveText(`${digitalStatus}Vinyl coming later`);
    await expect(announced.locator('[data-release-purchase]')).toHaveText('View vinyl details');
    await expect(page.locator('[data-release-id]')).toHaveCount(3);
    await expect(page.getByRole('heading', { name: 'Our Releases', exact: true })).toBeVisible();
    await expect(announced.locator('.preorder-action, .purchase-action')).toHaveCount(0);

    if (label === 'released') {
      await page.setViewportSize({ width: 390, height: 900 });
      await announced.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      await expect
        .poll(() =>
          announced
            .locator('.release-card-image-shell img')
            .evaluate((image) => (image as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
      await expect(announced.locator('[data-release-badges]')).toHaveText('Digital out nowVinyl coming later');
      await announced.screenshot({
        path: `.codex-artifacts/catalog-video-contact/anarchotribal-${testInfo.project.name}-390.png`,
      });
      await page.setViewportSize({ width: 1440, height: 900 });
    }

    await plantSentinel(page);
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Artists', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: /^Artists$/i })).toBeVisible();
    failed = true;
    const failedRead = page.waitForResponse(
      (response) => response.url().includes('/api/store/listing-prices') && response.status() === 200,
    );
    await page.goBack();
    await failedRead;
    await expect(announced.locator('[data-release-badges]')).toHaveText(`${digitalStatus}Vinyl coming later`);
    await expect(announced.locator('[data-release-purchase]')).toHaveText('View vinyl details');
    expect(await sentinelIntact(page)).toBe(true);

    failed = false;
    current = preorder;
    await page.reload();
    await expect(announced.locator('[data-release-purchase]')).toHaveText('Pre-order vinyl');
    current = stocked;
    await page.reload();
    await expect(announced.locator('[data-release-purchase]')).toHaveText('Buy vinyl');
    await expect(announced.locator('[data-release-badges]')).toHaveText(`${digitalStatus}Vinyl available`);
    await expect(page.locator('[data-release-id]')).toHaveCount(3);
  });
}

for (const width of [320, 360, 390, 430, 768]) {
  test(`Releases aligns complete artwork and touch actions within mobile gutters at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/api/store/listing-prices*', (route) =>
      route.fulfill({
        json: [
          { ...preorder, storeItemSlug: 'disintegration-black-vinyl-lp' },
          { ...stocked, storeItemSlug: 'caregivers-vinyl' },
        ],
      }),
    );
    await page.goto('releases/');
    await waitForShell(page);
    await expect(page.locator('[data-release-role="supporting"]')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const contentWidth = await page.evaluate(() => document.documentElement.getBoundingClientRect().width);
    const measurements = await page.locator('[data-release-role]').evaluateAll((cards) =>
      cards.map((card) => {
        const artwork = card.querySelector('.release-card-image-shell')!.getBoundingClientRect();
        const copy = card.querySelector('.release-card-copy')!.getBoundingClientRect();
        const image = card.querySelector('img')!;
        return {
          role: card.getAttribute('data-release-role'),
          artwork: { x: artwork.x, y: artwork.y, width: artwork.width, right: artwork.right, bottom: artwork.bottom },
          copy: { x: copy.x, y: copy.y },
          transform: getComputedStyle(image).transform,
          actions: [...card.querySelectorAll('[data-release-actions] > *, .music-listen-trigger')].map((action) => {
            const rect = action.getBoundingClientRect();
            return { x: rect.x, right: rect.right, height: rect.height };
          }),
        };
      }),
    );
    for (const card of measurements) {
      expect(card.transform).toBe('none');
      for (const action of card.actions) {
        expect(action.x).toBeGreaterThanOrEqual(16);
        // Firefox rounds separate DOMRects differently; allow less than a hundredth of a CSS pixel.
        expect(action.right).toBeLessThanOrEqual(contentWidth - 16 + 0.01);
        expect(action.height).toBeGreaterThanOrEqual(44);
      }
      if (width < 640) {
        expect(card.artwork.x).toBe(16);
        if (card.role === 'supporting') {
          // Phones read the supporting release as a list row: a 6.5rem cover beside its identity and actions.
          expect(card.artwork.width).toBe(104);
          expect(card.copy.x).toBe(card.artwork.right + 16);
          expect(card.copy.y).toBe(card.artwork.y);
        } else {
          expect(card.artwork.width).toBe(contentWidth - 32);
          expect(card.copy.x).toBe(16);
          expect(card.copy.y).toBeGreaterThanOrEqual(card.artwork.bottom);
        }
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const width of [1024, 1440]) {
  test(`Releases top-aligns the lead and supporting release in one row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('releases/');
    await waitForShell(page);
    await page.evaluate(() => document.fonts.ready);
    const [lead, supporting] = await page
      .locator('[data-release-role="lead"], [data-release-role="supporting"]')
      .evaluateAll((cards) =>
        cards.map((card) => ({
          artwork: card.querySelector('.release-card-image-shell')!.getBoundingClientRect().toJSON(),
          copy: card.querySelector('.release-card-copy')!.getBoundingClientRect().toJSON(),
        })),
      );
    // Copy starts at the cover's top edge instead of centring in a row stretched by its neighbour.
    expect(Math.abs(lead!.copy.top - lead!.artwork.top)).toBeLessThan(1);
    expect(Math.abs(supporting!.artwork.top - lead!.artwork.top)).toBeLessThan(1);
    expect(supporting!.artwork.left).toBeGreaterThan(lead!.copy.right);
    expect(supporting!.artwork.width).toBeLessThan(lead!.artwork.width);
  });
}

for (const width of [390, 1280]) {
  test(`Releases keeps badge typography and date spacing after entering from Home at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.clock.setFixedTime(new Date('2026-10-05T12:00:00Z'));
    await page.route('**/api/store/listing-prices*', (route) =>
      route.fulfill({ json: [{ ...preorder, storeItemSlug: 'disintegration-black-vinyl-lp' }] }),
    );
    await page.goto('');
    await waitForShell(page);
    await plantSentinel(page);
    if (width < 640) await page.getByRole('banner').getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('link', { name: 'Releases', exact: true }).filter({ visible: true }).first().click();
    const lead = page.locator('[data-release-role="lead"]');
    await expect(lead).toHaveAttribute('data-release-id', 'disintegration');
    await expect(lead.locator('[data-release-purchase]')).toHaveText('Pre-order vinyl');
    const status = lead.locator('[data-release-badges] .store-item-card__release-status');
    await expect(status).toHaveText('Digital out now');
    await expect(status).toHaveCSS('font-family', /Geist Mono/);
    await expect(status).toHaveCSS('text-transform', 'uppercase');
    await expect(status).toHaveCSS('border-width', '0px');
    const badges = await lead.locator('[data-release-badges]').boundingBox();
    const date = await lead.locator('.release-card-year-text').boundingBox();
    expect(date!.y - badges!.y - badges!.height).toBeGreaterThanOrEqual(4);
    expect(await sentinelIntact(page)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const width of [320, 390, 1280]) {
  test(`Releases keeps the preorder visual family and current composition at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.clock.setFixedTime(new Date('2026-10-05T12:00:00Z'));
    let offerReads = 0;
    await page.route('**/api/store/listing-prices*', (route) => {
      offerReads += 1;
      return route.fulfill({
        json: [
          { ...preorder, storeItemSlug: 'disintegration-black-vinyl-lp' },
          { ...stocked, storeItemSlug: 'caregivers-vinyl' },
        ],
      });
    });
    await page.goto('releases/');
    await waitForShell(page);
    const lead = page.locator('[data-release-role="lead"]');
    await expect(lead).toHaveAttribute('data-release-id', 'disintegration');
    await expect(page.locator('[data-release-role="supporting"]')).toHaveAttribute('data-release-id', 'anarchotribal');
    await expect(page.locator('[data-release-id]')).toHaveCount(3);
    expect(
      await page
        .locator('[data-release-id]')
        .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-release-id'))),
    ).toEqual(['disintegration', 'anarchotribal', 'caregivers']);
    expect(offerReads).toBe(1);
    await expect(lead.getByRole('link', { name: 'Pre-order vinyl', exact: true })).toHaveClass(/preorder-action/);
    await expect(lead.locator('.preorder-badge')).toHaveText('Pre-order · ships around October 2026');
    await expect(lead.locator('[data-release-badges]')).toContainText('Digital out now');
    const status = lead.locator('[data-release-badges] .store-item-card__release-status');
    await expect(status).toHaveCSS('font-family', /Geist Mono/);
    await expect(status).toHaveCSS('font-weight', '700');
    await expect(status).toHaveCSS('text-transform', 'uppercase');
    await expect(status).toHaveCSS('border-width', '0px');
    const [badges, date] = await Promise.all([
      lead.locator('[data-release-badges]').boundingBox(),
      lead.locator('.release-card-year-text').boundingBox(),
    ]);
    expect(date!.y - badges!.y - badges!.height).toBeGreaterThanOrEqual(4);
    await expect(page.getByText('Featured records', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Our Releases', exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page
        .locator('[data-release-title]')
        .evaluateAll((headings) => headings.every((heading) => heading.scrollWidth <= heading.clientWidth + 1)),
    ).toBe(true);
    expect(await page.locator('img[fetchpriority="high"]').count()).toBe(1);
    await testInfo.attach('release-artwork-slots', {
      contentType: 'application/json',
      body: JSON.stringify(
        await page.locator('[data-release-role] img').evaluateAll((images) =>
          images.map((element) => {
            const image = element as HTMLImageElement;
            return {
              role: image.closest<HTMLElement>('[data-release-role]')?.dataset.releaseRole,
              renderedWidth: image.getBoundingClientRect().width,
              sizes: image.sizes,
              currentSrc: image.currentSrc,
              naturalWidth: image.naturalWidth,
              pixelRatio: devicePixelRatio,
            };
          }),
        ),
      ),
    });
    const button = lead.getByRole('link', { name: 'Pre-order vinyl', exact: true });
    // Firefox snaps fractional grid tracks; allow less than a hundredth of a CSS pixel.
    expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(44 - 0.01);
    await page.mouse.move(0, 0);
    await button.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
    const visual = await button.evaluate((element) => ({
      shadow: getComputedStyle(element).boxShadow,
      accent: getComputedStyle(element).getPropertyValue('--preorder-accent').trim(),
    }));
    expect(visual.shadow).toMatch(/-3(?:\.0+)?px/);
    expect(visual.accent).not.toBe('');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await button.focus();
    await expect(button).toBeFocused();
    await plantSentinel(page);
    await lead.locator('.release-card-title-link').click();
    await expect(page.getByRole('dialog').locator('[data-app-shell-overlay-kind="releases"]')).toBeVisible();
    expect(await sentinelIntact(page)).toBe(true);
    await page.goBack();
    await expect(lead).toBeVisible();
    await page.screenshot({ path: `.codex-artifacts/e2e/release-merchandising-${width}.png`, fullPage: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await lead.locator('img').evaluate((element) => getComputedStyle(element).transform)).toBe('none');
    if (width === 390) {
      await page.addStyleTag({ content: 'html { font-size: 200%; }' });
      const overflow = await page.evaluate(() =>
        [...document.querySelectorAll('body *')]
          .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 12)
          .map((element) => ({
            tag: element.tagName,
            className: element.getAttribute('class'),
            right: element.getBoundingClientRect().right,
          })),
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        JSON.stringify(overflow),
      ).toBe(true);
      await page.screenshot({ path: '.codex-artifacts/e2e/release-merchandising-390-200percent.png', fullPage: true });
    }
  });
}

test('Releases changes buying actions while retaining placement on a fresh offer read', async ({ page }) => {
  let current = preorder as typeof stocked | typeof preorder;
  let unknown = false;
  await page.route('**/api/store/listing-prices*', (route) =>
    route.fulfill({
      json: unknown
        ? []
        : [
            { ...current, storeItemSlug: 'disintegration-black-vinyl-lp' },
            { ...stocked, storeItemSlug: 'caregivers-vinyl' },
          ],
    }),
  );
  await page.goto('releases/');
  await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText(
    'Pre-order vinyl',
  );
  current = stocked;
  await page.reload();
  await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText('Buy vinyl');
  await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveClass(
    /purchase-action/,
  );
  await expect(page.locator('[data-release-id="disintegration"] .preorder-badge')).toHaveCount(0);
  current = { ...stocked, availabilityState: 'sold_out' };
  await page.reload();
  await expect(page.locator('[data-release-role="lead"]')).toHaveAttribute('data-release-id', 'disintegration');
  await expect(page.locator('[data-release-id="disintegration"] [data-release-badges]')).toContainText('Sold Out');
  unknown = true;
  await page.reload();
  await expect(page.locator('[data-release-role="lead"]')).toHaveAttribute('data-release-id', 'disintegration');
  await expect(page.locator('[data-release-id]')).toHaveCount(3);
  await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText(
    'View vinyl details',
  );
  await expect(page.locator('.purchase-action, .preorder-action')).toHaveCount(0);
});

test('Releases keeps native destinations distinct from inert copy and status', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/api/store/listing-prices*', (route) =>
    route.fulfill({
      json: [
        { ...preorder, storeItemSlug: 'disintegration-black-vinyl-lp' },
        { ...stocked, storeItemSlug: 'caregivers-vinyl' },
      ],
    }),
  );
  await page.route(/^https:\/\/(bandcamp\.com|embed\.tidal\.com)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  await page.goto('releases/');
  await waitForShell(page);
  const lead = page.locator('[data-release-role="lead"]');
  await expect(lead).toHaveAttribute('data-release-id', 'disintegration');
  await plantSentinel(page);

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const role of ['lead', 'supporting', 'catalog']) {
      const card = page.locator(`[data-release-role="${role}"]`);
      await expect(card.locator('.prose-card-link, a a, a button')).toHaveCount(0);
      await expect(card.locator('.release-card-title-link')).toBeVisible();
      for (const selector of [
        '[data-release-summary]',
        '.release-card-year-text',
        '.releases-latest-feature__upcoming-formats',
        '[data-release-badges]',
      ]) {
        const copy = card.locator(selector);
        if (await copy.isVisible()) {
          await copy.click();
          await expect(page).toHaveURL(/\/releases\/$/);
          await expect(page.getByRole('dialog')).toHaveCount(0);
        }
      }
    }
    await lead.locator('.release-card-copy').click({ position: { x: 2, y: 2 } });
    await expect(page).toHaveURL(/\/releases\/$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }

  const artwork = lead.locator('.release-card-artwork-link');
  const title = lead.locator('.release-card-title-link[data-release-detail]');
  const artist = lead.getByRole('link', { name: 'Afterwise', exact: true });
  const purchase = lead.getByRole('link', { name: 'Pre-order vinyl', exact: true });
  const listen = lead.getByRole('button', { name: 'Listen', exact: true });
  const image = artwork.locator('img');
  await page.mouse.move(0, 0);
  await image.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  const restingArtwork = await image.evaluate((element) => getComputedStyle(element).transform);
  for (const action of [purchase, listen]) {
    await action.hover();
    await image.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
    await expect(image).toHaveCSS('transform', restingArtwork);
  }
  await expect(artwork).toHaveAccessibleName(/disintegration/i);
  await expect(artwork).toHaveAttribute('tabindex', '-1');
  await expect(title).toHaveAccessibleName(/disintegration/i);
  await expect(lead.locator('[data-release-actions]').getByRole('link')).toHaveCount(1);
  await title.focus();
  for (const control of [title, artist, purchase, listen]) {
    await expect(control).toBeFocused();
    expect(await control.evaluate((element) => parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThan(0);
    await page.keyboard.press('Tab');
  }

  for (const link of [artwork, title]) {
    await link.click();
    await expect(page).toHaveURL(/\/releases\/disintegration\/$/);
    await expect(page.getByRole('dialog').locator('[data-app-shell-overlay-kind="releases"]')).toBeVisible();
    expect(await sentinelIntact(page)).toBe(true);
    await page.goBack();
    await expect(lead).toBeVisible();
  }
  await artist.click();
  await expect(page).toHaveURL(/\/artists\/afterwise\/$/);
  await expect(page.getByRole('dialog').locator('[data-app-shell-overlay-kind="artists"]')).toBeVisible();
  await page.goBack();
  expect(await sentinelIntact(page)).toBe(true);
  await purchase.click();
  await expect(page).toHaveURL(/\/store\/disintegration-black-vinyl-lp\/$/);
  await page.goBack();
  await waitForShell(page);
  // Store item details use document navigation; Listen must preserve the returned Releases document.
  await plantSentinel(page);
  await listen.click();
  await expect(page.getByRole('dialog', { name: 'Music player' })).toBeVisible();
  await expect(lead.getByRole('button', { name: 'In player', exact: true })).toBeDisabled();
  expect(await sentinelIntact(page)).toBe(true);
});

for (const result of ['unavailable', 'failed'] as const) {
  test(`cached Releases returns neutral before a ${result} fresh offer read`, async ({ page }) => {
    let freshRead = false;
    let respond: (() => Promise<void>) | undefined;
    await page.route('**/api/store/listing-prices*', (route) => {
      if (freshRead) {
        respond = () =>
          result === 'failed'
            ? route.fulfill({ status: 200, contentType: 'application/json', body: 'Invalid listing response' })
            : route.fulfill({
                json: [{ ...stocked, storeItemSlug: 'disintegration-black-vinyl-lp', availabilityState: 'sold_out' }],
              });
        return;
      }
      return route.fulfill({
        json: [
          { ...preorder, storeItemSlug: 'disintegration-black-vinyl-lp' },
          { ...stocked, storeItemSlug: 'caregivers-vinyl' },
        ],
      });
    });
    await page.goto('releases/');
    await waitForShell(page);
    await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText(
      'Pre-order vinyl',
    );
    expect(
      await page
        .locator('[data-release-id]')
        .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-release-id'))),
    ).toEqual(['disintegration', 'anarchotribal', 'caregivers']);
    await plantSentinel(page);
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Artists', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: /^Artists$/i })).toBeVisible();
    await page.evaluate(() => {
      const observation = window as Window & { restoredReleaseActions?: string[] };
      new MutationObserver((mutations) => {
        for (const mutation of mutations)
          for (const added of mutation.addedNodes) {
            if (added instanceof HTMLElement) {
              const catalog =
                added.id === 'releases-merchandising' ? added : added.querySelector('#releases-merchandising');
              if (!catalog) continue;
              observation.restoredReleaseActions = [...catalog.querySelectorAll('[data-release-purchase]')].map(
                (action) => action.textContent?.trim() ?? '',
              );
            }
          }
      }).observe(document.querySelector('main[data-app-shell-main]')!, { childList: true });
    });
    freshRead = true;
    await page.goBack();
    await expect.poll(() => Boolean(respond)).toBe(true);
    await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText(
      'View vinyl details',
    );
    await expect(page.locator('.purchase-action, .preorder-action')).toHaveCount(0);
    expect(
      await page
        .locator('[data-release-id]')
        .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-release-id'))),
    ).toEqual(['disintegration', 'anarchotribal', 'caregivers']);
    const inserted = await page.evaluate(
      () => (window as Window & { restoredReleaseActions?: string[] }).restoredReleaseActions,
    );
    expect(inserted).toBeDefined();
    expect(inserted?.some((action) => /^(Buy|Pre-order) /.test(action))).toBe(false);
    await respond!();
    await expect(page.locator('[data-release-id="disintegration"] [data-release-badges]')).toContainText(
      result === 'failed' ? 'Physical availability unconfirmed' : 'Sold Out',
    );
    await expect(page.locator('.purchase-action, .preorder-action, .preorder-badge')).toHaveCount(0);
    expect(await sentinelIntact(page)).toBe(true);
  });
}
