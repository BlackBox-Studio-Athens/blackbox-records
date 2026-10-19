import { test, expect, type Page } from 'playwright/test';
import { expectNoHorizontalOverflow, localRepresentativePaths, waitForIsland } from './fixtures';

const line = {
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
};
const quote = {
  tier: 'small',
  amountMinor: 300,
  currencyCode: 'EUR',
  merchandiseGrossMinor: 2000,
  totalAmountMinor: 2300,
};
const runtimeErrors = new WeakMap<Page, string[]>();

async function seedCart(page: Page, lines: (typeof line)[]) {
  await page.addInitScript((savedLines) => {
    localStorage.setItem('blackbox.storeCart.v2', JSON.stringify({ lines: savedLines }));
  }, lines);
}

async function holdHydration(page: Page) {
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/Checkout(?:OfferStatus|OrderSummary)[^/]*\.(?:tsx|js)(?:\?.*)?$/, async (route) => {
    await held;
    await route.continue();
  });
  return release;
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/hydration|did not match|server rendered HTML/i.test(message.text())) errors.push(message.text());
  });
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

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page), 'runtime and hydration errors').toEqual([]);
});

for (const mobile of [false, true]) {
  const suffix = mobile ? ' @phone' : '';

  test(`saved cart stays neutral through delayed hydration, quote failure and retry${suffix}`, async ({
    page,
  }, testInfo) => {
    await seedCart(page, [line]);
    await page.addInitScript(() => {
      const failures: string[] = [];
      Object.assign(window, { checkoutLoadingFailures: failures });
      new MutationObserver(() => {
        const panels = document.querySelectorAll('[data-checkout-offer-status], [data-checkout-order-summary]');
        for (const panel of panels) {
          const text = panel.textContent ?? '';
          if (/cart is empty|Add a priced item|Delivery (?:is )?unavailable/i.test(text)) failures.push(text);
        }
      }).observe(document, { childList: true, subtree: true, characterData: true });
    });
    const releaseScripts = await holdHydration(page);
    let releaseQuote!: () => void;
    const pendingQuote = new Promise<void>((resolve) => {
      releaseQuote = resolve;
    });
    let releaseRetry!: () => void;
    const pendingRetry = new Promise<void>((resolve) => {
      releaseRetry = resolve;
    });
    let requests = 0;
    await page.route('**/api/store/delivery-quote', async (route) => {
      requests += 1;
      if (requests === 1) {
        await pendingQuote;
        await route.fulfill({ status: 503, json: { error: 'Delivery quote is temporarily unavailable.' } });
      } else {
        await pendingRetry;
        const quantity = route.request().postDataJSON().lines[0].quantity as number;
        await route.fulfill({
          json: {
            quote: { ...quote, merchandiseGrossMinor: 2000 * quantity, totalAmountMinor: 2000 * quantity + 300 },
          },
        });
      }
    });
    await page.goto('store/checkout/', { waitUntil: 'commit' });
    const review = page.locator('[data-checkout-offer-status]');
    const summary = page.locator('[data-checkout-order-summary]');
    try {
      await expect(review).toHaveAttribute('aria-busy', 'true');
      await expect(summary.getByRole('status')).toHaveText('Loading your cart');
      await expect(summary.locator('details')).toHaveCount(0);
      await expect(review.locator('[data-checkout-pay-state]')).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await page.locator('.checkout-review').screenshot({ path: testInfo.outputPath('cart-loading.png') });
    } finally {
      releaseScripts();
    }
    await waitForIsland(page, 'CheckoutOfferStatus');
    await waitForIsland(page, 'CheckoutOrderSummary');
    await expect(summary.getByRole('heading', { name: line.title, exact: true })).toBeVisible();
    const pay = review.locator('[data-checkout-pay-state]');
    await expect(pay).toBeDisabled();
    await expect(review).toContainText('Checking delivery');
    await expect.poll(() => requests).toBe(1);
    releaseQuote();
    const retry = review.getByRole('button', { name: 'Try delivery again', exact: true });
    await expect(retry).toBeVisible();
    await expect(review).toContainText('Delivery check failed');
    await expect(pay).toBeDisabled();
    await retry.click();
    await expect(review.getByRole('button', { name: 'Checking delivery…', exact: true })).toBeDisabled();
    await expect(pay).toBeDisabled();
    releaseRetry();
    await expect(pay).toBeEnabled();
    await expect(review.locator('[data-delivery-summary]')).toContainText('€23.00');
    await summary.getByText('Edit quantities', { exact: true }).click();
    await summary.getByRole('button', { name: `Increase quantity for ${line.title}`, exact: true }).click();
    await expect(review.locator('[data-delivery-summary]')).toContainText('€43.00');
    await expect(summary.locator('.checkout-summary__price')).toHaveText('€40.00');
    await expect(pay).toBeEnabled();
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('blackbox.storeCart.v2')!).lines[0].quantity),
    ).toBe(2);
    expect(
      await page.evaluate(() => (window as unknown as { checkoutLoadingFailures: string[] }).checkoutLoadingFailures),
    ).toEqual([]);
    await expectNoHorizontalOverflow(page);
    await review.screenshot({ path: testInfo.outputPath('cart-recovered.png') });
  });

  test(`genuine empty cart appears only after hydration${suffix}`, async ({ page }) => {
    await seedCart(page, []);
    const releaseScripts = await holdHydration(page);
    let requests = 0;
    await page.route('**/api/store/delivery-quote', (route) => {
      requests += 1;
      return route.fulfill({ json: { quote: null } });
    });
    await page.goto('store/checkout/', { waitUntil: 'commit' });
    const review = page.locator('[data-checkout-offer-status]');
    const summary = page.locator('[data-checkout-order-summary]');
    try {
      await expect(review).toContainText('Loading your cart');
      await expect(summary).not.toContainText('Your cart is empty');
      await expect(summary.locator('details')).toHaveCount(0);
    } finally {
      releaseScripts();
    }
    await waitForIsland(page, 'CheckoutOrderSummary');
    await expect(summary.locator('.checkout-summary__items')).toContainText('Your cart is empty');
    await expect(review).toContainText('Cart is empty');
    await expect(review).not.toContainText('Delivery unavailable');
    await expect(review.locator('[data-delivery-summary]')).toHaveCount(0);
    await expect(review.locator('[data-checkout-pay-state]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Continue Shopping', exact: true })).toBeVisible();
    expect(requests).toBe(0);
    await expectNoHorizontalOverflow(page);
  });

  test(`loaded unsupported cart remains distinct from empty and temporary failure${suffix}`, async ({ page }) => {
    await seedCart(page, [line]);
    await page.route('**/api/store/delivery-quote', (route) => route.fulfill({ json: { quote: null } }));
    await page.goto('store/checkout/');
    const review = page.locator('[data-checkout-offer-status]');
    await expect(page.locator('[data-checkout-order-summary] .checkout-summary__identity')).toContainText(line.title);
    await expect(review).toContainText('Delivery is unavailable for this cart');
    await expect(review).not.toContainText('Cart is empty');
    await expect(review.getByRole('button', { name: 'Try delivery again', exact: true })).toHaveCount(0);
    await expect(review.locator('[data-checkout-pay-state]')).toBeDisabled();
    await expectNoHorizontalOverflow(page);
  });

  test(`compatibility checkout preserves the saved cart through hydration${suffix}`, async ({ page }) => {
    await seedCart(page, [line]);
    const releaseScripts = await holdHydration(page);
    await page.route('**/api/store/delivery-quote', (route) => route.fulfill({ json: { quote } }));
    await page.goto(`.${localRepresentativePaths.storeItem}checkout/`, { waitUntil: 'commit' });
    const summaries = page.locator('[data-checkout-order-summary]');
    try {
      await expect(summaries).toHaveCount(2);
      for (const summary of await summaries.all()) {
        await expect(summary).toContainText('Loading your cart');
        await expect(summary.locator('details')).toHaveCount(0);
      }
    } finally {
      releaseScripts();
    }
    for (const summary of await summaries.all())
      await expect(summary.locator('.checkout-summary__identity')).toContainText(line.title);
    const review = page.locator('[data-checkout-offer-status]');
    await expect(review.locator('[data-checkout-pay-state]')).toBeEnabled();
    await expect(review.locator('[data-delivery-summary]')).toContainText('€23.00');
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('blackbox.storeCart.v2')!).lines[0].storeItemSlug),
    ).toBe(line.storeItemSlug);
    await expectNoHorizontalOverflow(page);
  });
}
