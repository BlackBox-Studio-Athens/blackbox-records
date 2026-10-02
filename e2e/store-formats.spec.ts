import { expect, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';

for (const route of ['store/', 'store/distro/']) {
  test(`${route} Coverflow wheel navigation keeps the page still`, async ({ page }) => {
    await page.goto(route);
    await waitForShell(page);
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
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
  const picker = page.getByRole('combobox', { name: 'Artist', exact: true });
  const artistOption = await picker
    .locator('option')
    .evaluateAll(
      (options, name) => options.find((option) => option.textContent?.startsWith(`${name} (`))!.getAttribute('value')!,
      artist,
    );
  await picker.selectOption(artistOption);
  await page.getByRole('searchbox', { name: 'Search Store' }).fill(await cards.first().locator('h2').innerText());
  await expect(cards.first()).toHaveAttribute('data-store-artist', artist!);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(formats.getByRole('link', { name: /^All formats/ })).toHaveAttribute('aria-current', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '.codex-artifacts/e2e/distro-layouts/mobile.png' });
  await cards.first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.codex-artifacts/e2e/distro-layouts/mobile-cards.png' });
});

test('mixed catalog keeps its canonical order through format, search and Coverflow changes', async ({ page }) => {
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
      promoted: node.hasAttribute('data-store-promotion'),
      artist: node.getAttribute('data-store-artist')!,
      title: node.querySelector('h2')!.textContent!,
      slug: node.querySelector('[data-store-listing-price]')!.getAttribute('data-store-item-slug')!,
    })),
  );
  expect(order.some((item) => item.promoted)).toBe(true);
  const firstOrdinary = order.findIndex((item) => !item.promoted);
  expect(order.slice(firstOrdinary).every((item) => !item.promoted)).toBe(true);
  const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
  const normal = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ');
  const alphabetical = order.slice(firstOrdinary);
  expect(alphabetical).toEqual(
    [...alphabetical].sort(
      (a, b) =>
        collator.compare(normal(a.artist), normal(b.artist)) ||
        collator.compare(a.title, b.title) ||
        a.slug.localeCompare(b.slug, 'en'),
    ),
  );
  await expect(root.locator('.store-item-card__artist-link').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '.codex-artifacts/e2e/distro-layouts/desktop.png' });
  const promoted = cards.locator('visible=true').first();
  const formatKey = await promoted.getAttribute('data-distro-format-key');
  const promotedTitle = await promoted.locator('h2').innerText();
  await page.locator(`[data-distro-format-link][data-distro-format-key="${formatKey}"]`).click();
  await search.fill(promotedTitle);
  await expect(root.locator('[data-store-promotion]:visible')).toHaveCount(1);
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

test('Distro remains complete without JavaScript including legacy fragments', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: testInfo.project.use.baseURL });
  try {
    const page = await context.newPage();
    await page.goto('store/distro/#distro-group-cds');
    const cards = page.locator('[data-distro-search-item]');
    expect(await cards.count()).toBeGreaterThan(6);
    expect(await cards.locator('visible=true').count()).toBe(await cards.count());
    await expect(page.getByRole('button', { name: 'Coverflow', exact: true })).toBeHidden();
    await expect(page.locator('.store-item-card__artist-link').first()).toBeVisible();
    await expect(page.locator('#distro-group-cds')).toHaveCount(1);
  } finally {
    await context.close();
  }
});

test('Distro shell navigation and filters preserve the playing iframe', async ({ page }) => {
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
  await expect(page).toHaveURL(/\/store\/$/);
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
