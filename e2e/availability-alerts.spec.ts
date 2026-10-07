import type { Page } from 'playwright/test';
import { expect, localRepresentativePaths, test, waitForIsland, waitForShell } from './fixtures';

const storeItemSlug = localRepresentativePaths.storeItem.split('/').filter(Boolean).pop()!;
const alertPath = `/api/store/items/${storeItemSlug}/availability-alerts`;

function zeroStockOffer(state: 'coming_soon' | 'repressing' | 'sold_out' | 'unavailable', expectedMonth?: string) {
  const notifiable = state === 'coming_soon' || state === 'repressing';
  return {
    storeItemSlug,
    variantId: `${storeItemSlug}_standard`,
    availability: {
      label: { coming_soon: 'Coming Soon', repressing: 'Repressing', sold_out: 'Sold Out', unavailable: 'Unavailable' }[
        state
      ],
      state,
      status: 'sold_out',
    },
    canCheckout: false,
    catalogStatus: 'sold_out',
    price: null,
    ...(expectedMonth ? { expectedMonth } : {}),
    links: notifiable ? [{ rel: 'availability-alert', href: alertPath }] : [],
  };
}

async function openItem(page: Page, offer: ReturnType<typeof zeroStockOffer>) {
  await page.route(`**/api/store/items/${storeItemSlug}`, (route) => route.fulfill({ json: offer }));
  await page.goto(localRepresentativePaths.storeItem.replace(/^\//, ''));
  await waitForShell(page);
  await waitForIsland(page, 'StoreItemPurchaseActions');
  return page.locator('[data-store-purchase-group]');
}

for (const width of [1440, 390]) {
  test(`Repressing item page explains the wait and takes a Notify me request at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 960 });
    const requests: unknown[] = [];
    // A provider error would log a console error the harness rejects; StoreItemPurchaseActions.test covers it.
    await page.route(`**${alertPath}`, (route) => {
      requests.push(route.request().postDataJSON());
      return route.fulfill({ json: { status: 'requested' } });
    });
    const purchase = await openItem(page, zeroStockOffer('repressing', '2027-01'));

    const status = purchase.locator('[data-store-item-purchase-status]');
    await expect(status).toHaveText('Repressing');
    await expect(status).toHaveAttribute('data-store-item-purchase-tone', 'incoming');
    await expect(status).toHaveCSS('border-top-style', 'dashed');
    const icon = (await status.locator('svg').boundingBox())!;
    expect(icon.width).toBeLessThanOrEqual(14.5);
    await expect(purchase.locator('[data-store-item-availability-note]')).toHaveText(
      'More copies being pressed · Expected January 2027',
    );

    const trigger = purchase.getByRole('button', { name: 'Email me when it lands', exact: true });
    await expect(trigger).toBeVisible();
    expect((await trigger.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await trigger.click();
    const form = purchase.getByRole('form', { name: 'Notify me' });
    const email = form.getByLabel('Email', { exact: true });
    const consent = form.getByRole('checkbox', { name: 'Email me once when this can be bought or pre-ordered.' });
    await expect(email).toBeFocused();
    await expect(consent).not.toBeChecked();
    expect((await email.boundingBox())!.height).toBeGreaterThanOrEqual(44);

    await form.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(form.getByText('Enter a valid email.', { exact: true })).toBeVisible();
    await expect(form.getByText('Tick the box so we can email you.', { exact: true })).toBeVisible();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(consent).toHaveAttribute('aria-invalid', 'true');
    expect(requests).toHaveLength(0);

    await email.press('Escape');
    await expect(form).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.press('Enter');
    await email.fill('listener@example.com');
    await consent.check();
    await form.getByRole('button', { name: 'Send', exact: true }).click();
    const done = purchase.locator('[data-availability-alert-done]');
    await expect(done).toHaveText("✓ We'll email you once when it can be ordered.");
    await expect(done).toHaveAttribute('role', 'status');
    await expect(done).toBeFocused();
    expect(requests).toEqual([{ email: 'listener@example.com', consent: true }]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await purchase
      .locator('[data-store-item-availability]')
      .screenshot({ path: `.codex-artifacts/availability/repressing-notified-${width}.png` });
  });
}

test('Coming Soon item page shows its first-pressing line and expected month', async ({ page }) => {
  const purchase = await openItem(page, zeroStockOffer('coming_soon', '2026-11'));
  await expect(purchase.locator('[data-store-item-purchase-status]')).toHaveText('Coming Soon');
  await expect(purchase.locator('[data-store-item-availability-note]')).toHaveText(
    'First pressing on its way · Expected November 2026',
  );
  await expect(purchase.getByRole('button', { name: 'Email me when it lands', exact: true })).toBeVisible();
});

test('Sold Out item page keeps the solid Store Blood status with no line or Notify me', async ({ page }) => {
  const purchase = await openItem(page, zeroStockOffer('sold_out'));
  const status = purchase.locator('[data-store-item-purchase-status]');
  await expect(status).toHaveText('Sold Out');
  await expect(status).toHaveCSS('border-top-style', 'solid');
  await expect(status.locator('svg')).toHaveCount(0);
  await expect(purchase.locator('[data-store-item-availability-note]')).toHaveCount(0);
  await expect(purchase.getByRole('button', { name: 'Email me when it lands' })).toHaveCount(0);
});

test('a paused item shows no status and no Notify me', async ({ page }) => {
  const purchase = await openItem(page, zeroStockOffer('unavailable'));
  await expect(purchase.locator('[data-store-item-purchase-status]')).toHaveCount(0);
  await expect(purchase.getByRole('button', { name: 'Email me when it lands' })).toHaveCount(0);
  await expect(purchase).not.toContainText(/Unavailable|Out of Stock/);
});
