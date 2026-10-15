import type { Page } from 'playwright/test';
import {
  expect,
  expectNoHorizontalOverflow,
  localRepresentativePaths,
  plantSentinel,
  press,
  sentinelIntact,
  test,
  waitForIsland,
  waitForShell,
} from './fixtures';

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
  test(`Repressing item page explains the wait and takes a Notify me request at ${width}px${width < 768 ? ' @phone' : ''}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 960 });
    const requests: unknown[] = [];
    // A provider error would log a console error the harness rejects; StoreItemPurchaseActions.test covers it.
    await page.route(`**${alertPath}`, (route) => {
      requests.push(route.request().postDataJSON());
      return route.fulfill({ json: { status: 'requested' } });
    });
    // The newsletter request may only follow a successful alert, and only when its own box is ticked.
    const joinNewsletter = width === 1440;
    const newsletterRequests: unknown[] = [];
    await page.route('**/api/newsletter/registrations', (route) => {
      expect(requests).toHaveLength(1);
      newsletterRequests.push(route.request().postDataJSON());
      return route.fulfill({ status: 202, json: { status: 'registered' } });
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
    const form = purchase.getByRole('form', { name: 'Email me when it lands' });
    const email = form.getByLabel('Email', { exact: true });
    const consent = form.getByRole('checkbox', { name: 'Email me once when this item can be bought or pre-ordered.' });
    const newsletter = form.getByRole('checkbox', { name: /^Optional: I agree to receive BlackBox Records/ });
    const send = form.getByRole('button', { name: 'Notify me', exact: true });
    await expect(email).toBeFocused();
    await expect(consent).not.toBeChecked();
    await expect(newsletter).not.toBeChecked();
    // One row from 40rem; on phones Notify me drops below the field.
    const [emailBox, sendBox] = [(await email.boundingBox())!, (await send.boundingBox())!];
    if (width === 1440) expect(Math.abs(sendBox.y - emailBox.y)).toBeLessThan(2);
    else expect(sendBox.y).toBeGreaterThan(emailBox.y + emailBox.height - 1);
    await purchase
      .locator('[data-store-item-availability]')
      .screenshot({ path: `.codex-artifacts/availability/repressing-open-${width}.png` });
    expect((await email.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    // 16px on phones so iOS Safari does not zoom the page into the field; desktop keeps 0.95rem.
    await expect(email).toHaveCSS('font-size', width === 390 ? '16px' : '15.2px');

    await send.click();
    // Each explanation follows its visible Error label (accent-and-button-system) and describes its control.
    const errors = form.locator('.availability-alert__error');
    await expect(errors.filter({ hasText: 'Enter a valid email.' })).toHaveText(/^Error\s*Enter a valid email\.$/);
    await expect(errors.filter({ hasText: 'Tick the box so we can email you.' })).toHaveText(
      /^Error\s*Tick the box so we can email you\.$/,
    );
    await expect(email).toHaveAccessibleDescription(/Enter a valid email\./);
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(consent).toHaveAttribute('aria-invalid', 'true');
    expect(requests).toHaveLength(0);
    // A consent-only error moves focus to the checkbox so its described error is announced.
    await email.fill('listener@example.com');
    await send.click();
    await expect(consent).toBeFocused();
    await expect(consent).toHaveAttribute('aria-describedby', /consent-error/);
    expect(requests).toHaveLength(0);

    await email.press('Escape');
    await expect(form).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.press('Enter');
    await email.fill('listener@example.com');
    await consent.check();
    if (joinNewsletter) await newsletter.check();
    await send.click();
    const done = purchase.locator('[data-availability-alert-done]');
    await expect(done).toHaveText(
      `✓ We'll email listener@example.com once it can be ordered.${joinNewsletter ? ' Check your inbox to confirm the newsletter request.' : ''}`,
    );
    await expect(done).toHaveAttribute('role', 'status');
    await expect(done).toBeFocused();
    expect(requests).toEqual([{ email: 'listener@example.com', consent: true }]);
    expect(newsletterRequests).toEqual(
      joinNewsletter
        ? [{ email: 'listener@example.com', consentAccepted: true, source: 'availability-alert-form' }]
        : [],
    );
    await expectNoHorizontalOverflow(page);
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

test('manage alerts opens preferences in a new tab and keeps the player, document and cart', async ({
  page,
  context,
  isMobile,
}) => {
  // Provider embeds are replaced by a local fixture, as in player-continuity.spec.ts.
  await page.route(/^https:\/\/(bandcamp\.com|embed\.tidal\.com)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  const cart = JSON.stringify({
    lines: [
      {
        availabilityLabel: 'In stock',
        image: null,
        imageAlt: null,
        optionLabel: 'Black Vinyl LP',
        priceAmountMinor: 2800,
        priceCurrencyCode: 'EUR',
        priceDisplay: '€28.00',
        priceKind: 'fixed',
        storeItemSlug: 'caregivers-vinyl',
        subtitle: 'BlackBox Records',
        title: 'Caregivers',
        variantId: 'caregivers-vinyl_standard',
        quantity: 1,
      },
    ],
  });
  await page.addInitScript((value) => {
    if (!localStorage.getItem('blackbox.storeCart.v2')) localStorage.setItem('blackbox.storeCart.v2', value);
  }, cart);
  const purchase = await openItem(page, zeroStockOffer('repressing'));
  await plantSentinel(page);
  const readCart = () => page.evaluate(() => localStorage.getItem('blackbox.storeCart.v2'));
  const cartBefore = await readCart();

  await press(page.locator('[data-music-streaming-service-embedded-player-trigger]').first(), isMobile);
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  await press(iframe.contentFrame().getByRole('button', { name: 'Player fixture' }), isMobile);
  await press(page.getByRole('button', { name: 'Minimize player' }), isMobile);
  const originalIframe = await iframe.elementHandle();

  await press(purchase.getByRole('button', { name: 'Email me when it lands', exact: true }), isMobile);
  const manage = purchase.getByRole('link', { name: 'manage alerts (opens in a new tab)', exact: true });
  // The visible words are unchanged; the new-tab notice is for assistive technology only.
  await expect(manage).toHaveText('manage alerts (opens in a new tab)');
  await expect(manage.locator('.sr-only')).toHaveCSS('position', 'absolute');
  await expect(manage).toHaveAttribute('target', '_blank');
  await expect(manage).toHaveAttribute('rel', 'noopener noreferrer');
  const [preferences] = await Promise.all([context.waitForEvent('page'), press(manage, isMobile)]);

  await preferences.waitForLoadState();
  await expect(preferences).toHaveURL(/\/email-preferences\/$/);
  await expect(preferences.getByRole('heading', { name: 'Request a new link' })).toBeVisible();
  // noopener: the preferences document cannot reach back into the shell.
  expect(await preferences.evaluate(() => window.opener)).toBeNull();
  await preferences.close();

  expect(await sentinelIntact(page)).toBe(true);
  expect(await originalIframe!.evaluate((element) => element.isConnected)).toBe(true);
  await expect(iframe).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Open player' })).toBeVisible();
  expect(await readCart()).toBe(cartBefore);
});
