import type { Page } from '@playwright/test';

import { expect, expectNoHorizontalOverflow, test, waitForIsland, waitForShell } from './fixtures';

// A local stand-in for BOX NOW's public map frame: it posts the same eight-field selection message the real
// widget sends (captured on 6 November 2026), so the run stays off the network.
const stubMap = `<!doctype html><meta charset="utf-8"><title>BOX NOW stub</title>
<body style="margin:0;padding:16px;font:14px sans-serif;background:#f4f4f4;color:#111">
<p>Stub BOX NOW map</p>
<button id="pick" type="button">Select locker 7721</button>
<script>
document.getElementById('pick').addEventListener('click', () => parent.postMessage({
  boxnowLockerId: '7721', boxnowLockerLat: '37.98454721', boxnowLockerLng: '23.73216353',
  boxnowLockerName: 'BOX NOW STORE - Ακαδημίας 86 (Αθήνα)', boxnowLockerPostalCode: '10672',
  boxnowLockerAddressLine1: 'Ακαδημίας 86', boxnowLockerAddressLine2: 'Αθήνα', boxnowCountry: 'GR'
}, '*'));
</script>`;

const lockerName = 'BOX NOW STORE - Ακαδημίας 86 (Αθήνα)';

async function openCheckout(page: Page, map: 'stub' | 'hang') {
  await page.addInitScript(() => {
    localStorage.setItem(
      'blackbox.storeCart.v2',
      JSON.stringify({
        lines: [
          {
            availabilityLabel: 'Available',
            image: null,
            imageAlt: null,
            optionLabel: 'Vinyl',
            priceAmountMinor: 2000,
            priceCurrencyCode: 'EUR',
            priceDisplay: '€20.00',
            priceKind: 'fixed',
            quantity: 1,
            storeItemSlug: 'caregivers-vinyl',
            subtitle: 'Chronoboros',
            title: 'Caregivers',
            variantId: 'caregivers-vinyl_standard',
          },
        ],
      }),
    );
  });
  await page.route('**/api/store/capabilities', (route) =>
    route.fulfill({
      json: {
        pricing: {
          vatDisclosure: 'VAT included',
          deliveryQuantityBands: [{ maxUnits: null, amountMinor: 300 }],
          currencyCode: 'EUR',
        },
        nativeCheckout: { enabled: true, unavailableReason: null },
      },
    }),
  );
  await page.route('**/api/store/delivery-quote', (route) =>
    route.fulfill({
      json: {
        quote: {
          tier: 'small',
          amountMinor: 300,
          currencyCode: 'EUR',
          merchandiseGrossMinor: 2000,
          totalAmountMinor: 2300,
        },
      },
    }),
  );
  const startBodies: Record<string, unknown>[] = [];
  await page.route('**/api/checkout/sessions', (route) => {
    startBodies.push(route.request().postDataJSON());
    // An empty URL keeps the page here: checkout reports it cannot open Stripe instead of navigating away.
    return route.fulfill({ json: { checkoutSessionId: 'cs_test_locker', checkoutUrl: '' } });
  });
  const boxNowRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).hostname.endsWith('boxnow.gr')) boxNowRequests.push(request.url());
  });
  await page.route('https://widget-v5.boxnow.gr/**', (route) =>
    map === 'stub' ? route.fulfill({ contentType: 'text/html; charset=utf-8', body: stubMap }) : undefined,
  );

  await page.goto('store/checkout/');
  await waitForShell(page);
  await waitForIsland(page, 'CheckoutOrderSummary');
  await waitForIsland(page, 'CheckoutOfferStatus');
  const panel = page.locator('[data-checkout-locker-panel]');
  const payment = page.locator('[data-checkout-offer-status]');
  return {
    boxNowRequests,
    panel,
    pay: payment.getByRole('button', { name: 'Continue to Payment', exact: true }),
    payment,
    startBodies,
  };
}

