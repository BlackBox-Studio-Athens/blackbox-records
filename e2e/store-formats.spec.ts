import { expect, expectNoHorizontalOverflow, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';

for (const width of [1440, 390]) {
  test(`Store card Buy and Releases Buy vinyl fill Flint with compact static controls at ${width}px${width === 390 ? ' @phone' : ''}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
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
    let depleted = false;
    let releaseOffer: (() => Promise<void>) | undefined;
    await page.route(`**/api/store/items/${storeItemSlug}`, (route) => {
      offerReads += 1;
      releaseOffer = () =>
        route.fulfill({
          json: {
            storeItemSlug,
            variantId: `${storeItemSlug}_standard`,
            availability: {
              label: depleted ? 'Sold Out' : 'In stock',
              status: depleted ? 'sold_out' : 'available',
              state: depleted ? 'sold_out' : 'stocked',
            },
            canCheckout: !depleted,
            catalogStatus: depleted ? 'sold_out' : 'ready',
            price: { kind: 'fixed', amountMinor: 2800, currencyCode: 'EUR', display: '€28.00' },
          },
        });
    });
    await page.goto('store/');
    await waitForShell(page);
    await page.evaluate(() => document.fonts.ready);
    // The background card becomes inert while Cart is open; inspect its retained confirmation by DOM hook.
    const card = page.locator('.store-item-card--listing[aria-label="Disintegration by Afterwise"]').first();
    const buy = card.locator('[data-store-card-buy]');
    const listen = card.locator('.store-item-card__listen .music-listen-trigger');
    await expect(buy).toHaveClass(/purchase-action/);
    await expect(buy).toHaveAccessibleName('Buy');
    await expect(buy.locator('.store-card-buy-icon')).toHaveCount(1);
    await expect(buy.locator('.store-buy-icon, img')).toHaveCount(0);
    // Phone cards give Buy its own full-width line below the price.
    const phone = width < 640;
    await expect(buy).toHaveCSS('min-width', phone ? '0px' : '112px');
    await expect(buy).toHaveCSS('padding-left', phone ? '12px' : '16px');
    await expect(buy).toHaveCSS('column-gap', '8px');
    await expect(buy).toHaveCSS('font-size', '16px');
    expect((await buy.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect((await buy.boundingBox())!.width).toBeGreaterThanOrEqual(phone ? 44 : 112);
    await buy.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const canHover = await page.evaluate(() => matchMedia('(hover: hover)').matches);
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
    await expect(buy.locator('.store-card-buy-icon')).toHaveCSS('animation-name', 'none');
    await expect(buy.locator('.store-card-buy-icon')).toHaveCSS('width', '18px');
    // Flint 700 face at rest; hover darkens to Flint 800 and lights the edge Flint 500.
    expect(resting).toMatchObject({ face: 'rgb(98, 110, 114)', edge: 'rgb(98, 110, 114)' });
    expect(hovering).toMatchObject(canHover ? { face: 'rgb(77, 89, 92)', edge: 'rgb(136, 147, 150)' } : resting);
    await expect(buy).toHaveCSS('color', 'rgb(245, 245, 245)');
    if (canHover) expect(hovering).not.toEqual(resting);
    else expect(hovering).toEqual(resting);
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
    await expect(buy.locator('.store-card-buy-icon')).toHaveCount(1);
    await expect.poll(() => buy.evaluate(appearance)).toEqual(resting);
    await buy.click();
    await expect.poll(() => offerReads).toBe(1);
    await releaseOffer!();
    await expect(buy).toHaveText('Added');
    await expect(buy.locator('.store-card-buy-icon')).toHaveCount(1);
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
    // Releases action names add the release after the visible label.
    const releaseBuy = page.locator('[data-release-role="lead"]').getByRole('link', { name: /^Buy vinyl, / });
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

    // A listing projection cannot promise stock after the authoritative offer has depleted.
    depleted = true;
    await page.goto('store/');
    await waitForShell(page);
    await expect(buy).toHaveText('Buy');
    await buy.click();
    await expect.poll(() => offerReads).toBe(2);
    await releaseOffer!();
    await expect(buy).toBeHidden();
    await expect(card.locator('[data-store-listing-availability]')).toHaveText('Sold Out');
    await expect(card.locator('[data-store-listing-price]')).toHaveText('€28.00');
    await expectNoHorizontalOverflow(page);
  });
}

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
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
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

test('Store listing cards lead with format, a Veneer title and a promoted artist credit', async ({ page }) => {
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
      const greek = /\p{Script=Greek}/u.test((await title.textContent())!);
      await expect(title).toHaveCSS('font-family', greek ? /Inter/ : /Veneer/);
      await expect(title).toHaveCSS('font-weight', greek ? '600' : '900');
      await expect(title).toHaveCSS('text-transform', 'none');
      await expect(title).toHaveCSS('font-size', width === 1440 ? '24px' : '20px');
      await expect(credit).toHaveText(`by ${artist}`);
      await expect(credit).toHaveCSS('font-family', /Inter/);
      // The artist credit is promoted: Inter medium in ink, 16px on phones and 17px on desktop, with a muted by.
      await expect(credit).toHaveCSS('font-weight', '500');
      await expect(credit).toHaveCSS('color', 'rgb(171, 181, 184)');
      await expect(name).toHaveCSS('font-family', /Inter/);
      await expect(name).toHaveCSS('font-weight', '500');
      await expect(name).toHaveCSS('color', 'rgb(245, 245, 245)');
      await expect(name).toHaveCSS('font-size', width >= 1024 ? '17px' : '16px');
      // The format precedes the title as a plain ink Inter 13px semibold capitals line, without a mark.
      const format = card.locator('.store-item-card__option');
      await expect(format).toHaveCSS('font-size', '13px');
      await expect(format).toHaveCSS('font-weight', '600');
      await expect(format).toHaveCSS('text-transform', 'uppercase');
      await expect(format).toHaveCSS('color', 'rgb(245, 245, 245)');
      expect(
        await card.evaluate((element) => {
          const format = element.querySelector('.store-item-card__option')!;
          return Boolean(
            format.compareDocumentPosition(element.querySelector('h2')!) & Node.DOCUMENT_POSITION_FOLLOWING,
          );
        }),
      ).toBe(true);
      await expect(card).toHaveAttribute('data-store-artist', artist);
      await expect(card.locator('.prose-card-link')).toHaveAccessibleName(`${await title.textContent()} by ${artist}`);
    }
    await expectNoHorizontalOverflow(page);
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
  await expectNoHorizontalOverflow(page);
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

test('Greek public titles use whole-title Inter, wrap and survive shell navigation @phone', async ({
  page,
  browserName,
}, testInfo) => {
  await page.goto('store/');
  await waitForShell(page);
  await plantSentinel(page);
  const samples = ['Ατελές το ον', 'Ατοπια', 'Blues & Ντέρτια'];
  const renderedFonts: unknown[] = [];
  const cdp = browserName === 'chromium' ? await page.context().newCDPSession(page) : undefined;
  if (cdp) await cdp.send('DOM.enable');
  if (cdp) await cdp.send('CSS.enable');
  for (const width of [320, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const sample of samples) {
      const title = page.getByRole('heading', { name: sample, exact: true }).first();
      await title.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      await expect(title).toHaveText(sample);
      await expect(title).toHaveCSS('font-family', /Inter/);
      await expect(title).toHaveCSS('font-weight', '600');
      await expect(title).toHaveCSS('text-transform', 'none');
      await expect(title).toHaveCSS('font-size', width === 1440 ? '24px' : '20px');
      expect(await title.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      if (cdp) {
        const slug = await title.evaluate((el) =>
          el.closest('[data-store-crate-slug]')!.getAttribute('data-store-crate-slug'),
        );
        const { root } = await cdp.send('DOM.getDocument');
        const { nodeId } = await cdp.send('DOM.querySelector', {
          nodeId: root.nodeId,
          selector: `[data-store-crate-slug="${slug}"] h2`,
        });
        const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
        renderedFonts.push({ width, sample, fonts });
        expect(fonts.some((font) => font.glyphCount > 0)).toBe(true);
        expect(
          fonts
            .filter((font) => font.glyphCount > 0)
            .every((font) => font.isCustomFont && /Inter/.test(font.familyName)),
        ).toBe(true);
      }
    }
    const latin = page.getByRole('heading', { name: 'Disintegration', exact: true }).first();
    await expect(latin).toHaveCSS('font-family', /Veneer/);
    await expect(latin).toHaveCSS('font-weight', '900');
    // Stress the real marked title's layout; predicate coverage for these scripts lives in the unit test.
    const mixed = page.getByRole('heading', { name: 'Blues & Ντέρτια', exact: true }).first();
    await mixed.evaluate((el) => {
      el.textContent = 'Ἄτοπος Ντέρτια Blues & '.repeat(8);
    });
    await expectNoHorizontalOverflow(page);
    const stress = page.locator('[data-store-crate-slug="mpugio-dirty-johnny-blues-ntertia-cd"] h2');
    expect(await stress.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    if (cdp) {
      const { root } = await cdp.send('DOM.getDocument');
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: '[data-store-crate-slug="mpugio-dirty-johnny-blues-ntertia-cd"] h2',
      });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      renderedFonts.push({ width, sample: 'Greek Extended and decomposed long-title probe', fonts });
      expect(
        fonts.filter((font) => font.glyphCount > 0).every((font) => font.isCustomFont && /Inter/.test(font.familyName)),
      ).toBe(true);
    }
    await stress.evaluate((el) => {
      el.textContent = 'Blues & Ντέρτια';
    });
    await stress.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `.codex-artifacts/e2e/store-typography/greek-${width}.png` });
  }
  if (cdp) await cdp.detach();
  await testInfo.attach('rendered-fonts', { body: JSON.stringify(renderedFonts), contentType: 'application/json' });
  await page.locator('[data-store-crate-slug="mpugio-dirty-johnny-blues-ntertia-cd"] .prose-card-link').click();
  await expect(page.locator('h1')).toHaveText('Blues & Ντέρτια');
  await expect(page.locator('h1')).toHaveCSS('font-family', /Inter/);
  await expect(page.locator('h1')).toHaveCSS('font-weight', '600');
  expect(await sentinelIntact(page)).toBe(true);
  await page.goBack();
  await waitForShell(page);
  await expect(page.getByRole('heading', { name: 'Blues & Ντέρτια', exact: true }).first()).toHaveCSS(
    'font-weight',
    '600',
  );
  expect(await sentinelIntact(page)).toBe(true);
});

test('phone Store keeps Distro formats in the one Filter sheet and selects one @phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('store/distro/');
  await waitForShell(page);
  // The search control renders once the Distro enhancement is connected.
  await expect(page.locator('[data-distro-search] input')).toBeVisible();
  await expect(page.locator('[data-store-search-toolbar]')).toHaveAttribute('data-store-search-ready', '');
  // Search and Filter share the phone row; the desktop menus stay out of it.
  const filter = page.getByRole('button', { name: /^Filter/ });
  const search = page.getByRole('searchbox', { name: 'Search Store' });
  const [filterBox, searchBox] = await Promise.all([filter.boundingBox(), search.boundingBox()]);
  expect(Math.round(filterBox!.y)).toBe(Math.round(searchBox!.y));
  expect(filterBox!.height).toBeGreaterThanOrEqual(44);
  await expect(page.locator('[data-store-formats-trigger]')).toBeHidden();
  await expect(page.locator('[data-store-artists-trigger]')).toBeHidden();

  await filter.click();
  const sheet = page.getByRole('dialog', { name: 'Filter' });
  await expect(sheet).toBeVisible();
  const formats = sheet.getByRole('navigation', { name: 'Browse Distro formats' });
  const cds = formats.getByRole('link', { name: /^CDs/ });
  await expect(cds).toBeVisible();
  await expect(formats.getByRole('link', { name: /^All formats/ })).toHaveAttribute('aria-current', 'true');

  await cds.click();
  await expect(cds).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-distro-search-group]')).toHaveCount(0);
  const cards = page.locator('[data-distro-search-item]:not([data-distro-search-hidden])');
  const key = (await cds.getAttribute('href'))!.slice(1);
  expect(await cards.count()).toBeGreaterThan(0);
  expect(await cards.count()).toBe(Number(await cds.locator('span').last().innerText()));
  for (const card of await cards.all()) await expect(card).toHaveAttribute('data-distro-format-key', key);
  const artist = await cards.first().getAttribute('data-store-artist');
  await sheet
    .locator('[data-store-artist-option]')
    .filter({ hasText: `${artist} (` })
    .first()
    .getByRole('checkbox')
    .check();
  await expect(sheet.locator('[data-store-artist-selected-label]')).toHaveText('Selected · 1');
  await sheet.getByRole('button', { name: /^Show \d+ items?$/ }).click();
  await expect(sheet).toBeHidden();
  await expect(filter).toBeFocused();
  // Two applied choices: one format and one artist.
  await expect(filter).toHaveText('Filter2');
  await expect(page.locator('#store-formats-menu [data-distro-format-navigation]')).toHaveCount(1);
  await search.fill(await cards.first().locator('h2').innerText());
  await expect(cards.first()).toHaveAttribute('data-store-artist', artist!);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('[data-distro-format-link][data-distro-format-key="all"]')).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(filter).toHaveText('Filter');
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: '.codex-artifacts/e2e/distro-layouts/mobile.png' });
  await cards.first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.codex-artifacts/e2e/distro-layouts/mobile-cards.png' });
});

test('desktop Store artist filter combines several ticked artists with find and clearing', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('store/distro/');
  await waitForShell(page);
  // Desktop keeps the checklist in the toolbar's Artists menu; the phone Filter chip is hidden.
  await expect(page.locator('[data-store-search-toolbar]')).toHaveAttribute('data-store-search-ready', '');
  await expect(page.locator('[data-store-filter-trigger]')).toBeHidden();
  await page.locator('[data-store-artists-trigger]').click();
  const pane = page.getByRole('group', { name: 'Artists' });
  await expect(pane.getByRole('checkbox').first()).toBeEnabled();
  await expect(pane.getByText('All artists')).toHaveCount(0);
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
  // Clear filters announces the restored count instead of reopening a phone keyboard in the search field.
  await expect(page.locator('[data-store-search-summary]')).toBeFocused();
  const search = page.getByRole('searchbox', { name: 'Search Store' });
  await expect(search).toHaveAttribute('enterkeyhint', 'search');
  await expect(search).toHaveAttribute('autocorrect', 'off');
  await search.fill('zzz');
  await search.press('Enter');
  await expect(search).not.toBeFocused();
  await search.fill('');
  await expectNoHorizontalOverflow(page);
});

test('Distro catalog keeps its alphabetical order through format, search and Crate changes', async ({ page }) => {
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
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: '.codex-artifacts/e2e/distro-layouts/desktop.png' });
  const firstCard = cards.locator('visible=true').first();
  const formatKey = await firstCard.getAttribute('data-distro-format-key');
  const firstTitle = await firstCard.locator('h2').innerText();
  // The format links sit in the toolbar's Formats menu, which closes once a format is chosen.
  await page.locator('[data-store-formats-trigger]').click();
  await page.locator(`[data-distro-format-link][data-distro-format-key="${formatKey}"]`).click();
  await expect(page.locator('#store-formats-menu')).toBeHidden();
  await search.fill(firstTitle);
  await expect(firstCard).toBeVisible();
  expect(await cards.locator('visible=true').count()).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  const crate = page.locator('.store-crate');
  await page.getByRole('button', { name: 'Crate', exact: true }).click();
  await expect(crate).toHaveAttribute('data-store-crate', 'open');
  await search.fill('no-match-for-this-distro-catalog');
  await expect(cards.locator('visible=true')).toHaveCount(0);
  await expect(crate).toHaveAttribute('data-store-crate', 'grid');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  expect(await slugs()).toEqual(original);
  expect(await cards.locator('visible=true').count()).toBe(original.length);
  const categories = page.getByRole('navigation', { name: 'Store categories' });
  await categories.getByRole('link', { name: 'All', exact: true }).click();
  await expect(page).toHaveURL(/\/store\/$/);
  await expect(page.locator('#all-store-catalog')).toBeVisible();
  await categories.getByRole('link', { name: 'Distro', exact: true }).click();
  await expect(page).toHaveURL(/\/store\/distro\/$/);
  await expect(crate).toHaveAttribute('data-store-crate', 'grid');
  expect(await slugs()).toEqual(original);
  expect(await cards.locator('visible=true').count()).toBe(original.length);
});

test('All Store leads with BlackBox releases in catalog number order, then Distro by artist', async ({ page }) => {
  await page.goto('store/');
  await waitForShell(page);
  const cards = page.locator('#all-store-catalog [data-distro-search-item]');
  const titles = await cards.locator('h2').allInnerTexts();
  // BBR#001 Caregivers, BBR#002 Disintegration, BBR#003 Anarchotribal (catalog order, not release date).
  expect(titles.slice(0, 3)).toEqual(['Caregivers', 'Disintegration', 'Anarchotribal']);
  const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
  const distroArtists = (await cards.evaluateAll((nodes) => nodes.map((node) => node.dataset.storeArtist!))).slice(3);
  const normal = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ');
  expect(distroArtists).toEqual([...distroArtists].sort((a, b) => collator.compare(normal(a), normal(b))));
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
    await expect(page.getByRole('button', { name: 'Crate', exact: true })).toBeHidden();
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

  test('format links stay reachable through the native Formats menu without JavaScript @phone', async ({
    page,
    isMobile,
  }) => {
    test.setTimeout(180_000);
    await page.route('**/*', (route) =>
      route.request().resourceType() === 'image'
        ? route.fulfill({
            contentType: 'image/svg+xml',
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
          })
        : route.fallback(),
    );
    await page.goto('store/');
    // Phones open the same native menu from Filter until the Filter sheet is available.
    await page.locator(isMobile ? '[data-store-filter-trigger]' : '[data-store-formats-trigger]').click();
    const formats = page.getByRole('navigation', { name: 'Browse Distro formats' });
    await expect(formats).toBeVisible();
    await formats.getByRole('link', { name: /^CDs/ }).click();
    await expect(page).toHaveURL(/\/store\/distro\/#distro-group-cds$/);
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

test('a first typo query waits for the lazy fuzzy matcher', async ({ page }) => {
  await page.goto('store/distro/');
  await waitForShell(page);
  const search = page.getByRole('searchbox', { name: 'Search Store' });
  await expect(search).toBeVisible();
  const root = page.locator('[data-distro-search-root]');
  const cards = root.locator('[data-distro-search-item]');

  // A pasted typo is the first query, so the fuzzy fallback must wait for fuse.js and then search again.
  const title = (await cards.nth(1).locator('h2').innerText()).trim();
  const word = title.split(/\s+/).reduce((longest, part) => (part.length > longest.length ? part : longest), '');
  expect(word.length).toBeGreaterThanOrEqual(5);
  const typo = word.slice(0, 2) + word[3] + word[2] + word.slice(4);
  await search.fill(typo);
  await expect(root.locator('[data-distro-search-item]:visible h2', { hasText: title }).first()).toBeVisible();
  await expect(page.locator('.store-empty-results')).toBeHidden();
});

test('phone Store shows the whole first card row in the first viewport @phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('store/');
  await waitForShell(page);
  // Hidden H1, category links, then Search and Filter, with no visible header or side pane; the note follows the grid.
  await expect(page.getByRole('heading', { level: 1, name: 'All', exact: true })).toHaveClass(/sr-only/);
  const note = page.getByText(/^Shipping calculated in your cart/);
  await expect(note).toBeVisible();
  const first = page.locator('.store-item-card--listing').first();
  const box = (await first.boundingBox())!;
  expect((await note.boundingBox())!.y).toBeGreaterThan(box.y + box.height);
  // Measured 243 with the purchase note below the grid (298 with it above, 674 before): the first row fits.
  expect(box.y).toBeLessThan(260);
  expect((await first.locator('h2').boundingBox())!.y).toBeLessThan(844);
});
