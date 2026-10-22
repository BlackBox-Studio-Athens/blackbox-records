import { expect, expectNoHorizontalOverflow, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';
import type { Locator } from '@playwright/test';

async function expectIntrinsicReleaseControls(controls: Locator) {
  const geometry = await controls.evaluateAll((nodes) =>
    nodes.map((node) => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      const label =
        node.querySelector('[data-release-purchase-label], [data-music-listen-label]') ??
        node.querySelector(':scope > span:last-child');
      const range = document.createRange();
      range.selectNodeContents(label ?? node);
      const icon = node.querySelector('svg, .store-buy-icon');
      const iconWidth = icon?.getBoundingClientRect().width ?? 0;
      const content = range.getBoundingClientRect().width + (iconWidth ? iconWidth + parseFloat(style.columnGap) : 0);
      const expected = Math.max(
        parseFloat(style.minWidth),
        content +
          parseFloat(style.paddingLeft) +
          parseFloat(style.paddingRight) +
          parseFloat(style.borderLeftWidth) +
          parseFloat(style.borderRightWidth),
      );
      return {
        width: box.width,
        height: box.height,
        expected,
        minWidth: style.minWidth,
        padding: style.paddingLeft,
        gap: style.columnGap,
        font: style.fontSize,
        family: style.fontFamily,
        grow: style.flexGrow,
        iconWidth,
      };
    }),
  );
  for (const control of geometry) {
    expect(control.height).toBeGreaterThanOrEqual(43.99);
    expect(control.width).toBeGreaterThanOrEqual(112);
    expect(Math.abs(control.width - control.expected)).toBeLessThan(1);
    expect(control).toMatchObject({ minWidth: '112px', padding: '16px', gap: '8px', font: '16px', grow: '0' });
    expect(control.family).toContain('Bebas Neue');
    if (control.iconWidth) expect(control.iconWidth).toBe(18);
  }
}

// The e2e build renders Releases from e2e/preorder-projection.json: Disintegration vinyl is an open pre-order.

const stocked = { presentationState: 'ready', availabilityState: 'stocked', displayPrice: '€28.00', preorder: null };
const preorder = { ...stocked, preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } } };

