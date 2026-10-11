import { expect, expectNoHorizontalOverflow, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';

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
    // A native edition's artwork opens the Store edition; the title keeps the release overlay.
    await page.locator('[data-release-id="anarchotribal"] .release-card-title-link').click();
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
  for (const width of [2120, 1440, 1024, 768, 320, 390, 430]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    const artwork = await page.locator('[data-release-role]').evaluateAll((cards) =>
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
    // The two featured records are twins: their covers match at every width.
    expect(Math.abs(artwork[0]!.width - artwork[1]!.width)).toBeLessThan(1);
    await expectNoHorizontalOverflow(page);
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
  ['unreleased', '2099-11-06', 'Out 6 November 2099'],
  ['undated', undefined, ''],
] as const) {
  test(`Vinyl reads Coming Soon from its offer while the digital album is ${label}`, async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date('2026-10-05T12:00:00Z'));
    await page.route('**/releases/', async (route) => {
      const response = await route.fetch();
      const html = await response.text();
      const body = html.replace(/<div\b[^>]*\bdata-release-id="anarchotribal"[^>]*>/, (tag) =>
        tag
          .replace(/\sdata-release-date="[^"]*"/, '')
          .replace('<div', `<div${releaseDate ? ` data-release-date="${releaseDate}"` : ''}`),
      );
      expect(body).not.toBe(html);
      await route.fulfill({ response, body });
    });
    let current = { ...stocked, availabilityState: 'coming_soon', expectedMonth: '2026-11' } as
      typeof stocked | typeof preorder;
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
    await expect(announced.locator('[data-release-badges]')).toHaveText(`${digitalStatus}Vinyl Coming Soon`);
    const physical = announced.locator('[data-release-badges] [data-availability-state="coming_soon"]');
    await expect(physical).toHaveText('Vinyl Coming Soon');
    await expect(physical).toHaveCSS('border-top-style', 'dashed');
    await expect(announced.locator('[data-release-shipping]')).toHaveText('Expected November 2026');
    const details = announced.locator('[data-release-purchase]');
    await expect(details).toHaveText('Vinyl edition');
    await expect(details).toHaveClass('release-detail-link');
    await expect(details).toHaveCSS('text-transform', 'uppercase');
    await expect(details).toHaveAccessibleName('Vinyl edition, Anarchotribal');
    // A Coming Soon offer shows the Store card's price beside the edition link, without pre-order terms.
    await expect(announced.locator('[data-release-price]')).toHaveText('€28.00');
    await expect(announced.locator('[data-release-terms]')).toHaveAttribute('inert', '');
    await expect(page.locator('[data-release-id]')).toHaveCount(3);
    await expect(page.getByRole('heading', { name: 'More releases', exact: true })).toHaveCount(1);
    await expect(page.getByText('Our Releases', { exact: true })).toHaveCount(0);
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
      await expect(announced.locator('[data-release-badges]')).toHaveText('Digital out nowVinyl Coming Soon');
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
    // Without an offer there is no physical badge and no price; the digital badge stays.
    await expect(announced.locator('[data-release-badges]')).toHaveText(digitalStatus);
    await expect(announced.locator('[data-release-purchase]')).toHaveText('Vinyl edition');
    await expect(announced.locator('[data-release-price]')).toBeHidden();
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
  test(`Releases aligns complete artwork and touch actions within mobile gutters at ${width}px${width < 768 ? ' @phone' : ''}`, async ({
    page,
  }) => {
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
    await expect(page.locator('[data-release-role="lead"] [data-release-price]')).toHaveText('€28.00');
    const gutter = width < 640 ? 16 : 24;
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
          // Controls only: the price beside them is inert text.
          actions: [...card.querySelectorAll('[data-release-actions] a, .music-listen-trigger')].map((action) => {
            const rect = action.getBoundingClientRect();
            return { x: rect.x, right: rect.right, height: rect.height };
          }),
        };
      }),
    );
    for (const card of measurements) {
      expect(card.transform).toBe('none');
      for (const action of card.actions) {
        expect(action.x).toBeGreaterThanOrEqual(gutter);
        // Firefox rounds separate DOMRects differently; allow less than a hundredth of a CSS pixel.
        expect(action.right).toBeLessThanOrEqual(contentWidth - gutter + 0.01);
        expect(action.height).toBeGreaterThanOrEqual(44);
      }
      expect(card.artwork.x).toBe(gutter);
      if (width < 640) {
        // Phones stack every release the same way: a full-width cover, then its copy.
        expect(card.artwork.width).toBe(contentWidth - 32);
        expect(card.copy.x).toBe(16);
        expect(card.copy.y).toBeGreaterThanOrEqual(card.artwork.bottom);
      } else if (card.role !== 'catalog') {
        // From 40rem each featured row splits into equal halves with a 1.5rem gap.
        expect(card.copy.x).toBeCloseTo(card.artwork.right + 24, 1);
        expect(card.copy.y).toBeCloseTo(card.artwork.y, 1);
      }
    }
    // Catalog tiles match the featured covers on phones and tablets.
    const [lead, , catalog] = measurements;
    expect(Math.abs(catalog!.artwork.width - lead!.artwork.width)).toBeLessThan(1);
    await expectNoHorizontalOverflow(page);
  });
}

