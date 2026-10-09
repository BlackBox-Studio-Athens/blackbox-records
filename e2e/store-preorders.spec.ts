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
    // Caregivers is on pre-order but its copies ran out, so it reads like any zero-stock card and is not counted.
    const toggle = page.getByRole('button', { name: 'Pre-orders 1', exact: true });
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
    const soldOut = cards.filter({ has: page.locator('[data-store-item-slug="caregivers-vinyl"]') });
    await expect(soldOut.locator('[data-store-listing-availability]')).toHaveText('Sold Out');
    await expect(soldOut.locator('[data-store-listing-preorder]')).toBeHidden();
    await expect(soldOut.locator('[data-store-card-buy]')).toBeHidden();

    await toggle.focus();
    await toggle.press('Space');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(cards.locator('visible=true')).toHaveCount(1);
    await expect(page.getByRole('status').filter({ hasText: /^1 item$/ })).toBeVisible();
    const notes = page.locator('.store-preorder-notes');
    await expect(notes.locator('dt')).toHaveText(['You pay today', 'We wait for the copies', 'Ships together']);
    await expect(notes.locator('dd')).toHaveText([
      'Charged in full at order, like any other purchase.',
      'Every item states when we expect to ship. If that changes, we email you.',
      'Your whole order is sent together by BOX NOW when the pre-order arrives.',
    ]);
    await expect(soldOut).toBeHidden();
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
  const selectedSlug = 'adolf-plays-the-jazz-form-follows-function-cd';
  await page.route('**/api/store/listing-prices*', async (route) => {
    await listingGate;
    await route.fulfill({
      json: [
        { ...listingProjection[0]!, storeItemSlug: selectedSlug },
        {
          ...listingProjection[1]!,
          availabilityState: 'stocked',
          storeItemSlug: 'aflmsmp-i-went-to-the-mountain-vinyl',
        },
      ],
    });
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

  const selected = cards.filter({ has: page.locator(`[data-store-item-slug="${selectedSlug}"]`) });
  const format = await selected.getAttribute('data-distro-format-key');
  await page.locator(`[data-distro-format-link][data-distro-format-key="${format}"]`).click();
  const artist = await selected.getAttribute('data-store-artist');
  await page.getByRole('button', { name: /^Artists/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Artists' });
  await sheet
    .locator('[data-store-artist-option]')
    .filter({ hasText: `${artist} (` })
    .first()
    .getByRole('checkbox')
    .check();
  await sheet.getByRole('button', { name: /^Show \d+ items?$/ }).click();
  await expect(sheet).toBeHidden();
  await search.fill(await selected.locator('h2').innerText());
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
  await expect(page.getByRole('button', { name: /^Artists/ })).toHaveText('Artists');
  await expect(page.locator('input[name="store-artist"]:checked')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^All formats/ })).toHaveAttribute('aria-current', 'true');
  expect(await cards.locator('visible=true').count()).toBeGreaterThan(2);
});

test('listing refresh changes membership at the same count and clears an active filter at zero', async ({ page }) => {
  await stubListing(page);
  await page.goto('store/#preorders');
  await waitForShell(page);
  await plantSentinel(page);
  const toggle = page.getByRole('button', { name: 'Pre-orders 1', exact: true });
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
  await expect(page.locator('[data-distro-search-item][data-store-preorder]:visible')).toHaveCount(1);
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
  { name: 'sold-out', availabilityState: 'sold_out', preorder: { shipEstimate: null }, badge: null, chip: 'Sold Out' },
  {
    name: 'coming-soon',
    availabilityState: 'coming_soon',
    expectedMonth: '2026-11',
    preorder: null,
    badge: null,
    chip: 'Coming Soon · Nov 2026',
  },
  { name: 'repressing', availabilityState: 'repressing', preorder: null, badge: null, chip: 'Repressing' },
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
            ...('expectedMonth' in state ? { expectedMonth: state.expectedMonth } : {}),
            preorder: state.preorder,
          } satisfies ListingPrice,
        ],
      }),
    );
    await page.goto('store/');
    await waitForShell(page);
    await page.evaluate(() => document.fonts.ready);
    const card = page.getByRole('group', { name: 'Disintegration by Afterwise', exact: true }).first();
    await expect(card.getByText('New release', { exact: true })).toHaveCount(0);
    const action = card.locator('[data-store-card-buy]');
    const stocked = state.availabilityState === 'stocked';
    if (stocked) {
      await expect(action).toHaveText(state.preorder ? 'Pre-order' : 'Buy');
      await expect(action).toBeEnabled();
    } else await expect(action).toBeHidden();
    if (state.badge) {
      await expect(card.locator('[data-store-listing-preorder]')).toHaveText(state.badge);
      await expect(card.locator('[data-store-listing-release-status]')).toBeVisible();
    } else {
      await expect(card.locator('[data-store-listing-preorder]')).toBeHidden();
      await expect(card.locator('[data-store-listing-release-status]')).toBeHidden();
    }
    if ('chip' in state) {
      const chip = card.locator('[data-store-listing-availability]');
      await expect(chip).toHaveText(state.chip);
      await expect(chip).toHaveCSS('border-top-style', state.availabilityState === 'sold_out' ? 'solid' : 'dashed');
    }

    for (const width of [320, 390, 430, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await card.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await expect(card.locator('h2')).toHaveText('Disintegration');
      await expect(card.locator('h2')).toHaveCSS('font-family', /^Veneer,/);
      await expect(card.locator('h2')).toHaveCSS('text-transform', 'none');
      await expect(card.locator('.store-item-card__artist')).toHaveText('by Afterwise');
      await expect(card.locator('.store-item-card__artist')).toHaveCSS('font-family', /^Inter,/);
      await expect(card.locator('[data-store-listing-price]')).toHaveCSS('font-family', /Bebas Neue/);
      await expect(card.locator('.store-item-card__image')).toHaveCSS('object-fit', 'contain');
      const artwork = (await card.locator('.store-item-card__image-frame').boundingBox())!;
      expect(Math.abs(artwork.width - artwork.height)).toBeLessThan(1);
      const content = (await card.locator('.store-item-card__content').boundingBox())!;
      const price = (await card.locator('[data-store-listing-price]').boundingBox())!;
      if (stocked) {
        const button = (await action.boundingBox())!;
        expect(button.height).toBeGreaterThanOrEqual(44);
        expect(Math.abs(price.y + price.height / 2 - button.y - button.height / 2)).toBeLessThan(1);
        if (state.badge) {
          const badge = (await card.locator('[data-store-listing-preorder]').boundingBox())!;
          expect(Math.abs(badge.x - content.x - 12)).toBeLessThan(1);
          expect(badge.y).toBeLessThan(button.y);
        }
      } else {
        // A zero-stock chip sits beside the retained price, inside the card.
        const chip = (await card.locator('[data-store-listing-availability]').boundingBox())!;
        expect(chip.x + chip.width).toBeLessThanOrEqual(content.x + content.width + 1);
        expect(chip.y + chip.height).toBeGreaterThan(price.y - 1);
      }
      expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await card.screenshot({ path: `.codex-artifacts/preorders/followup/store-cards/${state.name}-${width}.png` });
    }
    await captureAlbumCoverReference(page, card, `${state.name}-1440`);
  });
}