test('releases show their catalog number in the date line on the page and on every card', async ({ page }) => {
  await page.goto('releases/');
  await waitForShell(page);
  const numbers = page.locator('[data-release-catalog-number]');
  await expect(numbers).toHaveText([/BBR#002$/, /BBR#003$/, /BBR#001$/]);
  // The number is announced with its name; the separator stays visual.
  await expect(numbers.first()).toContainText('Catalog number BBR#002');
  await page.goto('releases/disintegration/');
  await waitForShell(page);
  await expect(page.locator('p', { hasText: /^Digital release/ }).locator('[data-release-catalog-number]')).toHaveText(
    /Catalog number BBR#002$/,
  );
  await expectNoHorizontalOverflow(page);
});

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

test('Releases keeps SSR roles, the projected pre-order and square artwork while offers resolve on direct and shell entry', async ({
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
  // The projected pre-order is in the HTML response; the other editions stay neutral until the offer read.
  const lead = html.slice(
    html.indexOf('data-release-id="disintegration"'),
    html.indexOf('data-release-id="anarchotribal"'),
  );
  expect(lead).toContain('data-release-projected=');
  expect(lead).toContain('Pre-order vinyl');
  expect(lead).toContain('€28.00');
  expect(html.match(/data-release-projected=/g)).toHaveLength(1);
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
  await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText(
    'Pre-order vinyl',
  );
  await expect(page.locator('.purchase-action')).toHaveCount(0);
  await respond!();
  await expect(page.locator('[data-release-id="caregivers"] .purchase-action')).toHaveCount(1);
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
    if ([320, 390, 768, 1440].includes(width))
      await page
        .locator('#releases-merchandising')
        .screenshot({ path: `.codex-artifacts/quiet-actions/releases-${testInfo.project.name}-${width}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await plantSentinel(page);
  await page.getByRole('link', { name: 'BlackBox Records', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'BlackBox Records', exact: true })).toBeVisible();
  respond = undefined;
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Releases', exact: true }).click();
  await expect.poll(() => Boolean(respond)).toBe(true);
  expect(await roles()).toEqual(serverRoles);
  await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText(
    'Pre-order vinyl',
  );
  await expect(page.locator('.purchase-action')).toHaveCount(0);
  await respond!();
  await expect(page.locator('[data-release-id="caregivers"] .purchase-action')).toHaveCount(1);
  await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText(
    'Pre-order vinyl',
  );
  expect(await roles()).toEqual(serverRoles);
  expect(await sentinelIntact(page)).toBe(true);
});

for (const [label, date] of [
  ['released', '2026-06-06'],
  ['unreleased', '2099-11-06'],
  ['undated', undefined],
] as const) {
  test(`quiet physical offers leave ${label} digital metadata unchanged`, async ({ page }) => {
    await page.route('**/releases/', async (route) => {
      const response = await route.fetch();
      const html = await response.text();
      const start = html.indexOf('data-release-id="anarchotribal"');
      const end = html.indexOf('data-release-id="caregivers"');
      const card = html.slice(start, end);
      const metadata = `<p class="release-card-year-text">${date ? `Digital release · <time datetime="${date}">${date}</time> · ` : ''}<span data-release-catalog-number>Catalog number BBR#003</span></p>`;
      const updated = card.replace(/<p class="release-card-year-text">[\s\S]*?<\/p>/, metadata);
      expect(updated).not.toBe(card);
      await route.fulfill({ response, body: html.slice(0, start) + updated + html.slice(end) });
    });
    let current = { ...stocked, availabilityState: 'coming_soon', expectedMonth: '2099-11' } as
      typeof stocked | typeof preorder;
    let missing = false;
    await page.route('**/api/store/listing-prices*', (route) =>
      route.fulfill({
        json: missing
          ? []
          : [
              { ...preorder, storeItemSlug: 'disintegration-black-vinyl-lp' },
              { ...stocked, storeItemSlug: 'caregivers-vinyl' },
              { ...current, storeItemSlug: 'anarchotribal-vinyl' },
            ],
      }),
    );
    await page.goto('releases/');
    await waitForShell(page);
    const card = page.locator('[data-release-id="anarchotribal"]');
    const metadata = card.locator('.release-card-year-text');
    const original = await metadata.innerHTML();
    await expect(metadata).toContainText('BBR#003');
    if (date) await expect(metadata.locator('time')).toHaveAttribute('datetime', date);
    else {
      await expect(metadata.locator('time')).toHaveCount(0);
      await expect(metadata).not.toContainText('Digital release');
    }
    const status = card.locator('[data-release-status]');
    await expect(status).toHaveText('Coming soon');
    await expect(status).toHaveCSS('border-top-style', 'dashed');
    expect(
      await status.evaluate((element) => ({
        tag: element.tagName,
        tab: (element as HTMLElement).tabIndex,
        cursor: getComputedStyle(element).cursor,
      })),
    ).toEqual({ tag: 'SPAN', tab: -1, cursor: 'auto' });
    await expect(card.locator('[data-release-shipping]')).toHaveText('Expected November 2099');
    await expect(card.locator('.release-format-link')).toHaveAttribute('href', /\/store\/anarchotribal-vinyl\/$/);
    for (const [offer, expectedStatus, action] of [
      [preorder, '', 'Pre-order vinyl'],
      [stocked, '', 'Buy vinyl'],
      [{ ...stocked, availabilityState: 'repressing' }, 'Repressing', ''],
      [{ ...stocked, availabilityState: 'sold_out' }, 'Sold out', ''],
      [{ ...stocked, availabilityState: 'unavailable' }, '', ''],
    ] as const) {
      current = offer;
      await page.reload();
      if (action) await expect(card.locator('[data-release-purchase]')).toHaveText(action);
      else await expect(card.locator('[data-release-purchase]')).toBeHidden();
      if (expectedStatus) await expect(status).toHaveText(expectedStatus);
      else await expect(status).toBeHidden();
      if (expectedStatus === 'Sold out') await expect(status).toHaveCSS('border-top-color', 'rgb(188, 73, 69)');
      await expect(card.locator('[data-release-price]')).toHaveText('€28.00');
      if (offer.preorder) await expect(card.locator('[data-release-terms]')).toBeVisible();
      else await expect(card.locator('[data-release-terms]')).toBeHidden();
      expect(await metadata.innerHTML()).toBe(original);
      await expect(card.locator('[data-release-badges], [data-release-stock], [data-release-details]')).toHaveCount(0);
      await expect(card).not.toContainText(/In stock|Digital out now|View details|Unknown offer/);
    }
    missing = true;
    await page.reload();
    await expect(card.locator('[data-release-purchase-slot]')).toBeHidden();
    await expect(card.locator('[data-release-price]')).toBeHidden();
    expect(await metadata.innerHTML()).toBe(original);
    await expectNoHorizontalOverflow(page);
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
          artistBottom: card.querySelector('.release-card-artist-text')!.getBoundingClientRect().bottom,
          transform: getComputedStyle(image).transform,
          // Controls only: the price beside them is inert text.
          actions: [...card.querySelectorAll('[data-release-actions] a:not([hidden]), .music-listen-trigger')].map(
            (action) => {
              const rect = action.getBoundingClientRect();
              return { x: rect.x, right: rect.right, height: rect.height };
            },
          ),
          pair: [...card.querySelectorAll('[data-release-actions] > :not([hidden])')].map((action) => {
            const rect = action.getBoundingClientRect();
            return { x: rect.x, y: rect.y, right: rect.right, width: rect.width };
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
        // Phones stack every release the same way: a full-width cover, then the purchase/Listen pair 12px below it,
        // half the row each with a 16px gap, then the rest of the copy.
        expect(card.artwork.width).toBe(contentWidth - 32);
        expect(card.copy.x).toBe(16);
        expect(card.copy.y).toBeGreaterThanOrEqual(card.artwork.bottom - 0.01);
        expect(card.pair[0]!.y - card.artistBottom).toBeCloseTo(12, 0);
        // The static physical slot shares the same geometry as the buying action.
        if (card.pair.length === 2) {
          expect(card.pair[1]!.x - card.pair[0]!.right).toBeCloseTo(16, 0);
        }
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
  test(`Releases keeps quiet typography and date spacing after entering from Home at ${width}px${width < 768 ? ' @phone' : ''}`, async ({
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
    await page
      .getByRole('navigation', { name: width < 640 ? 'Mobile' : 'Primary' })
      .getByRole('link', { name: 'Releases', exact: true })
      .click();
    const lead = page.locator('[data-release-role="lead"]');
    await expect(lead).toHaveAttribute('data-release-id', 'disintegration');
    await expect(lead.locator('[data-release-purchase]')).toHaveText('Pre-order vinyl');
    await expect(lead.locator('[data-release-badges], [data-release-stock], [data-release-details]')).toHaveCount(0);
    const metadata = lead.locator('.release-card-year-text');
    await expect(metadata).toContainText('Digital release');
    await expect(metadata).toHaveCSS('font-size', '12px');
    const artist = await lead.locator('.release-card-artist-text').boundingBox();
    const action = await lead.locator('[data-release-actions]').boundingBox();
    const formats = await lead.locator('.release-card-format-row').boundingBox();
    const terms = await lead.locator('[data-release-terms]').boundingBox();
    const date = await metadata.boundingBox();
    expect(action!.y - artist!.y - artist!.height).toBeCloseTo(12, 0);
    expect(formats!.y - action!.y - action!.height).toBeCloseTo(4, 0);
    expect(date!.y - terms!.y - terms!.height).toBeCloseTo(12, 0);
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
    await expect(lead.locator('.preorder-badge')).toHaveCount(0);
    await expect(lead.locator('[data-release-shipping]')).toHaveText('Expected to ship around October 2026');
    await expect(lead.locator('.release-card-year-text')).toContainText('Digital release');
    // The price and the pre-order terms come from the same offer read, beside the action.
    await expect(lead.locator('[data-release-price]')).toHaveText('€28.00');
    await expect(lead.locator('[data-release-price]')).toHaveCSS('font-family', /Bebas Neue/);
    await expect(lead.getByRole('link', { name: 'Pre-order & delivery information', exact: true })).toBeVisible();
    await expect(lead.locator('[data-release-badges], [data-release-stock], [data-release-details]')).toHaveCount(0);
    await expect(lead.locator('[data-release-shipping]')).toHaveCSS('color', 'rgb(171, 181, 184)');
    // Catalog Buy fills Flint with the record mark; the featured Pre-order fills Sea Green.
    const catalogBuy = page
      .locator('[data-release-role="catalog"]')
      .getByRole('link', { name: 'Buy vinyl, Caregivers', exact: true });
    await expect(catalogBuy).toHaveClass(/purchase-action/);
    await expect(catalogBuy).toHaveCSS('background-color', 'rgb(98, 110, 114)');
    await expect(catalogBuy).toHaveCSS('color', 'rgb(245, 245, 245)');
    await expect(catalogBuy.locator('.release-vinyl-icon')).toBeVisible();
    await expect(catalogBuy.locator('.store-buy-icon')).toHaveCount(0);
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
      face: getComputedStyle(element).backgroundColor,
      label: getComputedStyle(element).color,
      accent: getComputedStyle(element).getPropertyValue('--preorder-accent').trim(),
    }));
    expect(visual).toMatchObject({ face: 'rgb(45, 118, 106)', label: 'rgb(245, 245, 245)' });
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
    expect(
      await lead.locator('.releases-cover__image').evaluate((element) => getComputedStyle(element).transform),
    ).toBe('none');
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

test('a source-less release keeps the purchase slot without a Listen placeholder @phone', async ({ page }) => {
  await page.route('**/releases/', async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    const body = html.replace(
      /<button\b(?=[^>]*\bdata-music-streaming-service-embedded-player-trigger)[^>]*>[\s\S]*?<\/button>/g,
      '',
    );
    expect(body).not.toBe(html);
    await route.fulfill({ response, body });
  });
  await page.route('**/api/store/listing-prices*', (route) =>
    route.fulfill({ json: [{ ...preorder, storeItemSlug: 'disintegration-black-vinyl-lp' }] }),
  );
  await page.goto('releases/');
  await waitForShell(page);
  const actions = page.locator('[data-release-role="lead"] [data-release-actions]');
  await expect(actions.getByRole('button')).toHaveCount(0);
  await expect(actions.locator(':scope > *')).toHaveCount(2);
  await expect(actions.locator('[data-release-price]')).toHaveCount(1);
  await expect(actions.getByRole('link', { name: 'Pre-order vinyl, Disintegration', exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

for (const width of [390, 1440]) {
  test(`release purchase controls stay together with outline vinyl icons at ${width}px${width === 390 ? ' @phone' : ''}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    let current = { ...stocked, preorder: { shipEstimate: { kind: 'month', month: '2099-11', part: null } } } as
      typeof stocked | typeof preorder;
    await page.route('**/api/store/listing-prices*', (route) =>
      route.fulfill({
        headers: { 'access-control-allow-origin': '*' },
        json: [
          { ...current, storeItemSlug: 'disintegration-black-vinyl-lp' },
          { ...stocked, storeItemSlug: 'caregivers-vinyl' },
        ],
      }),
    );
    const html = await (await page.request.get('releases/disintegration/')).text();
    const rowStart = html.indexOf('class="release-edition-actions"');
    const factsStart = html.indexOf('class="release-edition-facts"', rowStart);
    expect(rowStart).toBeGreaterThan(-1);
    expect(factsStart).toBeGreaterThan(rowStart);
    expect(html.slice(rowStart, factsStart)).toContain('music-listen-trigger');
    expect(html.slice(rowStart, factsStart)).not.toMatch(/In stock|Digital out now|Expected to ship/);
    const checkBlock = async (block: ReturnType<typeof page.locator>) => {
      const row = block.locator('.release-edition-actions');
      const action = row.getByRole('link');
      const listen = row.getByRole('button', { name: /^Listen/i });
      await expect(listen).toHaveCount(1);
      await expect(action).toHaveText(current.preorder ? 'Pre-order vinyl' : 'Buy vinyl');
      await expect(action.locator('.release-vinyl-icon')).toHaveCount(1);
      await expect(action.locator('.store-buy-icon')).toHaveCount(0);
      await expect(action.locator('.release-vinyl-icon')).toHaveCSS('animation-name', 'none');
      const [actionBox, listenBox, factsBox] = await Promise.all([
        action.boundingBox(),
        listen.boundingBox(),
        block.locator('.release-edition-facts').boundingBox(),
      ]);
      expect(Math.abs(actionBox!.y - listenBox!.y)).toBeLessThan(1);
      expect(actionBox!.height).toBeGreaterThanOrEqual(44);
      expect(listenBox!.height).toBeGreaterThanOrEqual(44);
      expect(factsBox!.y).toBeGreaterThanOrEqual(
        Math.max(actionBox!.y + actionBox!.height, listenBox!.y + listenBox!.height),
      );
      await expect(row).not.toContainText(/In stock|Digital out now|Expected to ship|View details/);
    };
    for (const preorderOpen of [true, false]) {
      if (!preorderOpen) current = stocked;
      await page.goto('releases/disintegration/');
      await waitForShell(page);
      await checkBlock(page.locator('.release-detail-purchase'));
      await page.goto('releases/');
      await waitForShell(page);
      const card = page.locator('[data-release-id="disintegration"]');
      const purchase = card.locator('[data-release-purchase]');
      await expect(purchase).toHaveText(preorderOpen ? 'Pre-order vinyl' : 'Buy vinyl');
      await expect(purchase.locator('.release-vinyl-icon')).toHaveCount(1);
      await expect(card.locator('[data-release-actions]')).not.toContainText(
        /In stock|Digital out now|Expected to ship/,
      );
      await card.locator('.release-card-title-link').click();
      await checkBlock(page.getByRole('dialog').locator('.release-detail-purchase'));
      await expectNoHorizontalOverflow(page);
    }
  });
}

test('release detail and overlay use compact physical controls with independent digital timing @phone', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00Z'));
  let current = preorder as typeof stocked | typeof preorder;
  await page.route('**/api/store/listing-prices*', (route) =>
    route.fulfill({ json: [{ ...current, storeItemSlug: 'disintegration-black-vinyl-lp' }] }),
  );
  await page.goto('releases/disintegration/');
  await waitForShell(page);
  const block = page.locator('.release-detail-purchase');
  await expect(block.getByRole('link', { name: 'Pre-order vinyl', exact: true })).toHaveAttribute(
    'href',
    /\/store\/disintegration-black-vinyl-lp\/$/,
  );
  await expect(block).toContainText('Expected to ship around October 2026');
  await expect(block).not.toContainText(/Digital out now|Digital release|View details|In stock/);
  await expect(page.locator('p', { hasText: /^Digital release/ })).toHaveCount(1);
  await expect(block.locator('.preorder-badge')).toHaveCount(0);
  await expect(block.getByRole('link', { name: 'Pre-order & delivery information', exact: true })).toBeVisible();
  for (const [state, label, border] of [
    ['coming_soon', 'Coming soon', 'dashed'],
    ['repressing', 'Repressing', 'dashed'],
    ['sold_out', 'Sold out', 'solid'],
    ['unavailable', '', ''],
  ] as const) {
    current = { ...stocked, availabilityState: state };
    await page.reload();
    await expect(block.locator('.release-format-link').first()).toHaveAttribute(
      'href',
      /\/store\/disintegration-black-vinyl-lp\/$/,
    );
    await expect(block.locator('.purchase-action, .preorder-action')).toHaveCount(0);
    if (label) {
      await expect(block.locator('.release-physical-status')).toHaveText(label);
      await expect(block.locator('.release-physical-status')).toHaveCSS('border-top-style', border);
    } else await expect(block.locator('.release-physical-status')).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  }
  current = stocked;
  await page.goto('releases/');
  await waitForShell(page);
  await expect(page.locator('[data-release-id="disintegration"] .purchase-action')).toBeVisible();
  await plantSentinel(page);
  await page.locator('[data-release-id="disintegration"] .release-card-title-link').click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.locator('.release-detail-purchase').getByRole('link', { name: 'Buy vinyl', exact: true }),
  ).toBeVisible();
  await expect(dialog.locator('.release-detail-purchase')).not.toContainText(/In stock|Digital out now|View details/);
  expect(await sentinelIntact(page)).toBe(true);
});

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
  await expect(page.locator('[data-release-id="disintegration"] [data-release-status]')).toHaveText('Sold out');
  unknown = true;
  await page.reload();
  await expect(page.locator('[data-release-role="lead"]')).toHaveAttribute('data-release-id', 'disintegration');
  await expect(page.locator('[data-release-id]')).toHaveCount(3);
  await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase-slot]')).toBeHidden();
  await expect(page.locator('.purchase-action, .preorder-action')).toHaveCount(0);
  await expect(page.locator('[data-release-price]:visible')).toHaveCount(0);
});

test('a long featured summary opens from three lines on phones and stays whole on desktop @phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.route('**/api/store/listing-prices*', (route) =>
    route.fulfill({ json: [{ ...preorder, storeItemSlug: 'disintegration-black-vinyl-lp' }] }),
  );
  await page.goto('releases/');
  await waitForShell(page);
  const lead = page.locator('[data-release-role="lead"]');
  const summary = lead.locator('[data-release-summary]');
  const more = lead.locator('[data-release-more] summary');
  const lineHeight = await summary.evaluate((element) => parseFloat(getComputedStyle(element).lineHeight));
  const clamped = (await summary.boundingBox())!.height;
  expect(clamped).toBeLessThanOrEqual(lineHeight * 3 + 1);
  // Read more and the terms link share one 44px row.
  await expect.poll(() => more.innerText()).toBe('Read more');
  const [moreBox, termsBox] = await Promise.all([
    more.boundingBox(),
    lead.getByRole('link', { name: 'Pre-order & delivery information', exact: true }).boundingBox(),
  ]);
  expect(moreBox!.height).toBeGreaterThanOrEqual(44);
  expect(moreBox!.y).toBeGreaterThan(termsBox!.y + termsBox!.height);
  await more.focus();
  await page.keyboard.press('Enter');
  await expect(lead.locator('[data-release-more]')).toHaveAttribute('open', '');
  await expect.poll(() => more.innerText()).toBe('Show less');
  await expect(more).toBeFocused();
  expect((await summary.boundingBox())!.height).toBeGreaterThan(clamped + lineHeight);
  await page.keyboard.press('Enter');
  await expect.poll(() => more.innerText()).toBe('Read more');
  // The catalog adds no summary; desktop shows the featured summary whole without the disclosure.
  await expect(page.locator('[data-release-role="catalog"] [data-release-summary]')).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(lead.locator('[data-release-more]')).toBeHidden();
  expect((await summary.boundingBox())!.height).toBeGreaterThan(lineHeight * 3 + 1);
  await expectNoHorizontalOverflow(page);
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
      for (const selector of ['[data-release-summary]', '.release-card-year-text', '[data-release-price]']) {
        const copy = card.locator(selector);
        if (await copy.isVisible()) {
          await copy.click();
          await expect(page).toHaveURL(/\/releases\/$/);
          await expect(page.getByRole('dialog')).toHaveCount(0);
        }
      }
    }
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
  // The pair sits beside the price after the artist now, so park the pointer before reading the resting face.
  await page.mouse.move(0, 0);
  await expect(purchase).toHaveCSS('background-color', 'rgb(45, 118, 106)');
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
  const format = lead.locator('.release-format-link');
  // Keyboard and visual sequence agree at every width.
  for (const control of [title, artist, purchase, listen, format]) {
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
  test(`cached Releases returns its rendered pre-order before a ${result} fresh offer read`, async ({ page }) => {
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
    // The snapshot restores what the HTML rendered: the projected pre-order, without the browser's Buy enrichment.
    await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText(
      'Pre-order vinyl',
    );
    await expect(page.locator('.purchase-action')).toHaveCount(0);
    expect(
      await page
        .locator('[data-release-id]')
        .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-release-id'))),
    ).toEqual(['disintegration', 'anarchotribal', 'caregivers']);
    const inserted = await page.evaluate(
      () => (window as Window & { restoredReleaseActions?: string[] }).restoredReleaseActions,
    );
    expect(inserted).toBeDefined();
    expect(inserted?.some((action) => /^Buy /.test(action))).toBe(false);
    expect(inserted).toContain('Pre-order vinyl');
    await respond!();
    const physical = page.locator('[data-release-id="disintegration"] [data-release-status]');
    if (result === 'failed') {
      // A failed read keeps the rendered pre-order; buying still reaches the authoritative Store Item offer.
      await expect(page.locator('[data-release-id="disintegration"] .preorder-action')).toHaveText('Pre-order vinyl');
      await expect(page.locator('.purchase-action')).toHaveCount(0);
      await expect(page.locator('[data-release-id="disintegration"] [data-release-price]')).toHaveText('€28.00');
    } else {
      await expect(physical).toHaveAttribute('data-availability-state', 'sold_out');
      await expect(physical).toHaveText('Sold out');
      await expect(page.locator('.purchase-action, .preorder-action, .preorder-badge')).toHaveCount(0);
      await expect(page.locator('[data-release-terms]:visible')).toHaveCount(0);
    }
    expect(await sentinelIntact(page)).toBe(true);
  });
}

test('quiet cards retain native format access by keyboard and modified click', async ({ page, context }) => {
  await page.route('**/api/store/listing-prices*', (route) =>
    route.fulfill({
      json: [{ ...stocked, availabilityState: 'sold_out', storeItemSlug: 'disintegration-black-vinyl-lp' }],
    }),
  );
  await page.goto('releases/');
  await waitForShell(page);
  const card = page.locator('[data-release-id="disintegration"]');
  await expect(card.locator('[data-release-status]')).toHaveText('Sold out');
  const format = card.locator('.release-format-link');
  await expect(format).toHaveCount(1);
  await expect(format).toHaveAttribute('href', /\/store\/disintegration-black-vinyl-lp\/$/);
  expect((await format.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const [opened] = await Promise.all([context.waitForEvent('page'), format.click({ modifiers: ['Control'] })]);
  await opened.waitForLoadState('domcontentloaded');
  await expect(opened).toHaveURL(/\/store\/disintegration-black-vinyl-lp\/$/);
  await opened.close();
  await expect(page).toHaveURL(/\/releases\/$/);
  await format.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/store\/disintegration-black-vinyl-lp\/$/);
});

test('quiet cards wrap enlarged text and prescribed text spacing at320px @phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 1000 });
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
  await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText(
    'Pre-order vinyl',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content:
      'html {font-size:200%} #releases-merchandising * {line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} #releases-merchandising p {margin-bottom:2em!important}',
  });
  await expectNoHorizontalOverflow(page);
  for (const action of await page
    .locator('[data-release-actions] a:visible, [data-release-actions] button:visible, .release-format-link:visible')
    .all()) {
    const target = (await action.boundingBox())!;
    expect(target.height).toBeGreaterThanOrEqual(44);
    expect(target.width).toBeGreaterThanOrEqual(44);
  }
  await page
    .locator('#releases-merchandising')
    .screenshot({ path: '.codex-artifacts/quiet-actions/text-spacing-320.png' });
});

test('release actions use intrinsic controls with one adjacent price before formats at every width', async ({
  page,
}) => {
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
  await expect(page.locator('[data-release-id="disintegration"] [data-release-purchase]')).toHaveText(
    'Pre-order vinyl',
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const role of ['lead', 'supporting', 'catalog']) {
      const card = page.locator(`[data-release-role="${role}"]`);
      const row = card.locator('[data-release-actions]');
      await expectIntrinsicReleaseControls(row.locator('a:visible, button:visible, .release-physical-status:visible'));
      await expect(card.locator('[data-release-price]')).toHaveCount(1);
      if (role !== 'supporting') {
        await expect(row.locator('[data-release-price]')).toBeVisible();
        expect(
          await row.evaluate((element) => {
            const children = [...element.children];
            return (
              children.indexOf(element.querySelector('.music-listen-trigger')!) <
              children.indexOf(element.querySelector('[data-release-price]')!)
            );
          }),
        ).toBe(true);
        if (width === 1440) {
          const [listen, price] = await Promise.all([
            row.locator('.music-listen-trigger').boundingBox(),
            row.locator('[data-release-price]').boundingBox(),
          ]);
          expect(price!.x - listen!.x - listen!.width).toBeCloseTo(16, 0);
          expect(price!.y + price!.height / 2).toBeCloseTo(listen!.y + listen!.height / 2, 0);
          expect(listen!.width).toBeLessThan((await card.locator('.release-card-copy').boundingBox())!.width / 2);
        }
      }
      expect(
        await card.evaluate((element) => {
          const price = element.querySelector('[data-release-price]')!;
          const formats = element.querySelector('.release-card-format-row')!;
          return Boolean(price.compareDocumentPosition(formats) & Node.DOCUMENT_POSITION_FOLLOWING);
        }),
      ).toBe(true);
    }
    await expectNoHorizontalOverflow(page);
  }
});

for (const physicalFormat of ['vinyl', 'cd', 'cassette']) {
  test(`intrinsic ${physicalFormat} control label geometry covers all states, missing Listen and enlarged text @phone`, async ({
    page,
  }) => {
    let offer: Record<string, unknown> | undefined = stocked;
    let noListen = false;
    await page.route('**/api/store/listing-prices*', (route) =>
      route.fulfill({ json: offer ? [{ ...offer, storeItemSlug: 'disintegration-black-vinyl-lp' }] : [] }),
    );
    for (const state of [
      'stocked',
      'preorder',
      'withheld',
      'coming_soon',
      'repressing',
      'sold_out',
      'unavailable',
      'missing',
      'no-listen',
    ]) {
      noListen = state === 'no-listen';
      offer =
        state === 'missing'
          ? undefined
          : state === 'preorder'
            ? preorder
            : state === 'withheld'
              ? { ...stocked, preorder: { shipEstimate: null } }
              : { ...stocked, availabilityState: ['stocked', 'no-listen'].includes(state) ? 'stocked' : state };
      await page.goto('releases/disintegration/');
      await waitForShell(page);
      const block = page.locator('.release-detail-purchase');
      const actions = block.locator('.release-edition-actions');
      const controls = actions.locator('a:visible, button:visible, .release-physical-status:visible');
      if (['stocked', 'preorder', 'withheld', 'no-listen'].includes(state)) {
        const prefix = state === 'preorder' || state === 'withheld' ? 'Pre-order' : 'Buy';
        await expect(actions.getByRole('link')).toHaveText(`${prefix} vinyl`);
        // Geometry-only label fixture; component tests verify actual CD/cassette rendering and icons.
        const label = physicalFormat === 'cd' ? 'CD' : physicalFormat;
        await actions
          .getByRole('link')
          .locator('span')
          .last()
          .evaluate((node, text) => {
            node.textContent = text;
          }, `${prefix} ${label}`);
      } else if (state === 'unavailable' || state === 'missing') await expect(actions.getByRole('link')).toHaveCount(0);
      else await expect(actions.locator('.release-physical-status')).toBeVisible();
      // Remove only after hydration: a layout fixture must not corrupt Astro's SSR child slots.
      if (noListen) await actions.getByRole('button').evaluate((node) => node.remove());
      await expect(actions.getByRole('button')).toHaveCount(noListen ? 0 : 1);
      await expect(block.locator('[data-release-price], .release-card-price')).toHaveCount(0);
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await expectIntrinsicReleaseControls(controls);
        await expectNoHorizontalOverflow(page);
      }
      await page.setViewportSize({ width: 320, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addStyleTag({
        content:
          'html{font-size:200%}.release-detail-purchase *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}.release-detail-purchase p{margin-bottom:2em!important}',
      });
      const overflow = await page.evaluate(() =>
        [...document.querySelectorAll('body *')]
          .filter((node) => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
          .slice(0, 12)
          .map((node) => ({
            tag: node.tagName,
            class: node.className,
            right: node.getBoundingClientRect().right,
            minWidth: getComputedStyle(node).minWidth,
            width: getComputedStyle(node).width,
          })),
      );
      await expectNoHorizontalOverflow(page, `${state}: ${JSON.stringify(overflow)}`);
    }
  });
}

for (const width of [1440, 390]) {
  test(`release format links retain 44px width and height on cards, direct detail and overlay at ${width}px${width === 390 ? ' @phone' : ''}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/api/store/listing-prices*', (route) => route.fulfill({ json: [] }));
    const check = async (links: Locator) => {
      for (const link of await links.all()) {
        await expect.poll(async () => (await link.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(43.99);
        await expect.poll(async () => (await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(43.99);
      }
    };
    const checkShortCd = async (link: Locator) => {
      // Target-size fixture only; keep the verified destination and never navigate a fabricated CD route.
      await link.evaluate((node) => {
        node.textContent = 'CD';
      });
      await check(link);
    };
    await page.goto('releases/');
    await waitForShell(page);
    await check(page.locator('#releases-merchandising .release-format-link'));
    const card = page.locator('[data-release-id="anarchotribal"]');
    await checkShortCd(card.locator('.release-format-link'));
    await card.locator('.release-card-title-link').click();
    const overlayLinks = page.getByRole('dialog').locator('.release-detail-purchase .release-format-link');
    await expect(overlayLinks.first()).toBeVisible();
    await check(overlayLinks);
    await checkShortCd(overlayLinks.first());
    await page.goto('releases/anarchotribal/');
    await waitForShell(page);
    const detailLinks = page.locator('.release-detail-purchase .release-format-link');
    await check(detailLinks);
    await checkShortCd(detailLinks.first());
    await expectNoHorizontalOverflow(page);
  });
}

for (const width of [1440, 390]) {
  for (const surface of ['card', 'direct detail', 'overlay'] as const) {
    test(`delayed offer correction preserves keyboard focus on ${surface} at ${width}px${width === 390 ? ' @phone' : ''}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      const storeItemSlug = 'disintegration-black-vinyl-lp';
      for (const result of ['sold_out', 'unavailable', 'elsewhere', 'failed'] as const) {
        let delayed = surface !== 'overlay';
        let respond: (() => Promise<void>) | undefined;
        await page.route('**/api/store/listing-prices*', (route) => {
          if (!delayed) return route.fulfill({ json: [{ ...preorder, storeItemSlug }] });
          respond = () =>
            result === 'failed'
              ? route.fulfill({ status: 200, contentType: 'application/json', body: 'Invalid listing response' })
              : route.fulfill({
                  json: [
                    {
                      ...stocked,
                      storeItemSlug,
                      availabilityState: result === 'sold_out' ? 'sold_out' : 'unavailable',
                    },
                  ],
                });
        });
        await page.goto(surface === 'direct detail' ? 'releases/disintegration/' : 'releases/');
        await waitForShell(page);
        if (surface === 'overlay') {
          const card = page.locator('[data-release-id="disintegration"]');
          await expect(card.locator('[data-release-purchase]')).toHaveText('Pre-order vinyl');
          delayed = true;
          await card.locator('.release-card-title-link').click();
          await expect(page.getByRole('button', { name: 'Close detail view' })).toBeFocused();
        }
        const root =
          surface === 'card'
            ? page.locator('[data-release-id="disintegration"]')
            : surface === 'overlay'
              ? page.getByRole('dialog').locator('.release-detail-purchase')
              : page.locator('.release-detail-purchase');
        const buy = root.locator(surface === 'card' ? '[data-release-purchase]' : '.release-edition-actions > a');
        const format = root.locator('.release-card-formats .release-format-link').first();
        const listen = root.locator('.music-listen-trigger');
        await expect.poll(() => Boolean(respond)).toBe(true);
        await expect(buy).toHaveText('Pre-order vinyl');
        await buy.focus();
        await expect(buy).toBeFocused();
        if (result === 'elsewhere') await listen.focus();
        await respond!();
        if (result === 'failed') {
          await expect(buy).toHaveText('Pre-order vinyl');
          await expect(buy).toBeFocused();
        } else {
          await expect(buy).toBeHidden();
          if (result === 'elsewhere') {
            await expect(listen).toBeFocused();
            await expect(format).not.toBeFocused();
          } else await expect(format).toBeFocused();
        }
        await page.unroute('**/api/store/listing-prices*');
      }
    });
  }
}