for (const width of [1024, 1440]) {
  test(`Releases stacks the featured records as twin rows at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('releases/');
    await waitForShell(page);
    await page.evaluate(() => document.fonts.ready);
    const [lead, supporting, catalog] = await page.locator('[data-release-role]').evaluateAll((cards) =>
      cards.map((card) => ({
        artwork: card.querySelector('.release-card-image-shell')!.getBoundingClientRect().toJSON(),
        copy: card.querySelector('.release-card-copy')!.getBoundingClientRect().toJSON(),
      })),
    );
    for (const row of [lead!, supporting!]) {
      // A 29rem cover beside top-aligned copy.
      expect(row.artwork.width).toBeCloseTo(464, 0);
      expect(Math.abs(row.copy.top - row.artwork.top)).toBeLessThan(1);
      expect(row.copy.left).toBeCloseTo(row.artwork.right + 40, 0);
    }
    expect(supporting!.artwork.left).toBeCloseTo(lead!.artwork.left, 1);
    expect(supporting!.artwork.top).toBeGreaterThan(lead!.artwork.bottom);
    expect(catalog!.artwork.top).toBeGreaterThan(supporting!.artwork.bottom);
    expect(catalog!.artwork.width).toBeLessThan(lead!.artwork.width);
  });
}

for (const width of [390, 1280]) {
  test(`Releases keeps badge typography and date spacing after entering from Home at ${width}px${width < 768 ? ' @phone' : ''}`, async ({
    page,
  }) => {
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
    // Status sits with the buying facts: after the formats, before the price and action.
    const badges = await lead.locator('[data-release-badges]').boundingBox();
    const formats = await lead.locator('.release-card-formats').boundingBox();
    const actions = await lead.locator('[data-release-actions]').boundingBox();
    expect(badges!.y - formats!.y - formats!.height).toBeGreaterThanOrEqual(4);
    expect(actions!.y - badges!.y - badges!.height).toBeGreaterThanOrEqual(4);
    expect(await sentinelIntact(page)).toBe(true);
    await expectNoHorizontalOverflow(page);
  });
}

for (const width of [320, 390, 1280]) {
  test(`Releases keeps the preorder visual family and current composition at ${width}px${width < 768 ? ' @phone' : ''}`, async ({
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
    const preorderAction = lead.getByRole('link', { name: 'Pre-order vinyl, Disintegration', exact: true });
    await expect(preorderAction).toHaveClass(/preorder-action/);
    await expect(preorderAction).toHaveText('Pre-order vinyl');
    await expect(lead.locator('.preorder-badge')).toHaveText('Pre-order · ships around October 2026');
    await expect(lead.locator('[data-release-badges]')).toContainText('Digital out now');
    // The price and the pre-order terms come from the same offer read, beside the action.
    await expect(lead.locator('[data-release-price]')).toHaveText('€28.00');
    await expect(lead.locator('[data-release-price]')).toHaveCSS('font-family', /Bebas Neue/);
    await expect(lead.getByRole('link', { name: 'Pre-order & delivery information', exact: true })).toBeVisible();
    const status = lead.locator('[data-release-badges] .store-item-card__release-status');
    await expect(status).toHaveCSS('font-family', /Geist Mono/);
    await expect(status).toHaveCSS('font-weight', '700');
    await expect(status).toHaveCSS('text-transform', 'uppercase');
    await expect(status).toHaveCSS('border-width', '0px');
    const [badges, formats] = await Promise.all([
      lead.locator('[data-release-badges]').boundingBox(),
      lead.locator('.release-card-formats').boundingBox(),
    ]);
    expect(badges!.y - formats!.y - formats!.height).toBeGreaterThanOrEqual(4);
    // Catalog Buy wears the Store card chrome and record mark, so the featured Pre-order stays the filled primary.
    const catalogBuy = page
      .locator('[data-release-role="catalog"]')
      .getByRole('link', { name: 'Buy vinyl, Caregivers', exact: true });
    await expect(catalogBuy).toHaveClass(/purchase-action/);
    await expect(catalogBuy).toHaveCSS('border-top-color', 'rgba(245, 245, 245, 0.48)');
    await expect(catalogBuy.locator('.store-buy-icon')).toBeVisible();
    await expect(page.locator('[data-release-role="catalog"] [data-release-price]')).toHaveText('€28.00');
    await expect(page.getByText('Featured records', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Our Releases', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'More releases', exact: true })).toHaveCount(1);
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
    const button = preorderAction;
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
    await expectNoHorizontalOverflow(page);
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
      await expectNoHorizontalOverflow(page, JSON.stringify(overflow));
      await page.screenshot({
        path: '.codex-artifacts/e2e/release-merchandising-390-200percent.png',
        fullPage: true,
      });
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
  await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText('Vinyl edition');
  await expect(page.locator('.purchase-action, .preorder-action')).toHaveCount(0);
  await expect(page.locator('[data-release-price]:visible')).toHaveCount(0);
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
        '.release-card-formats',
        '[data-release-badges]',
        '[data-release-price]',
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
  // Names start with the visible label and add the release, so repeated actions stay distinct.
  const purchase = lead.getByRole('link', { name: 'Pre-order vinyl, Disintegration', exact: true });
  const listen = lead.getByRole('button', { name: /^Listen ?, Disintegration by Afterwise$/ });
  const image = artwork.locator('img');
  await page.mouse.move(0, 0);
  await image.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  const restingArtwork = await image.evaluate((element) => getComputedStyle(element).transform);
  await listen.hover();
  await image.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  await expect(image).toHaveCSS('transform', restingArtwork);
  // The artwork and the edition action share one destination and one engaged state; Listen stays independent.
  // No decorative record is rendered at any width.
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('.release-vinyl-peek')).toHaveCount(0);
  await expect(artwork).toHaveAttribute('href', (await purchase.getAttribute('href'))!);
  const restingAction = await purchase.evaluate((element) => getComputedStyle(element).backgroundColor);
  for (const target of [purchase, artwork]) {
    await target.hover();
    await expect(purchase).not.toHaveCSS('background-color', restingAction);
    await expect(image).toHaveCSS('transform', restingArtwork);
    await page.mouse.move(0, 0);
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(page.locator('.release-vinyl-peek')).toHaveCount(0);
  await expect(artwork).toHaveAccessibleName(/disintegration/i);
  await expect(artwork).toHaveAttribute('tabindex', '-1');
  await expect(title).toHaveAccessibleName(/disintegration/i);
  await expect(lead.locator('[data-release-actions]').getByRole('link')).toHaveCount(1);
  await title.focus();
  // Listen sits with the identity, before the description and the buying facts.
  for (const control of [title, artist, listen, purchase]) {
    await expect(control).toBeFocused();
    expect(await control.evaluate((element) => parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThan(0);
    await page.keyboard.press('Tab');
  }

  await title.click();
  await expect(page).toHaveURL(/\/releases\/disintegration\/$/);
  await expect(page.getByRole('dialog').locator('[data-app-shell-overlay-kind="releases"]')).toBeVisible();
  expect(await sentinelIntact(page)).toBe(true);
  await page.goBack();
  await expect(lead).toBeVisible();
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
  await expect(lead.getByRole('button', { name: /^In player ?, Disintegration by Afterwise$/ })).toBeDisabled();
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
      'Vinyl edition',
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
    const badges = page.locator('[data-release-id="disintegration"] [data-release-badges]');
    if (result === 'failed') await expect(badges).not.toContainText('Vinyl');
    else await expect(badges.locator('[data-availability-state="sold_out"]')).toHaveText('Vinyl Sold Out');
    await expect(page.locator('.purchase-action, .preorder-action, .preorder-badge')).toHaveCount(0);
    await expect(page.locator('[data-release-terms]:not([inert])')).toHaveCount(0);
    if (result === 'failed') await expect(page.locator('[data-release-price]:visible')).toHaveCount(0);
    expect(await sentinelIntact(page)).toBe(true);
  });
}
