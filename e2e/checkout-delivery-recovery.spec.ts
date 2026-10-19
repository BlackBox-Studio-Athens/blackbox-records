import { test, expect } from 'playwright/test';
import { expectNoHorizontalOverflow, waitForIsland } from './fixtures';

const cart = {
  lines: [
    {
      availabilityLabel: 'In stock',
      image: null,
      imageAlt: null,
      optionLabel: 'Black Vinyl LP',
      priceAmountMinor: 2000,
      priceCurrencyCode: 'EUR',
      priceDisplay: '€20.00',
      priceKind: 'fixed',
      storeItemSlug: 'caregivers-vinyl',
      subtitle: 'Caregivers',
      title: 'Caregivers',
      variantId: 'caregivers-vinyl_standard',
      quantity: 1,
    },
  ],
};
const quote = {
  tier: 'small',
  amountMinor: 300,
  currencyCode: 'EUR',
  merchandiseGrossMinor: 2000,
  totalAmountMinor: 2300,
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((value) => localStorage.setItem('blackbox.storeCart.v2', JSON.stringify(value)), cart);
  await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://www.glancelytics.com/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: '' }),
  );
  await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: 'loc=GR\n' }));
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
  await page.route('**/api/checkout/sessions', () => {
    throw new Error('This check must never submit payment');
  });
});

for (const mobile of [false, true]) {
  test(`delivery recovery preserves the cart and consent${mobile ? ' @phone' : ''}`, async ({ page }, testInfo) => {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const requests: unknown[] = [];
    let release!: () => void;
    const retryResponse = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/api/store/delivery-quote', async (route) => {
      requests.push(route.request().postDataJSON());
      if (requests.length <= 2) {
        await route.fulfill({ status: 503, json: { error: 'Delivery quote is temporarily unavailable.' } });
      } else {
        await retryResponse;
        await route.fulfill({ json: { quote } });
      }
    });
    await page.goto('store/checkout/');
    await waitForIsland(page, 'CheckoutOfferStatus');
    const panel = page.locator('[data-checkout-offer-status]');
    const pay = panel.locator('[data-checkout-pay-state]');
    const retry = panel.getByRole('button', { name: 'Try delivery again', exact: true });
    const consent = panel.getByRole('checkbox');
    await expect(retry).toBeVisible();
    await expect(panel).toContainText('Delivery check failed');
    await expect(pay).toBeDisabled();
    await expect(panel).not.toContainText('Delivery is unavailable for this cart');
    await consent.check();
    const savedCart = await page.evaluate(() => localStorage.getItem('blackbox.storeCart.v2'));
    await retry.click();
    await expect(retry).toBeVisible();
    await expect.poll(() => requests.length).toBe(2);
    await expect(pay).toBeDisabled();
    await retry.evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
    const checking = panel.getByRole('button', { name: 'Checking delivery…', exact: true });
    await expect(checking).toBeDisabled();
    await expect(checking).toHaveAttribute('aria-busy', 'true');
    await expect.poll(() => requests.length).toBe(3);
    await expect(pay).toBeDisabled();
    await expect(consent).toBeChecked();
    await expectNoHorizontalOverflow(page);
    await checking.screenshot({ path: testInfo.outputPath('retry-pending.png') });
    release();
    await expect(pay).toBeEnabled();
    await expect(pay).toHaveAttribute('data-checkout-pay-state', 'ready');
    await expect(panel.locator('[data-delivery-summary]')).toContainText('€23.00');
    await expect(retry).toHaveCount(0);
    await expect(consent).toBeChecked();
    expect(await page.evaluate(() => localStorage.getItem('blackbox.storeCart.v2'))).toBe(savedCart);
    expect(requests).toEqual(
      Array(3).fill({
        lines: [{ storeItemSlug: cart.lines[0]!.storeItemSlug, variantId: cart.lines[0]!.variantId, quantity: 1 }],
      }),
    );
    await expectNoHorizontalOverflow(page);
    await panel.screenshot({ path: testInfo.outputPath('retry-recovered.png') });
    expect(errors).toEqual([]);
  });
}

test('an authoritative unsupported cart stays blocked without a temporary-failure retry', async ({ page }) => {
  await page.route('**/api/store/delivery-quote', (route) => route.fulfill({ json: { quote: null } }));
  await page.goto('store/checkout/');
  await waitForIsland(page, 'CheckoutOfferStatus');
  const panel = page.locator('[data-checkout-offer-status]');
  await expect(panel).toContainText('Delivery is unavailable for this cart. Please review the items.');
  await expect(panel.getByRole('button', { name: 'Try delivery again' })).toHaveCount(0);
  await expect(panel.locator('[data-checkout-pay-state]')).toBeDisabled();
});
