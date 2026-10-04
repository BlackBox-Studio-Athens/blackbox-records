import { expect, localRepresentativePaths, test, waitForIsland, waitForShell } from './fixtures';

const isPreparedFixture =
  process.env.CMS_CONTENT_SOURCE === 'snapshot' &&
  process.env.CMS_CONTENT_SHA256 === '17f34bc80cf4e5e8809b593f8390194ccc774eb2a4c9ce00a033a017d83f4106';
const isFileInput = !process.env.CMS_CONTENT_SOURCE || process.env.CMS_CONTENT_SOURCE === 'files';

for (const width of [1440, 390]) {
  for (const [albumState, referenceDate, released] of [
    ['unreleased', '2026-06-08T12:00:00Z', false],
    ['released', '2026-10-03T12:00:00Z', true],
    ['release-day', '2026-06-09T00:15:00Z', true],
  ] as const) {
    test(`Store Item ${albumState} album preorder facts and cart at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.clock.setFixedTime(new Date(referenceDate));
      const storeItemSlug = localRepresentativePaths.storeItem.split('/').filter(Boolean).pop()!;
      await page.route(`**/api/store/items/${storeItemSlug}`, (route) =>
        route.fulfill({
          json: {
            storeItemSlug,
            variantId: `${storeItemSlug}_standard`,
            availability: { label: 'In stock', status: 'available' },
            canCheckout: true,
            catalogStatus: 'ready',
            price: { kind: 'fixed', amountMinor: 2800, currencyCode: 'EUR', display: '€28.00' },
            preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
          },
        }),
      );
      await page.goto(localRepresentativePaths.storeItem.replace(/^\//, ''));
      await waitForShell(page);
      await waitForIsland(page, 'StoreOfferPriceDisplay');
      await waitForIsland(page, 'StoreItemPurchaseActions');

      const purchase = page.locator('[data-store-purchase-group]');
      const facts = purchase.locator('.preorder-facts');
      await expect(facts).toBeVisible();
      await expect(facts.locator('dt')).toHaveText([
        released ? 'Album' : 'Release date',
        'Vinyl expected to ship',
        'Payment',
      ]);
      await expect(facts.locator('dd')).toHaveText([
        released ? 'Out now, released 9 Jun 2026' : '9 Jun 2026',
        'Around October 2026',
        'Charged in full today',
      ]);
      await expect(
        purchase.getByText(
          released
            ? 'The album is out. We send the vinyl when the copies arrive. If the estimate changes we email you.'
            : 'We send it when the copies arrive. If the estimate changes we email you.',
        ),
      ).toBeVisible();
      await expect(purchase.locator('.preorder-badge')).toHaveText('Pre-order');
      await expect(purchase.locator('.store-item-card__release-status')).toHaveCount(released ? 1 : 0);
      await expect(purchase.locator('[data-music-streaming-service-embedded-player-trigger]')).toBeVisible();

      if (isPreparedFixture) {
        const partners = purchase.locator('[data-store-item-partner-links]');
        await expect(partners).toBeVisible();
        await expect(partners).toHaveText(
          'Outside Greece? Order Disintegration from Fixture Partner One ↗ or Fixture Partner Two ↗',
        );
        const partnerLinks = partners.getByRole('link');
        await expect(partnerLinks).toHaveText(['Fixture Partner One ↗', 'Fixture Partner Two ↗']);
        for (const [index, url] of [
          'https://partner-one.example.invalid/disintegration/',
          'https://partner-two.example.invalid/disintegration/',
        ].entries()) {
          await expect(partnerLinks.nth(index)).toHaveAttribute('href', url);
          await expect(partnerLinks.nth(index)).toHaveAttribute('target', '_blank');
          await expect(partnerLinks.nth(index)).toHaveAttribute('rel', 'noopener noreferrer');
        }

        const singles = page.getByRole('region', { name: 'Singles', exact: true });
        await expect(singles.getByRole('heading', { name: 'Singles', exact: true })).toBeVisible();
        await expect(singles.getByRole('listitem').locator('span.text-sm')).toHaveText([
          'Fixture Single One',
          'Fixture Single Two',
        ]);
        const singleLinks = singles.getByRole('link');
        await expect(singleLinks).toHaveText(['Listen ↗', 'Listen ↗']);
        for (const [index, url] of [
          'https://listen.example.invalid/disintegration/one/',
          'https://listen.example.invalid/disintegration/two/',
        ].entries()) {
          await expect(singleLinks.nth(index)).toHaveAttribute('href', url);
          await expect(singleLinks.nth(index)).toHaveAttribute('target', '_blank');
          await expect(singleLinks.nth(index)).toHaveAttribute('rel', 'noopener noreferrer');
        }
      } else if (isFileInput) {
        // The committed file input has no editorial partners or singles on this Release.
        await expect(page.locator('[data-store-item-partner-links]')).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Singles', exact: true })).toHaveCount(0);
      } else {
        for (const link of await page
          .locator('[data-store-item-partner-links] a, [data-content-path="singles"] a')
          .all()) {
          await expect(link).toHaveAttribute('href', /^https:\/\//);
          await expect(link).toHaveAttribute('target', '_blank');
          await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        }
      }
      const preorder = purchase.getByRole('button', { name: 'Pre-order', exact: true });
      await expect(preorder).toBeVisible();
      await expect(preorder).toHaveClass(/preorder-action/);
      await preorder.scrollIntoViewIfNeeded();
      const bounds = await preorder.boundingBox();
      expect(bounds?.height).toBeGreaterThanOrEqual(44);
      if (width === 1440) expect(bounds?.width).toBe(224);
      else {
        const compositionBounds = await page.locator('.store-item-composition').boundingBox();
        expect(bounds?.width).toBe(compositionBounds?.width);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
      if (albumState !== 'release-day') {
        // Canonical Disintegration page, unchanged editorial date; only the browser clock and Worker offer are fixtures.
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: `.codex-artifacts/preorders/album-availability/album-${albumState}-${width}.png`,
          fullPage: true,
        });
      }
      await preorder.click();
      await expect(page.getByRole('dialog', { name: 'Cart', exact: true })).toBeVisible();
      await expect(purchase.locator('[data-store-item-add-to-cart]')).toHaveText('Added');
      await page
        .getByRole('dialog', { name: 'Cart', exact: true })
        .getByRole('button', { name: 'Continue Shopping', exact: true })
        .click();
      await expect(page.locator('[data-store-cart-trigger]').first()).toHaveAccessibleName('Cart, 1 item');
    });
  }
}

test('Store Item respects the Release optional partners and Singles', async ({ page }) => {
  await page.goto('store/caregivers-vinyl/');
  await waitForShell(page);
  await expect(page.getByRole('heading', { name: 'Caregivers', exact: true })).toBeVisible();
  if (isFileInput || isPreparedFixture) {
    await expect(page.locator('[data-store-item-partner-links]')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Singles', exact: true })).toHaveCount(0);
  } else {
    for (const link of await page.locator('[data-store-item-partner-links] a, [data-content-path="singles"] a').all()) {
      await expect(link).toHaveAttribute('href', /^https:\/\//);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  }
});
