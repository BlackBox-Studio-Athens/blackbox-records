import { expect, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';

test('Store card Buy takes the Listen chrome and Releases Buy vinyl keeps restrained feedback, both stationary', async ({
  page,
}) => {
  const storeItemSlug = 'disintegration-black-vinyl-lp';
  await page.route('**/api/store/listing-prices*', (route) =>
    route.fulfill({
      json: [
        {
          storeItemSlug,
          presentationState: 'ready',
          availabilityState: 'stocked',
          displayPrice: '€28.00',
          preorder: null,
        },
      ],
    }),
  );
  let offerReads = 0;
  let releaseOffer: (() => Promise<void>) | undefined;
  await page.route(`**/api/store/items/${storeItemSlug}`, (route) => {
    offerReads += 1;
    releaseOffer = () =>
      route.fulfill({
        json: {
          storeItemSlug,
          variantId: `${storeItemSlug}_standard`,
          availability: { label: 'In stock', status: 'available' },
          canCheckout: true,
          catalogStatus: 'ready',
          price: { kind: 'fixed', amountMinor: 2800, currencyCode: 'EUR', display: '€28.00' },
        },
      });
  });
  await page.goto('store/');
  await waitForShell(page);
  const card = page.getByRole('group', { name: 'Disintegration by Afterwise', exact: true }).first();
  const buy = card.locator('[data-store-card-buy]');
  const listen = card.getByRole('button', { name: 'Listen', exact: true });
  await expect(buy).toHaveClass(/purchase-action/);
  await expect(buy).toHaveAccessibleName('Buy');
  await buy.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const appearance = (element: Element) => {
    const style = getComputedStyle(element);
    return {
      face: style.backgroundColor,
      edge: style.borderColor,
      shadow: style.boxShadow,
      transform: style.transform,
    };
  };
  const cardAppearance = () =>
    card.evaluate((element) => {
      const surface = getComputedStyle(element.querySelector('.store-item-card__surface')!);
      return {
        face: surface.backgroundColor,
        edge: surface.borderColor,
        title: getComputedStyle(element.querySelector('h2')!).textDecorationColor,
      };
    });
  const resting = await buy.evaluate(appearance);
  const cardResting = await cardAppearance();
  const footprint = await buy.boundingBox();
  await buy.hover();
  await buy.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  const hovering = await buy.evaluate(appearance);
  expect(resting.edge).toBe('rgba(245, 245, 245, 0.48)');
  expect(hovering.edge).toBe('rgb(180, 70, 90)');
  expect(hovering).not.toEqual(resting);
  expect(hovering.transform).toBe('none');
  expect(hovering.shadow === 'none' || hovering.shadow.includes('inset')).toBe(true);
  expect(await buy.boundingBox()).toEqual(footprint);
  expect(await cardAppearance()).toEqual(cardResting);
  await listen.hover();
  expect(await cardAppearance()).toEqual(cardResting);
  await buy.focus();
  await expect(buy).toBeFocused();
  await expect(buy).toHaveCSS('outline-width', '2px');
  await expect(buy).toHaveCSS('outline-style', 'solid');
  expect(await cardAppearance()).toEqual(cardResting);
  await page.mouse.move(0, 0);
  await buy.click();
  await expect(buy).toHaveAttribute('aria-busy', 'true');
  await expect(buy).toHaveText('Adding');
  await expect.poll(() => buy.evaluate(appearance)).toEqual(resting);
  await buy.click();
  await expect.poll(() => offerReads).toBe(1);
  await releaseOffer!();
  const cart = page.getByRole('dialog', { name: 'Cart' });
  await expect(cart).toBeVisible();
  await expect(page).toHaveURL(/\/store\/$/);
  await page.keyboard.press('Escape');
  await expect(cart).toBeHidden();

  // A native disabled visual fixture checks shared styling; Store Buy's real pending state above uses aria-busy.
  await buy.evaluate((button: HTMLButtonElement) => {
    button.disabled = true;
  });
  await expect(buy).toBeDisabled();
  await expect(buy).toHaveCSS('pointer-events', 'none');
  await expect(buy).toHaveCSS('opacity', '0.45');
  await expect.poll(() => buy.evaluate(appearance)).toEqual(resting);
  await buy.evaluate((button: HTMLButtonElement) => {
    button.disabled = false;
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(buy).toHaveCSS('transition-duration', '0s');
  await expect(card.locator('.store-item-card__surface')).toHaveCSS('transition-duration', '0s');
  await buy.hover();
  expect(await buy.evaluate(appearance)).toEqual(hovering);

  await page.goto('releases/');
  await waitForShell(page);
  const releaseBuy = page.locator('[data-release-role="lead"]').getByRole('link', { name: 'Buy vinyl', exact: true });
  await expect(releaseBuy).toHaveClass(/purchase-action/);
  await releaseBuy.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const releaseResting = await releaseBuy.evaluate(appearance);
  await releaseBuy.hover();
  const releaseHovering = await releaseBuy.evaluate(appearance);
  expect(releaseHovering).not.toEqual(releaseResting);
  expect(releaseHovering.transform).toBe('none');
  expect(releaseHovering.shadow === 'none' || releaseHovering.shadow.includes('inset')).toBe(true);
  await expect(releaseBuy).toHaveCSS('transition-duration', '0s');
});

test('Store categories center and reflow with complete touch-sized labels', async ({ page }, testInfo) => {
  await page.goto('store/');
  await waitForShell(page);
  const categories = page.getByRole('navigation', { name: 'Store categories' });
  const list = categories.locator('ul');
  const links = categories.getByRole('link');

  // The fourth destination is a layout fixture only; published catalog membership stays unchanged.
  await list.evaluate((list) => list.querySelector('a[href$="/merch/"]')?.parentElement?.remove());
  for (const count of [3, 4]) {
    if (count === 4) {
      await list.evaluate((list) => {
        const item = list.firstElementChild!.cloneNode(true) as HTMLElement;
        const link = item.querySelector('a')!;
        link.href = new URL('merch/', link.href).href;
        link.textContent = 'Merch';
        link.removeAttribute('aria-current');
        link.removeAttribute('data-store-category-active');
        list.append(item);
      });
    }
    await expect(links).toHaveText(['All', 'BlackBox Releases', 'Distro', 'Merch'].slice(0, count));
    for (const textScale of [1, 2]) {
      await page.evaluate((scale) => (document.documentElement.style.fontSize = `${scale * 100}%`), textScale);
      for (const width of [320, 390, 640, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        const layout = await list.evaluate((list) => {
          const box = list.getBoundingClientRect();
          const rows = new Map<number, { left: number; right: number }>();
          const links = Array.from(list.querySelectorAll('a'), (link) => {
            const rect = link.getBoundingClientRect();
            const text = document.createRange();
            text.selectNodeContents(link);
            const textBox = text.getBoundingClientRect();
            const style = getComputedStyle(link);
            const top = Math.round(rect.top);
            const row = rows.get(top);
            rows.set(top, {
              left: Math.min(row?.left ?? rect.left, rect.left),
              right: Math.max(row?.right ?? rect.right, rect.right),
            });
            return {
              left: rect.left,
              right: rect.right,
              height: rect.height,
              textLeft: textBox.left,
              textRight: textBox.right,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
            };
          });
          return {
            center: box.left + box.width / 2,
            rows: [...rows.values()],
            links,
            viewport: window.innerWidth,
            overflow: document.documentElement.scrollWidth > window.innerWidth,
          };
        });
        for (const row of layout.rows)
          expect(Math.abs((row.left + row.right) / 2 - layout.center)).toBeLessThanOrEqual(1);
        for (const link of layout.links) {
          expect(link.height).toBeGreaterThanOrEqual(width < 640 ? 48 : 52);
          expect(link.left).toBeGreaterThanOrEqual(0);
          expect(link.right).toBeLessThanOrEqual(layout.viewport);
          expect(link.textLeft).toBeGreaterThanOrEqual(link.left);
          expect(link.textRight).toBeLessThanOrEqual(link.right + 1);
          expect(link.fontSize).toBe(`${(width < 640 ? 16 : 18) * textScale}px`);
          expect(link.fontWeight).toBe('600');
        }
        if (textScale === 1) {
          expect(layout.overflow).toBe(false);
          if ([320, 390, 1280].includes(width))
            await page.screenshot({ path: testInfo.outputPath(`categories-${count}-${width}.png`) });
        }
      }
    }
  }
});

test('Store categories retain current state, keyboard focus and shell navigation', async ({ page }) => {
  await page.goto('store/');
  await waitForShell(page);
  await plantSentinel(page);
  const categories = page.getByRole('navigation', { name: 'Store categories' });
  const all = categories.getByRole('link', { name: 'All', exact: true });
  const releases = categories.getByRole('link', { name: 'BlackBox Releases', exact: true });
  const releaseCard = page.getByRole('group', { name: 'Disintegration by Afterwise', exact: true });
  await expect(releaseCard).toHaveCount(1);
  await expect(all).toHaveAttribute('aria-current', 'page');
  await all.focus();
  await page.keyboard.press('Tab');
  await expect(releases).toBeFocused();
  await expect(releases).toHaveCSS('outline-width', '2px');
  await expect(releases).toHaveCSS('outline-style', 'solid');
  await releases.hover();
  await expect(all).toHaveAttribute('aria-current', 'page');
  await expect(releases).not.toHaveAttribute('aria-current', 'page');
  await expect(releases).not.toHaveCSS(
    'border-bottom-color',
    await all.evaluate((link) => getComputedStyle(link).borderBottomColor),
  );
  for (const [label, route] of [
    ['BlackBox Releases', 'blackbox-releases/'],
    ['Distro', 'distro/'],
    ['All', ''],
  ]) {
    await categories.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/store/${route}$`));
    await expect(categories.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(categories.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(releaseCard).toHaveCount(label === 'Distro' ? 0 : 1);
    expect(await sentinelIntact(page)).toBe(true);
  }
  await releases.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(all).toBeFocused();
  await expect(all).toHaveCSS('outline-width', '2px');
  await expect(all).toHaveCSS('outline-style', 'solid');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(all).toHaveCSS('transition-duration', '0s');
});

test('Store listing cards use Veneer titles and quiet credits with unchanged sizes', async ({ page }) => {
  await page.goto('store/');
  await waitForShell(page);
  await page.evaluate(() => document.fonts.ready);
  const linked = page.getByRole('group', { name: 'Disintegration by Afterwise', exact: true }).first();
  const unlinked = page
    .locator('.store-item-card--listing')
    .filter({ has: page.locator('.store-item-card__artist-name:not(:has(a))') })
    .first();
  await expect(linked.locator('.store-item-card__artist-link')).toHaveText('Afterwise');
  await expect(linked.locator('.store-item-card__artist-link')).toHaveAttribute('href', /\/artists\/afterwise\/$/);
  await expect(unlinked.locator('.store-item-card__artist-link')).toHaveCount(0);
  expect(await page.evaluate(() => document.fonts.check('900 24px Veneer'))).toBe(true);
  const longNames = await page.locator('.store-item-card--listing').evaluateAll((cards) => {
    const byLength = (selector: string) =>
      [...cards]
        .sort(
          (a, b) =>
            (b.querySelector(selector)?.textContent?.length ?? 0) -
            (a.querySelector(selector)?.textContent?.length ?? 0),
        )[0]!
        .getAttribute('aria-label')!;
    return [...new Set([byLength('h2'), byLength('.store-item-card__artist-name')])];
  });

  for (const width of [320, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const card of [linked, unlinked]) {
      const title = card.locator('h2');
      const credit = card.locator('.store-item-card__artist');
      const name = card.locator('.store-item-card__artist-name');
      const artist = (await name.textContent())!.trim();
      await expect(title).toHaveCSS('font-family', /Veneer/);
      await expect(title).toHaveCSS('font-weight', '900');
      await expect(title).toHaveCSS('text-transform', 'none');
      await expect(title).toHaveCSS('font-size', width === 1440 ? '24px' : '20px');
      await expect(credit).toHaveText(`by ${artist}`);
      await expect(credit).toHaveCSS('font-family', /Inter/);
      await expect(credit).toHaveCSS('font-weight', '400');
      await expect(name).toHaveCSS('font-family', /Inter/);
      await expect(name).toHaveCSS('font-weight', '400');
      await expect(name).toHaveCSS('font-size', '14px');
      await expect(name).toHaveCSS('line-height', '19.6px');
      await expect(card).toHaveAttribute('data-store-artist', artist);
      await expect(card.locator('.prose-card-link')).toHaveAccessibleName(`${await title.textContent()} by ${artist}`);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await linked
      .locator('.store-item-card__content')
      .evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: `.codex-artifacts/e2e/store-typography/${width}.png` });
    for (const [index, label] of longNames.entries()) {
      const card = page.getByRole('group', { name: label, exact: true }).first();
      for (const selector of ['h2', '.store-item-card__artist']) {
        expect(await card.locator(selector).evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
          true,
        );
      }
      await card
        .locator('.store-item-card__content')
        .evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await page.screenshot({ path: `.codex-artifacts/e2e/store-typography/${width}-long-${index}.png` });
    }
  }

  // Model 200% zoom from a 1440x900 desktop: half the CSS viewport and double the pixel scale.
  // Native browser zoom remains a separate visual acceptance check.
  const zoom = await page.context().newCDPSession(page);
  await page.setViewportSize({ width: 720, height: 450 });
  await zoom.send('Emulation.setDeviceMetricsOverride', {
    width: 720,
    height: 450,
    deviceScaleFactor: 2,
    mobile: false,
  });
  expect(await page.evaluate(() => [window.innerWidth, window.devicePixelRatio])).toEqual([720, 2]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const [index, label] of longNames.entries()) {
    const card = page.getByRole('group', { name: label, exact: true }).first();
    for (const selector of ['h2', '.store-item-card__artist']) {
      expect(await card.locator(selector).evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    await card.locator('h2').evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.screenshot({ path: `.codex-artifacts/e2e/store-typography/200-percent-reflow-long-${index}.png` });
  }
  await zoom.send('Emulation.clearDeviceMetricsOverride');
  await zoom.detach();
  await page.setViewportSize({ width: 1440, height: 900 });

  await linked.locator('.store-item-card__artist-link').click();
  await expect(page).toHaveURL(/\/artists\/afterwise\/$/);
  await page.goBack();
  await waitForShell(page);
  await linked.locator('.prose-card-link').click();
  await expect(page).toHaveURL(/\/store\/disintegration-black-vinyl-lp\/$/);
  await expect(page.locator('h1.brand-display-title')).toHaveCSS('font-family', /Veneer/);
});

for (const route of ['store/', 'store/distro/']) {
  test(`${route} Coverflow wheel navigation keeps the page still`, async ({ page }) => {
    await page.goto(route);
    await waitForShell(page);
    await page.getByRole('button', { name: 'Coverflow', exact: true }).click();
    const group = page.locator('[data-store-coverflow-group]');
    const stage = group.locator('[data-store-coverflow-stage]');
    const wheelSurface = group.locator('.store-coverflow-shell');
    const active = stage.locator('[data-store-coverflow-position="active"]');
    await expect(group).toHaveAttribute('data-store-coverflow-mode', 'preview');
    await wheelSurface.scrollIntoViewIfNeeded();
    const labels = await stage
      .locator('[data-store-coverflow-card]')
      .evaluateAll((cards) => cards.map((card) => card.getAttribute('aria-label')!));

    const wheelWithoutPageScroll = async (deltaY: number, expectedLabel: string) => {
      const initialScroll = await page.evaluate(() => window.scrollY);
      await page.mouse.wheel(0, deltaY);
      const positions = await page.evaluate(async () => {
        const positions = [window.scrollY];
        const started = performance.now();
        while (performance.now() - started < 750) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          positions.push(window.scrollY);
        }
        return positions;
      });
      expect(Math.max(...positions.map((position) => Math.abs(position - initialScroll)))).toBeLessThanOrEqual(1);
      await expect(active).toHaveAttribute('aria-label', expectedLabel);
    };

    const coverBox = (await active.boundingBox())!;
    await page.mouse.move(coverBox.x + coverBox.width / 2, coverBox.y + coverBox.height / 2);
    await wheelWithoutPageScroll(8, labels[0]!);
    await wheelWithoutPageScroll(120, labels[1]!);

    const stageBox = (await wheelSurface.boundingBox())!;
    const gap = { x: stageBox.x + 8, y: stageBox.y + stageBox.height / 2 };
    expect(
      await wheelSurface.evaluate((element, point) => {
        const target = document.elementFromPoint(point.x, point.y);
        return Boolean(target && element.contains(target) && !target.closest('[data-store-coverflow-card]'));
      }, gap),
    ).toBe(true);
    await page.mouse.move(gap.x, gap.y);
    await wheelWithoutPageScroll(-120, labels[0]!);

    const outsideScroll = await page.evaluate(() => window.scrollY);
    await page.mouse.move(8, page.viewportSize()!.height / 2);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(outsideScroll + 1);

    await page.getByRole('button', { name: 'Grid', exact: true }).click();
    await expect(group).toHaveAttribute('data-store-coverflow-mode', 'catalog');
    await expect(page.locator('[data-store-coverflow-transitioning]')).toHaveCount(0);
    const gridCard = stage.locator('[data-store-coverflow-card]').first();
    await gridCard.scrollIntoViewIfNeeded();
    const gridBox = (await gridCard.boundingBox())!;
    const gridScroll = await page.evaluate(() => window.scrollY);
    await page.mouse.move(gridBox.x + gridBox.width / 2, gridBox.y + gridBox.height / 2);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(gridScroll + 1);
  });
}

test('phone Store shows Distro formats without opening a disclosure and selects one', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('store/distro/');
  await waitForShell(page);
  // The search control renders once the Distro enhancement is connected.
  await expect(page.locator('[data-distro-search] input')).toBeVisible();

  const formats = page.getByRole('navigation', { name: 'Browse Distro formats' });
  const cds = formats.getByRole('link', { name: /^CDs/ });
  await expect(cds).toBeVisible();
  await expect(formats.getByRole('link', { name: /^All formats/ })).toHaveAttribute('aria-current', 'true');

  await cds.click();
  await expect(cds).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-distro-search-group]')).toHaveCount(0);
  const cards = page.locator('[data-distro-search-item]:visible');
  const key = (await cds.getAttribute('href'))!.slice(1);
  expect(await cards.count()).toBeGreaterThan(0);
  expect(await cards.count()).toBe(Number(await cds.locator('span').last().innerText()));
  for (const card of await cards.all()) await expect(card).toHaveAttribute('data-distro-format-key', key);
  const artist = await cards.first().getAttribute('data-store-artist');
  const artistsChip = page.getByRole('button', { name: /^Artists/ });
  await artistsChip.click();
  const sheet = page.getByRole('dialog', { name: 'Artists' });
  await sheet
    .locator('[data-store-artist-option]')
    .filter({ hasText: `${artist} (` })
    .first()
    .getByRole('checkbox')
    .check();
  await expect(sheet.locator('[data-store-artist-selected-label]')).toHaveText('Selected · 1');
  await sheet.getByRole('button', { name: /^Show \d+ items?$/ }).click();
  await expect(sheet).toBeHidden();
  await expect(artistsChip).toBeFocused();
  await expect(artistsChip).toHaveText('Artists · 1');
  const filterRow = await page
    .locator('[data-store-artists-trigger], [data-store-clear-filters]')
    .evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().top)));
  expect(new Set(filterRow).size).toBe(1);
  await page.getByRole('searchbox', { name: 'Search Store' }).fill(await cards.first().locator('h2').innerText());
  await expect(cards.first()).toHaveAttribute('data-store-artist', artist!);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(formats.getByRole('link', { name: /^All formats/ })).toHaveAttribute('aria-current', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '.codex-artifacts/e2e/distro-layouts/mobile.png' });
  await cards.first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.codex-artifacts/e2e/distro-layouts/mobile-cards.png' });
});

test('desktop Store artist filter combines several ticked artists with find and clearing', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('store/distro/');
  await waitForShell(page);
  const pane = page.getByRole('group', { name: 'Artists' });
  await expect(pane.getByRole('checkbox').first()).toBeEnabled();
  await expect(pane.getByText('All artists')).toHaveCount(0);
  await expect(page.locator('[data-store-artists-trigger]')).toBeHidden();
  const options = pane.locator('[data-store-artist-options] input');
  const [first, second] = await options.evaluateAll((nodes) =>
    nodes.slice(2, 4).map((node) => node.getAttribute('value')!),
  );
  await pane.locator(`input[value="${first}"]`).check();
  const secondBox = pane.locator(`input[value="${second}"]`);
  await secondBox.focus();
  await page.keyboard.press('Space');
  await expect(secondBox).toBeFocused();
  await expect(pane.locator('[data-store-artist-selected-label]')).toHaveText('Selected · 2');
  await expect(pane.locator('[data-store-artist-selected-list] input')).toHaveCount(2);
  const cards = page.locator('[data-distro-search-item]:visible');
  expect(await cards.count()).toBeGreaterThan(0);
  const shown = await cards.evaluateAll((nodes) =>
    nodes.map((node) =>
      node.getAttribute('data-store-artist')!.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase(),
    ),
  );
  expect(new Set(shown)).toEqual(new Set([first, second]));
  await expect(page.locator('[data-store-search-summary]')).toHaveText(
    `${shown.length} ${shown.length === 1 ? 'item' : 'items'}`,
  );

  const find = pane.getByRole('searchbox', { name: 'Find an artist' });
  await find.fill('no-artist-has-this-name');
  await expect(pane.getByText('No artist matches.', { exact: true })).toBeVisible();
  await expect(pane.locator('[data-store-artist-selected-list] input')).toHaveCount(2);
  await find.fill('');
  await expect(cards).toHaveCount(shown.length);

  const clearFilters = page.getByRole('button', { name: 'Clear filters', exact: true });
  await expect(clearFilters).toHaveCSS('font-weight', '700');
  await expect(clearFilters).toHaveCSS('font-size', '16px');
  await pane.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(pane.locator('input:checked')).toHaveCount(0);
  await expect(pane.locator('[data-store-artist-selected]')).toBeHidden();
  await expect(clearFilters).toBeHidden();
  expect(await options.evaluateAll((nodes) => nodes.slice(2, 4).map((node) => node.getAttribute('value')))).toEqual([
    first,
    second,
  ]);

  await pane.locator(`input[value="${first}"]`).check();
  await clearFilters.click();
  await expect(pane.locator('input:checked')).toHaveCount(0);
  await expect(page.getByRole('searchbox', { name: 'Search Store' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Distro catalog keeps its alphabetical order through format, search and Coverflow changes', async ({ page }) => {
  await page.goto('store/distro/#distro-group-cds');
  await waitForShell(page);
  const search = page.getByRole('searchbox', { name: 'Search Store' });
  await expect(search).toBeVisible();
  const root = page.locator('[data-distro-search-root]');
  const cards = root.locator('[data-distro-search-item]');
  const slugs = () =>
    cards
      .locator('[data-store-listing-price]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-store-item-slug')));
  const original = await slugs();
  expect(new Set(original).size).toBe(original.length);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  const order = await cards.evaluateAll((nodes) =>
    nodes.map((node) => ({
      artist: node.getAttribute('data-store-artist')!,
      title: node.querySelector('h2')!.textContent!,
      slug: node.querySelector('[data-store-listing-price]')!.getAttribute('data-store-item-slug')!,
    })),
  );
  expect(original).not.toContain('disintegration-black-vinyl-lp');
  const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
  const normal = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ');
  expect(order).toEqual(
    [...order].sort(
      (a, b) =>
        collator.compare(normal(a.artist), normal(b.artist)) ||
        collator.compare(a.title, b.title) ||
        a.slug.localeCompare(b.slug, 'en'),
    ),
  );
  await expect(root.locator('.store-item-card__artist-link')).toHaveCount(0);
  await expect(root.locator('.store-item-card__artist-name').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '.codex-artifacts/e2e/distro-layouts/desktop.png' });
  const firstCard = cards.locator('visible=true').first();
  const formatKey = await firstCard.getAttribute('data-distro-format-key');
  const firstTitle = await firstCard.locator('h2').innerText();
  await page.locator(`[data-distro-format-link][data-distro-format-key="${formatKey}"]`).click();
  await search.fill(firstTitle);
  await expect(firstCard).toBeVisible();
  expect(await cards.locator('visible=true').count()).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  const coverflow = page.getByRole('button', { name: 'Coverflow', exact: true });
  await coverflow.click();
  await expect(root.locator('[data-store-coverflow-group]')).toHaveAttribute('data-store-coverflow-mode', 'preview');
  await search.fill('no-match-for-this-distro-catalog');
  await expect(cards.locator('visible=true')).toHaveCount(0);
  await expect(coverflow).toBeDisabled();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(root.locator('[data-store-coverflow-group]')).toHaveAttribute('data-store-coverflow-mode', 'catalog');
  expect(await slugs()).toEqual(original);
  expect(await cards.locator('visible=true').count()).toBe(original.length);
  await coverflow.click();
  await expect(coverflow).toHaveAttribute('aria-pressed', 'true');
  const categories = page.getByRole('navigation', { name: 'Store categories' });
  await categories.getByRole('link', { name: 'All', exact: true }).click();
  await expect(page).toHaveURL(/\/store\/$/);
  await expect(page.locator('#all-store-catalog')).toBeVisible();
  await categories.getByRole('link', { name: 'Distro', exact: true }).click();
  await expect(page).toHaveURL(/\/store\/distro\/$/);
  await expect(root.locator('[data-store-coverflow-group]')).toHaveAttribute('data-store-coverflow-mode', 'catalog');
  expect(await slugs()).toEqual(original);
  expect(await cards.locator('visible=true').count()).toBe(original.length);
});

test.describe('Native Store navigation', () => {
  test.use({ javaScriptEnabled: false });

  test('Distro and Store categories remain complete without JavaScript including legacy fragments', async ({
    page,
  }) => {
    // Four complete document loads take longer than shell navigation on the local dev server.
    test.setTimeout(180_000);
    // Without scripting, browsers eagerly fetch every catalogue image; this test covers native navigation.
    await page.route('**/*', (route) =>
      route.request().resourceType() === 'image'
        ? route.fulfill({
            contentType: 'image/svg+xml',
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
          })
        : route.fallback(),
    );
    await page.goto('store/distro/#distro-group-cds');
    const cards = page.locator('[data-distro-search-item]');
    expect(await cards.count()).toBeGreaterThan(6);
    const releaseCard = page.getByRole('group', { name: 'Disintegration by Afterwise', exact: true });
    await expect(releaseCard).toHaveCount(0);
    expect(await cards.locator('visible=true').count()).toBe(await cards.count());
    await expect(page.getByRole('button', { name: 'Coverflow', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Coverflow', exact: true })).toBeDisabled();
    await expect(page.locator('.store-item-card__artist-link')).toHaveCount(0);
    await expect(page.locator('.store-item-card__artist-name').first()).toBeVisible();
    await expect(page.locator('#distro-group-cds')).toHaveCount(1);
    // The legacy fragment starts below the category bar; return above the fixed header before choosing a shelf.
    await page.keyboard.press('Control+Home');
    for (const [label, route] of [
      ['BlackBox Releases', 'blackbox-releases/'],
      ['All', ''],
      ['Distro', 'distro/'],
    ]) {
      const categories = page.getByRole('navigation', { name: 'Store categories' });
      // Exercise native keyboard activation; the scripted case above covers pointer activation.
      const link = categories.getByRole('link', { name: label, exact: true });
      await link.focus();
      await expect(link).toBeFocused();
      await link.press('Enter');
      await expect(page).toHaveURL(new RegExp(`/store/${route}$`));
      await expect(categories.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
      await expect(releaseCard).toHaveCount(label === 'Distro' ? 0 : 1);
    }
  });
});

test('Distro shell navigation and filters preserve the playing iframe', async ({ page }) => {
  test.setTimeout(180_000);
  await page.route(/^https:\/\/(bandcamp\.com|embed\.tidal\.com)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  await page.goto('releases/');
  await waitForShell(page);
  await plantSentinel(page);
  await page.locator('[data-music-streaming-service-embedded-player-trigger]').first().click();
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  await iframe.contentFrame().getByRole('button', { name: 'Player fixture' }).click();
  await page.getByRole('button', { name: 'Minimize player' }).click();
  const original = await iframe.elementHandle();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Store' }).click();
  await expect(page).toHaveURL(/\/store\/$/, { timeout: 60_000 });
  await expect(page.locator('#all-store-catalog')).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Store categories' })
    .getByRole('link', { name: 'Distro', exact: true })
    .click();
  await expect(page).toHaveURL(/\/store\/distro\/$/);
  await expect(page.locator('[data-distro-search-root]')).toBeVisible();
  const search = page.getByRole('searchbox', { name: 'Search Store' });
  await expect(search).toBeVisible();
  await search.fill('no-match-for-this-distro-catalog');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  expect(await sentinelIntact(page)).toBe(true);
  expect(await original!.evaluate((element) => element.isConnected)).toBe(true);
  await page.getByRole('button', { name: 'Open player' }).click();
  await expect(page.getByRole('dialog', { name: 'Music player' })).toBeVisible();
  expect(await original!.evaluate((element) => element.isConnected)).toBe(true);
});

test('Coverflow steps settle on CSS positions and a first typo query waits for the lazy fuzzy matcher', async ({
  page,
}) => {
  await page.goto('store/distro/');
  await waitForShell(page);
  const search = page.getByRole('searchbox', { name: 'Search Store' });
  await expect(search).toBeVisible();
  const root = page.locator('[data-distro-search-root]');
  const group = root.locator('[data-store-coverflow-group]').first();
  const cards = group.locator('[data-store-coverflow-card]');
  const total = await cards.count();

  await page.getByRole('button', { name: 'Coverflow', exact: true }).click();
  await expect(group).toHaveAttribute('data-store-coverflow-mode', 'preview');
  await group.locator('[data-store-coverflow-next]').click();
  await expect(cards.nth(1)).toHaveAttribute('data-store-coverflow-position', 'active');
  // Native position animations run without fill, so settled cards carry no inline styles and no position ratio.
  await expect
    .poll(() =>
      group.evaluate((element) => ({
        animatedCards: document
          .getAnimations()
          .filter((animation) =>
            (animation.effect as KeyframeEffect | null)?.target?.hasAttribute('data-store-coverflow-card'),
          ).length,
        inlineCards: [...element.querySelectorAll<HTMLElement>('[data-store-coverflow-card]')].filter(
          (card) => card.style.transform || card.style.opacity,
        ).length,
        groupRatio: element.style.getPropertyValue('--store-coverflow-position-ratio'),
      })),
    )
    .toEqual({ animatedCards: 0, inlineCards: 0, groupRatio: '' });
  expect(total).toBeGreaterThan(6);
  // The plaque's Listen end plays the front cover; the card's own Listen steps aside.
  const plaqueListen = group.locator('[data-store-coverflow-listen]');
  const cardListen = cards.nth(1).locator('[data-music-listen-source-id]');
  if (await cardListen.count()) {
    await expect(plaqueListen).toBeVisible();
    await expect(plaqueListen).toHaveAttribute(
      'data-music-listen-source-id',
      (await cardListen.getAttribute('data-music-listen-source-id'))!,
    );
    await expect(cardListen).toBeHidden();
  } else {
    await expect(plaqueListen).toBeHidden();
  }
  await expect(cards.nth(1).locator('.store-item-card__price')).toBeVisible();
  await expect(cards.nth(1).locator('.brand-card-title')).toBeHidden();
  await page.getByRole('button', { name: 'Grid', exact: true }).click();
  await expect(group).toHaveAttribute('data-store-coverflow-mode', 'catalog');

  // A pasted typo is the first query, so the fuzzy fallback must wait for fuse.js and then search again.
  const title = (await cards.nth(1).locator('h2').innerText()).trim();
  const word = title.split(/\s+/).reduce((longest, part) => (part.length > longest.length ? part : longest), '');
  expect(word.length).toBeGreaterThanOrEqual(5);
  const typo = word.slice(0, 2) + word[3] + word[2] + word.slice(4);
  await search.fill(typo);
  await expect(root.locator('[data-distro-search-item]:visible h2', { hasText: title }).first()).toBeVisible();
  await expect(page.locator('.store-empty-results')).toBeHidden();
});