for (const width of [390, 1440]) {
  test(`shopper chooses a BOX NOW locker before payment at ${width}px${width < 768 ? ' @phone' : ''}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    const { boxNowRequests, panel, pay, payment, startBodies } = await openCheckout(page, 'stub');

    await expect(panel.getByRole('heading', { name: 'BOX NOW locker' })).toBeVisible();
    await expect(panel).toContainText('Choose the locker where you collect the parcel.');
    await expect(pay).toBeDisabled();
    await expect(payment).toContainText('Choose a locker above to continue.');
    await expect(page.locator('[data-checkout-delivery-to]')).toHaveCount(0);
    expect(boxNowRequests, 'no BOX NOW request before the tap').toEqual([]);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`locker-empty-${width}.png`), fullPage: true });

    await panel.getByRole('button', { name: 'Find a locker' }).click();
    const frame = page.frameLocator('[data-boxnow-map] iframe');
    await expect(frame.getByText('Stub BOX NOW map')).toBeVisible();
    expect(boxNowRequests.some((url) => url.startsWith('https://widget-v5.boxnow.gr/iframe.html?'))).toBe(true);
    expect(new URL(boxNowRequests[0]!).searchParams.get('partnerId')).toBe('0');
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`locker-map-open-${width}.png`), fullPage: true });

    // A message from the page itself is not BOX NOW's and must be ignored.
    await page.evaluate(() =>
      window.postMessage({ boxnowLockerId: '9999', boxnowLockerName: 'Forged locker', boxnowCountry: 'GR' }, '*'),
    );
    await frame.getByRole('button', { name: 'Select locker 7721' }).click();

    await expect(panel).toContainText(lockerName);
    await expect(panel).toContainText('Ακαδημίας 86, Αθήνα 10672');
    await expect(panel).toContainText('Locker 7721');
    await expect(panel).not.toContainText('Forged locker');
    await expect(panel.getByRole('button', { name: 'Change locker' })).toBeFocused();
    await expect(page.locator('[data-checkout-delivery-to]')).toContainText(lockerName);
    await expect(pay).toBeEnabled();
    await expect(payment).not.toContainText('Choose a locker above to continue.');
    await expect(payment).toContainText('Delivery is to the locker above.');
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`locker-chosen-${width}.png`), fullPage: true });

    await pay.click();
    await expect.poll(() => startBodies.length).toBe(1);
    expect(startBodies[0]).toMatchObject({
      shippingLocker: {
        lockerId: '7721',
        name: lockerName,
        addressLine: 'Ακαδημίας 86, Αθήνα',
        postalCode: '10672',
        countryCode: 'GR',
      },
    });
    expect(startBodies[0]).not.toHaveProperty('lockerFallback');

    // The device remembers the locker, so a returning shopper reuses it without opening the map.
    await page.reload();
    await waitForIsland(page, 'CheckoutOfferStatus');
    await expect(panel).toContainText('Last used on this device');
    const requestsBefore = boxNowRequests.length;
    await panel.getByRole('button', { name: 'Use this locker' }).click();
    await expect(panel).toContainText('Locker 7721');
    await expect(pay).toBeEnabled();
    expect(boxNowRequests.length).toBe(requestsBefore);
  });
}

test('shopper can continue without a locker from a broken map @phone', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { panel, pay, startBodies } = await openCheckout(page, 'stub');
  await panel.getByRole('button', { name: 'Find a locker' }).click();
  await panel.getByRole('button', { name: 'Map not loading? Continue without a locker' }).click();
  await expect(panel).toContainText('Map unavailable');
  await expect(panel).toContainText('we email you to agree a locker before we ship');
  await expect(panel.getByRole('button', { name: 'Try the map again' })).toBeFocused();
  await expect(pay).toBeEnabled();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('locker-unavailable-390.png'), fullPage: true });
  await pay.click();
  await expect.poll(() => startBodies.length).toBe(1);
  expect(startBodies[0]).toMatchObject({ lockerFallback: true });
  expect(startBodies[0]).not.toHaveProperty('shippingLocker');
});

test('a pick on the Delivery & returns finder changes nothing in checkout', async ({ page }) => {
  await page.route('https://widget-v5.boxnow.gr/**', (route) =>
    route.fulfill({ contentType: 'text/html; charset=utf-8', body: stubMap }),
  );
  await page.goto('terms/');
  await waitForShell(page);
  const finder = page.locator('[data-locker-finder]');
  await finder.scrollIntoViewIfNeeded();
  await waitForIsland(page, 'LockerFinder');
  await finder.getByRole('button', { name: 'Show the locker map' }).click();
  await page.frameLocator('[data-locker-finder] iframe').getByRole('button', { name: 'Select locker 7721' }).click();
  expect(await page.evaluate(() => localStorage.getItem('blackbox-boxnow-last-locker'))).toBeNull();

  const { panel, pay } = await openCheckout(page, 'stub');
  await expect(panel).toContainText('Choose the locker where you collect the parcel.');
  await expect(panel).not.toContainText('Last used on this device');
  await expect(pay).toBeDisabled();
});

test('checkout falls back when the map does not load within 10 seconds', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const { panel, pay } = await openCheckout(page, 'hang');
  await panel.getByRole('button', { name: 'Find a locker' }).click();
  await expect(panel).toContainText('Map unavailable', { timeout: 15_000 });
  await expect(pay).toBeEnabled();
});
