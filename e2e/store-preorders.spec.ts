import type { Locator, Page } from 'playwright/test';
import type { PublicApiComponents } from '../packages/api-client/src/public-client';
import { expect, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';

type ListingPrice = PublicApiComponents['schemas']['PublicStoreListingPrice'];

const listingProjection: ListingPrice[] = [
  {
    storeItemSlug: 'disintegration-black-vinyl-lp',
    presentationState: 'ready',
    availabilityState: 'stocked',
    displayPrice: '€28.00',
    lowStockQuantity: 3,
    preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
  },
  {
    storeItemSlug: 'caregivers-vinyl',
    presentationState: 'ready',
    availabilityState: 'sold_out',
    displayPrice: '€28.00',
    preorder: { shipEstimate: null },
  },
];

async function stubListing(page: Page, preorders = true) {
  await page.route('**/api/store/listing-prices*', (route) =>
    route.fulfill({
      json: listingProjection.map((record) => ({ ...record, preorder: preorders ? record.preorder : null })),
    }),
  );
}

// Separate visual comparison only: the retained catalog uses a legacy product mockup instead of this album cover.
async function captureAlbumCoverReference(page: Page, card: Locator, name: string) {
  await page.route('**/__preorder-reference-cover.jpg', (route) =>
    route.fulfill({
      path: 'apps/web/src/content/releases/656856327_18427527979186423_8617747121554203403_n.jpg',
      contentType: 'image/jpeg',
    }),
  );
  await card.locator('.store-item-card__image').evaluate(async (element) => {
    const image = element as HTMLImageElement;
    image.removeAttribute('srcset');
    image.src = '/__preorder-reference-cover.jpg';
    await image.decode();
  });
  await card.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await card.screenshot({ path: `.codex-artifacts/preorders/followup/store-cards/${name}-cover-fixture.png` });
}

for (const [date, badge, released] of [
  ['2026-06-08T12:00:00Z', 'Pre-order · out 9 Jun 2026', false],
  ['2026-10-03T12:00:00Z', 'Pre-order · ships around October 2026', true],
] as const) {
  test(`Store pre-order badges and keyboard filter ${released ? 'after' : 'before'} release`, async ({ page }) => {
    await page.clock.setFixedTime(new Date(date));
    await stubListing(page);
    await page.goto('store/');
    await waitForShell(page);
    const toggle = page.getByRole('button', { name: 'Pre-orders 2', exact: true });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    const cards = page.locator('[data-store-search-root] [data-distro-search-item]');
    const disintegration = cards.filter({
      has: page.locator('[data-store-item-slug="disintegration-black-vinyl-lp"]'),
    });
    await expect(disintegration.locator('[data-store-listing-preorder]')).toHaveText(badge);
    await expect(disintegration.locator('[data-store-listing-price]')).toHaveText('€28.00');
    const releaseStatus = disintegration.locator('[data-store-listing-release-status]');
    if (released) await expect(releaseStatus).toBeVisible();
    else await expect(releaseStatus).toBeHidden();
    await expect(disintegration.getByText('Only 3 left', { exact: true })).toBeVisible();
    await expect(disintegration.getByRole('button', { name: 'Pre-order', exact: true })).toBeVisible();

    await toggle.focus();
    await toggle.press('Space');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(cards.locator('visible=true')).toHaveCount(2);
    await expect(page.getByRole('status').filter({ hasText: /^2 items$/ })).toBeVisible();
    const notes = page.locator('.store-preorder-notes');
    await expect(notes.locator('dt')).toHaveText(['You pay today', 'We wait for the copies', 'One parcel']);
    await expect(notes.locator('dd')).toHaveText([
      'Charged in full at order, like any other purchase.',
      'Every item states when we expect to ship. If that changes, we email you.',
      'Your whole order is sent together by BOX NOW when the pre-order arrives.',
    ]);
    const soldOut = cards.filter({ has: page.locator('[data-store-item-slug="caregivers-vinyl"]') });
    await expect(soldOut.getByText('Sold Out', { exact: true })).toBeVisible();
    await expect(soldOut.locator('[data-store-listing-preorder]')).toBeHidden();
    await expect(soldOut.getByRole('button', { name: 'Pre-order', exact: true })).toBeDisabled();
    expect((await toggle.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await disintegration.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await disintegration.screenshot({
      path: `.codex-artifacts/preorders/followup/store-cards/${released ? 'released-month' : 'unreleased'}-desktop.png`,
    });
    await captureAlbumCoverReference(page, disintegration, `${released ? 'released-month' : 'unreleased'}-desktop`);

    await toggle.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(notes).toBeHidden();
    expect(await cards.locator('visible=true').count()).toBeGreaterThan(2);
  });
}

test('phone hash entry waits for listing data and combines pre-orders with format, artist and search', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.setFixedTime(new Date('2026-10-03T12:00:00Z'));
  let releaseListing: () => void = () => undefined;
  const listingGate = new Promise<void>((resolve) => {
    releaseListing = resolve;
  });
  await page.route('**/api/store/listing-prices*', async (route) => {
    await listingGate;
    await route.fulfill({ json: listingProjection });
  });
  await page.goto('store/distro/#preorders');
  await waitForShell(page);
  const search = page.getByRole('searchbox', { name: 'Search Store' });
  await expect(search).toBeVisible();
  await expect(page.getByRole('button', { name: /^Pre-orders/ })).toHaveCount(0);
  releaseListing();
  const toggle = page.getByRole('button', { name: 'Pre-orders 2', exact: true });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const cards = page.locator('[data-distro-search-root] [data-distro-search-item]');
  await expect(cards.locator('visible=true')).toHaveCount(2);
  await expect(page.locator('.store-preorder-notes')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '.codex-artifacts/preorders/followup/store-cards/filter-390.png' });

  const selected = cards.filter({ has: page.locator('[data-store-item-slug="disintegration-black-vinyl-lp"]') });
  const format = await selected.getAttribute('data-distro-format-key');
  await page.locator(`[data-distro-format-link][data-distro-format-key="${format}"]`).click();
  const artist = await selected.getAttribute('data-store-artist');
  const picker = page.getByRole('combobox', { name: 'Artist', exact: true });
  const artistValue = await picker
    .locator('option')
    .evaluateAll(
      (options, name) => options.find((option) => option.textContent?.startsWith(`${name} (`))?.getAttribute('value'),
      artist,
    );
  expect(artistValue).toBeTruthy();
  if (!artistValue) throw new Error('Expected the pre-order artist option');
  await picker.selectOption(artistValue);
  await search.fill('Disintegration');
  await expect(cards.locator('visible=true')).toHaveCount(1);
  await expect(selected).toBeVisible();
  await search.fill('no-match-for-any-preorder');
  await expect(cards.locator('visible=true')).toHaveCount(0);
  await expect(page.getByText('No Store items match these filters.', { exact: true })).toBeVisible();
  await expect(toggle.locator('.store-preorder-filter__count')).toHaveText('2');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.store-preorder-notes')).toBeHidden();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await expect(picker).toHaveValue('');
  await expect(page.getByRole('link', { name: /^All formats/ })).toHaveAttribute('aria-current', 'true');
  expect(await cards.locator('visible=true').count()).toBeGreaterThan(2);
});

test('listing refresh changes membership at the same count and clears an active filter at zero', async ({ page }) => {
  await stubListing(page);
  await page.goto('store/#preorders');
  await waitForShell(page);
  await plantSentinel(page);
  const toggle = page.getByRole('button', { name: 'Pre-orders 2', exact: true });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const cards = page.locator('[data-store-search-root] [data-distro-search-item]');
  await page.evaluate(() => {
    const items = [...document.querySelectorAll<HTMLElement>('[data-store-search-root] [data-distro-search-item]')];
    const original = items.find((item) => item.hasAttribute('data-store-preorder'))!;
    const replacement = items.find((item) => !item.hasAttribute('data-store-preorder'))!;
    original.removeAttribute('data-store-preorder');
    replacement.setAttribute('data-store-preorder', '');
    document.dispatchEvent(new Event('blackbox:store-listing-applied'));
  });
  await expect(page.locator('[data-distro-search-item][data-store-preorder]:visible')).toHaveCount(2);
  await expect(page.locator('[data-distro-search-item]:not([data-store-preorder]):visible')).toHaveCount(0);
  await page.evaluate(() => {
    document.querySelectorAll('[data-store-preorder]').forEach((item) => item.removeAttribute('data-store-preorder'));
    document.dispatchEvent(new Event('blackbox:store-listing-applied'));
  });
  await expect(toggle).toHaveCount(0);
  await expect(page.locator('.store-preorder-notes')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Clear filters', exact: true })).toHaveCount(0);
  expect(await cards.locator('visible=true').count()).toBeGreaterThan(2);
  expect(await sentinelIntact(page)).toBe(true);
});

test('Store has no pre-orders toggle or notes when the listing projection has none', async ({ page }) => {
  await stubListing(page, false);
  await page.goto('store/#preorders');
  await waitForShell(page);
  await expect(page.getByRole('searchbox', { name: 'Search Store' })).toBeVisible();
  await expect(page.locator('[data-store-listing-price]').first()).not.toHaveAttribute(
    'data-store-listing-price-state',
    'loading',
  );
  await expect(page.getByRole('button', { name: /^Pre-orders/ })).toHaveCount(0);
  await expect(page.locator('.store-preorder-notes')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Clear filters', exact: true })).toHaveCount(0);
  expect(await page.locator('[data-distro-search-item]:visible').count()).toBeGreaterThan(2);
});

for (const state of [
  {
    name: 'month',
    availabilityState: 'stocked',
    preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
    badge: 'Pre-order · ships around October 2026',
  },
  {
    name: 'exact',
    availabilityState: 'stocked',
    preorder: { shipEstimate: { kind: 'date', date: '2026-10-20' } },
    badge: 'Pre-order · ships 20 Oct 2026',
  },
  { name: 'unknown', availabilityState: 'stocked', preorder: { shipEstimate: null }, badge: 'Pre-order' },
  { name: 'ended', availabilityState: 'stocked', preorder: null, badge: null },
  { name: 'sold-out', availabilityState: 'sold_out', preorder: { shipEstimate: null }, badge: null },
  { name: 'out-of-stock', availabilityState: 'out_of_stock', preorder: { shipEstimate: null }, badge: null },
] as const) {
  test(`Store lifecycle card reference ${state.name}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-03T12:00:00Z'));
    await page.route('**/api/store/listing-prices*', (route) =>
      route.fulfill({
        json: [
          {
            storeItemSlug: 'disintegration-black-vinyl-lp',
            presentationState: 'ready',
            displayPrice: '€28.00',
            availabilityState: state.availabilityState,
            preorder: state.preorder,
          } satisfies ListingPrice,
        ],
      }),
    );
    await page.goto('store/distro/');
    await waitForShell(page);
    await page.evaluate(() => document.fonts.ready);
    const card = page.getByRole('group', { name: 'Disintegration by Afterwise', exact: true }).first();
    await expect(card.getByText('New release', { exact: true })).toHaveCount(0);
    const action = card.locator('[data-store-card-buy]');
    await expect(action).toHaveText(state.preorder ? 'Pre-order' : 'Buy');
    if (state.availabilityState === 'stocked') await expect(action).toBeEnabled();
    else await expect(action).toBeDisabled();
    if (state.badge) {
      await expect(card.locator('[data-store-listing-preorder]')).toHaveText(state.badge);
      await expect(card.locator('[data-store-listing-release-status]')).toBeVisible();
    } else {
      await expect(card.locator('[data-store-listing-preorder]')).toBeHidden();
      await expect(card.locator('[data-store-listing-release-status]')).toBeHidden();
    }
    if (state.availabilityState !== 'stocked') {
      await expect(card.locator('[data-store-listing-availability]')).toHaveText(
        state.availabilityState === 'sold_out' ? 'Sold Out' : 'Out of Stock',
      );
    }

    for (const width of [320, 390, 430, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await card.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await expect(card.locator('h2')).toHaveCSS('font-family', /Bebas Neue/);
      await expect(card.locator('h2')).toHaveCSS('text-transform', 'uppercase');
      await expect(card.locator('.store-item-card__artist')).toHaveText('Afterwise');
      await expect(card.locator('[data-store-listing-price]')).toHaveCSS('font-family', /Bebas Neue/);
      await expect(card.locator('.store-item-card__image')).toHaveCSS('object-fit', 'contain');
      const artwork = (await card.locator('.store-item-card__image-frame').boundingBox())!;
      expect(Math.abs(artwork.width - artwork.height)).toBeLessThan(1);
      const content = (await card.locator('.store-item-card__content').boundingBox())!;
      const price = (await card.locator('[data-store-listing-price]').boundingBox())!;
      const button = (await action.boundingBox())!;
      expect(button.height).toBeGreaterThanOrEqual(44);
      expect(Math.abs(price.y + price.height / 2 - button.y - button.height / 2)).toBeLessThan(1);
      const status = state.badge
        ? card.locator('[data-store-listing-preorder]')
        : state.availabilityState !== 'stocked'
          ? card.locator('[data-store-listing-availability]')
          : null;
      if (status) {
        const badge = (await status.boundingBox())!;
        expect(Math.abs(badge.x - content.x - 12)).toBeLessThan(1);
        expect(badge.y).toBeLessThan(button.y);
      }
      expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await card.screenshot({ path: `.codex-artifacts/preorders/followup/store-cards/${state.name}-${width}.png` });
    }
    await captureAlbumCoverReference(page, card, `${state.name}-1440`);
  });
}
