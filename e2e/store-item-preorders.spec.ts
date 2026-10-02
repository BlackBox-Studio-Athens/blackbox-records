import { expect, localRepresentativePaths, test, waitForIsland, waitForShell } from './fixtures';

const isPreparedFixture =
  process.env.CMS_CONTENT_SOURCE === 'snapshot' &&
  process.env.CMS_CONTENT_SHA256 === '17f34bc80cf4e5e8809b593f8390194ccc774eb2a4c9ce00a033a017d83f4106';
const isFileInput = !process.env.CMS_CONTENT_SOURCE || process.env.CMS_CONTENT_SOURCE === 'files';

for (const width of [1440, 390]) {
  test(`Store Item preorder facts and cart at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
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
    await expect(facts.locator('dt')).toHaveText(['Release', 'Expected to ship', 'Payment']);
    await expect(facts.locator('dd')).toHaveText([
      'Out now, released 9 Jun 2026',
      'Around October 2026',
      'Charged in full today',
    ]);
    await expect(
      purchase.getByText('We send it when the copies arrive. If the estimate changes we email you.'),
    ).toBeVisible();

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
    await preorder.click();
    await expect(purchase.getByRole('button', { name: 'Added', exact: true })).toBeVisible();
    await expect(page.locator('[data-store-cart-trigger]').first()).toHaveAccessibleName('Cart, 1 item');
  });
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
