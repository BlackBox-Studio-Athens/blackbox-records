import type { Locator, Page } from 'playwright/test';

import { expect, expectNoHorizontalOverflow, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';

/** Every listed Store Item priced and stocked, so the item in hand shows its price and Buy. */
async function stockEverything(page: Page, route: string) {
  const html = await (await page.request.get(route)).text();
  const slugs = [...new Set([...html.matchAll(/data-store-item-slug="([^"]+)"/g)].map((match) => match[1]!))];
  await page.route(/\/api\/store\/listing-prices(?:\?.*)?$/, (request) =>
    request.fulfill({
      json: slugs.map((storeItemSlug) => ({
        storeItemSlug,
        presentationState: 'ready',
        availabilityState: 'stocked',
        displayPrice: '€28.00',
        preorder: null,
      })),
    }),
  );
}

function crateOf(page: Page) {
  const root = page.locator('.store-crate');
  return {
    root,
    stage: root.locator('[data-store-crate-stage]'),
    counter: root.locator('[data-store-crate-counter]'),
    hand: page.locator('[data-store-crate-hand]'),
    open: page.getByRole('button', { name: /^Crate/ }),
    grid: page.getByRole('button', { name: 'Grid', exact: true }),
  };
}

async function openCrate(page: Page, press: (locator: Locator) => Promise<void> = (locator) => locator.click()) {
  const crate = crateOf(page);
  await expect(crate.root).toHaveAttribute('data-store-crate-ready', '');
  await press(crate.open);
  await expect(crate.root).toHaveAttribute('data-store-crate', 'open');
  await expect(crate.root).toHaveAttribute('data-store-crate-settled', '');
  return crate;
}

const slotOf = async (counter: Locator) => Number((await counter.innerText()).trim().split(/\s*\/\s*/)[0]);

async function wheelWithoutPageScroll(page: Page, deltaX: number, deltaY: number) {
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(deltaX, deltaY);
  const positions = await page.evaluate(async () => {
    const seen = [window.scrollY];
    const started = performance.now();
    while (performance.now() - started < 500) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      seen.push(window.scrollY);
    }
    return seen;
  });
  return Math.max(...positions.map((position) => Math.abs(position - before)));
}

test.describe('Store Crate on desktop', () => {
  test.skip(({ hasTouch }) => hasTouch, 'Desktop Crate cases run in the desktop projects.');

  // The Crate's CSS is linked only on Store pages, so a Store page reached through the shell must link it itself.
  test('is styled when Distro is reached through the shell from a page without Store CSS', async ({ page }) => {
    await page.goto('releases/');
    await waitForShell(page);
    await plantSentinel(page);
    await page.locator('header').getByRole('link', { name: 'Store', exact: true }).first().click();
    await page.getByRole('link', { name: 'Distro', exact: true }).first().click();
    await expect(page).toHaveURL(/\/store\/distro\/$/);
    expect(await sentinelIntact(page)).toBe(true);
    await expect(page.locator('.store-crate-bar')).toHaveCSS('position', 'sticky');
    const crate = await openCrate(page);
    await expect(crate.stage).toHaveCSS('overflow', 'hidden');
  });

  for (const width of [1280, 1440]) {
    test(`Distro opens the bin of the first card on screen with its own card beside it at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await stockEverything(page, 'store/distro/');
      await page.goto('store/distro/');
      await waitForShell(page);
      const first = page.locator('.store-item-card--listing').first();
      const firstTitle = (await first.locator('h2').innerText()).trim();
      const crate = await openCrate(page);

      // The first card on screen is the item in hand, shown as its own Store card with price and Buy.
      await expect(crate.hand.locator('h2')).toHaveText(firstTitle);
      await expect(crate.hand.locator('.store-item-card__price')).toContainText('€28.00');
      await expect(crate.hand.locator('[data-store-card-buy]')).toBeVisible();
      await expect(page.locator('.store-item-card--listing:visible')).toHaveCount(1);

      // Only the drawn window loads artwork, and every sleeve reuses one of its card's own image candidates.
      const sleeves = await page.evaluate(() => {
        const cards = [...document.querySelectorAll<HTMLElement>('.store-item-card--listing')];
        const candidates = new Set(
          cards.flatMap((card) => {
            const image = card.querySelector<HTMLImageElement>('img.store-item-card__image');
            return image
              ? [image.currentSrc, ...image.srcset.split(',').map((part) => part.trim().split(' ')[0]!)]
              : [];
          }),
        );
        const sources = [...document.querySelectorAll<HTMLImageElement>('.store-crate-art')]
          .map((image) => image.currentSrc || image.getAttribute('src'))
          .filter((source): source is string => Boolean(source));
        return {
          loaded: sources.length,
          foreign: sources.filter(
            (source) => ![...candidates].some((candidate) => source.endsWith(candidate) || candidate.endsWith(source)),
          ),
        };
      });
      expect(sleeves.loaded).toBeGreaterThan(0);
      expect(sleeves.loaded).toBeLessThanOrEqual(12);
      expect(sleeves.foreign).toEqual([]);
      await expectNoHorizontalOverflow(page);
    });
  }

  test('one drag, flick, wheel notch or key turns one sleeve and vertical wheel scrolls the page', async ({ page }) => {
    await page.goto('store/distro/');
    await waitForShell(page);
    const crate = await openCrate(page);
    const box = (await crate.stage.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height * 0.45;

    // A long, fast mouse drag drops the front sleeve onto the pile and turns nothing more.
    const start = await slotOf(crate.counter);
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let step = 1; step <= 12; step += 1) await page.mouse.move(x, y + step * 30);
    await page.mouse.up();
    await expect.poll(() => slotOf(crate.counter)).toBe(start + 1);
    await expect(crate.root).toHaveAttribute('data-store-crate-settled', '');

    // A short drag before the tipping point leans back.
    await page.waitForTimeout(400);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 8);
    await page.waitForTimeout(200);
    await page.mouse.up();
    await page.waitForTimeout(600);
    expect(await slotOf(crate.counter)).toBe(start + 1);

    // A sideways wheel notch turns one sleeve without moving the page; a vertical one scrolls the page.
    await page.mouse.move(x, y);
    expect(await wheelWithoutPageScroll(page, 120, 0)).toBeLessThanOrEqual(1);
    await expect.poll(() => slotOf(crate.counter)).toBe(start + 2);
    const scrolled = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 200);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrolled + 1);
    expect(await slotOf(crate.counter)).toBe(start + 2);

    // Keys dig like hands: one sleeve per arrow, Home to the start, a letter to its artists.
    await crate.stage.focus();
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => slotOf(crate.counter)).toBe(start + 1);
    await page.keyboard.press('Home');
    await expect.poll(() => slotOf(crate.counter)).toBe(1);
  });

  test('bins remember their place, the Grid round trip returns to the item, and formats without a bin use the Grid', async ({
    page,
  }) => {
    await page.goto('store/distro/');
    await waitForShell(page);
    const crate = await openCrate(page);
    const formats = page.getByRole('navigation', { name: 'Browse Distro formats' });
    await formats.getByRole('link', { name: /Vinyl 12-inch/ }).click();
    await expect(crate.counter).toContainText('/ 52');
    await page.getByRole('button', { name: /^Flip .* forward$/ }).click();
    await page.getByRole('button', { name: /^Flip .* forward$/ }).click();
    await expect.poll(() => slotOf(crate.counter)).toBe(3);
    const third = (await crate.hand.locator('h2').innerText()).trim();

    await formats.getByRole('link', { name: /^CDs/ }).click();
    await expect(crate.counter).toContainText('/ 39');
    await formats.getByRole('link', { name: /Vinyl 12-inch/ }).click();
    await expect.poll(() => slotOf(crate.counter)).toBe(3);

    // Crate, Grid and Crate again returns to the same record.
    await crate.grid.click();
    await expect(crate.root).toHaveAttribute('data-store-crate', 'grid');
    await expect(page.locator('.store-item-card--listing:visible h2', { hasText: third }).first()).toBeVisible();
    await openCrate(page);
    await expect(crate.hand.locator('h2')).toHaveText(third);

    // Vinyl 7-inch has no bin: the Grid shows it and the switch hides.
    await formats.getByRole('link', { name: /Vinyl 7-inch/ }).click();
    await expect(crate.root).toHaveAttribute('data-store-crate', 'grid');
    await expect(crate.root).toHaveAttribute('data-store-crate-switch', 'off');
    await formats.getByRole('link', { name: /Tapes/ }).click();
    await expect(crate.root).toHaveAttribute('data-store-crate-switch', 'off');
    await formats.getByRole('link', { name: /All formats/ }).click();
    await expect(crate.root).toHaveAttribute('data-store-crate-switch', 'on');

    // Search always uses the Grid.
    await openCrate(page);
    await page.getByRole('searchbox', { name: 'Search Store' }).fill('no-match-for-this-distro-catalog');
    await expect(crate.root).toHaveAttribute('data-store-crate', 'grid');
    await expect(crate.root).toHaveAttribute('data-store-crate-switch', 'off');
  });

  test('the back board ends a bin and Back to the start returns through it', async ({ page }) => {
    await page.goto('store/distro/');
    await waitForShell(page);
    const crate = await openCrate(page);
    await crate.stage.focus();
    await page.keyboard.press('End');
    await expect(crate.counter).toContainText(/(\d+) \/ \1/);
    await crate.root.locator('[data-store-crate-nav] [data-store-crate-next]').click();
    const end = crate.root.locator('[data-store-crate-end]');
    await expect(end).toBeVisible();
    await expect(end.locator('h3')).toHaveText(/^End of the (crate|CD bin)$/);
    await expect(crate.hand).toHaveCount(0);
    await end.getByRole('button', { name: 'Back to the start' }).click();
    await expect.poll(() => slotOf(crate.counter)).toBe(1);
    await expect(crate.hand).toHaveCount(1);
  });

  test('Back from an item page reopens the Crate at the same sleeve, still', async ({ page }) => {
    await page.goto('store/distro/');
    await waitForShell(page);
    const crate = await openCrate(page);
    await page.getByRole('button', { name: /^Flip .* forward$/ }).click();
    await expect.poll(() => slotOf(crate.counter)).toBe(2);
    const title = (await crate.hand.locator('h2').innerText()).trim();
    await crate.hand.locator('.prose-card-link').click();
    await expect(page).not.toHaveURL(/\/store\/distro\/$/);
    await page.goBack();
    await waitForShell(page);
    await expect(crate.root).toHaveAttribute('data-store-crate', 'open');
    await expect(crate.hand.locator('h2')).toHaveText(title);
    expect(await slotOf(crate.counter)).toBe(2);
  });

  test('reduced motion switches and flips without animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('store/distro/');
    await waitForShell(page);
    const crate = await openCrate(page);
    await page.getByRole('button', { name: /^Flip .* forward$/ }).click();
    const crateAnimations = () =>
      page.evaluate(
        () =>
          document.getAnimations().filter((animation) => {
            const target = (animation.effect as KeyframeEffect | null)?.target;
            return target instanceof Element && Boolean(target.closest('.store-crate'));
          }).length,
      );
    expect(await crateAnimations()).toBe(0);
    await crate.grid.click();
    await expect(crate.root).toHaveAttribute('data-store-crate', 'grid');
    expect(await crateAnimations()).toBe(0);
  });

  test('All Store walks its bins from the bin row and keeps each place', async ({ page }) => {
    await page.goto('store/');
    await waitForShell(page);
    const crate = await openCrate(page);
    const bins = page.getByRole('group', { name: 'Bins' });
    await bins.getByRole('button', { name: /Vinyl 12-inch/ }).click();
    await expect(bins.getByRole('button', { name: /Vinyl 12-inch/ })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /^Flip .* forward$/ }).click();
    await expect.poll(() => slotOf(crate.counter)).toBe(2);
    await bins.getByRole('button', { name: /CDs/ }).click();
    await bins.getByRole('button', { name: /Vinyl 12-inch/ }).click();
    await expect.poll(() => slotOf(crate.counter)).toBe(2);
  });
});

test.describe('Store Crate on phones @phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('a downward swipe on the bin flips one sleeve while the page stays put, and the page still scrolls around it', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Real touch input needs the Chromium DevTools protocol.');
    await stockEverything(page, 'store/distro/');
    await page.goto('store/distro/');
    await waitForShell(page);
    const crate = await openCrate(page, (locator) => locator.tap());
    const box = (await crate.stage.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height * 0.35;
    const before = await page.evaluate(() => window.scrollY);
    const start = await slotOf(crate.counter);

    // A real touch swipe down, frame-paced, with a still finger before release.
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let step = 1; step <= 10; step += 1) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + step * 18 }] });
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(200);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
    await expect.poll(() => slotOf(crate.counter)).toBe(start + 1);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThanOrEqual(1);

    // The item in hand's Buy is on screen with the bin, and nothing scrolls sideways.
    await expect(crate.hand.locator('[data-store-card-buy]')).toBeInViewport();
    await expectNoHorizontalOverflow(page);
  });

  test('the Crate fits a 320px phone without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('store/distro/');
    await waitForShell(page);
    await openCrate(page, (locator) => locator.tap());
    await expectNoHorizontalOverflow(page);
  });
});
