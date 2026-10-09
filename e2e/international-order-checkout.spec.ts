import type { Page } from 'playwright/test';

import { expect, test, waitForIsland, waitForShell } from './fixtures';

const checkoutLines = [
  {
    availabilityLabel: 'Available',
    image: null,
    imageAlt: null,
    optionLabel: 'Vinyl',
    priceAmountMinor: 2800,
    priceCurrencyCode: 'EUR',
    priceDisplay: '€28.00',
    priceKind: 'fixed',
    quantity: 1,
    storeItemSlug: 'anarchotribal-vinyl',
    subtitle: 'Ouranopithecus',
    title: 'Anarchotribal',
    variantId: 'anarchotribal-vinyl_standard',
  },
  {
    availabilityLabel: 'Available',
    image: null,
    imageAlt: null,
    optionLabel: 'Vinyl',
    priceAmountMinor: 2800,
    priceCurrencyCode: 'EUR',
    priceDisplay: '€28.00',
    priceKind: 'fixed',
    quantity: 1,
    storeItemSlug: 'barren-point-vinyl',
    subtitle: 'Chronoboros',
    title: 'Barren Point',
    variantId: 'barren-point-vinyl_standard',
  },
];

async function prepareCheckout(page: Page, lines = checkoutLines) {
  await page.addInitScript((savedLines) => {
    localStorage.setItem('blackbox.storeCart.v2', JSON.stringify({ lines: savedLines }));
  }, lines);
  await page.route('**/api/store/capabilities', (route) =>
    route.fulfill({
      json: {
        pricing: {
          vatDisclosure: 'VAT included',
          deliveryQuantityBands: [
            { maxUnits: 4, amountMinor: 300 },
            { maxUnits: 8, amountMinor: 600 },
            { maxUnits: null, amountMinor: 1000 },
          ],
          currencyCode: 'EUR',
        },
        nativeCheckout: { enabled: true, unavailableReason: null },
      },
    }),
  );
  await page.route('**/api/store/delivery-quote', (route) => {
    const body = route.request().postDataJSON();
    expect(Object.keys(body)).toEqual(['lines']);
    const merchandiseGrossMinor = body.lines.reduce(
      (total: number, line: { quantity: number }) => total + line.quantity * 2800,
      0,
    );
    return route.fulfill({
      json: {
        quote: {
          tier: 'small',
          amountMinor: 250,
          currencyCode: 'EUR',
          merchandiseGrossMinor,
          totalAmountMinor: merchandiseGrossMinor + 250,
        },
      },
    });
  });
}

async function openCheckout(page: Page) {
  await page.goto('store/checkout/');
  await waitForShell(page);
  await waitForIsland(page, 'CheckoutOfferStatus');
  return page.locator('[data-checkout-offer-status]');
}

for (const width of [1280, 390]) {
  test(`checkout international card preserves delivery and payment at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1280 ? 860 : 844 });
    await prepareCheckout(page);
    let traceRequests = 0;
    await page.route('**/cdn-cgi/trace', (route) => {
      traceRequests += 1;
      return route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' });
    });
    const review = await openCheckout(page);
    const notice = review.getByRole('complementary', { name: 'Ordering from outside Greece', exact: true });
    const email = notice.getByRole('link', { name: 'Email us to order', exact: true });
    const pay = review.getByRole('button', { name: 'Continue to Payment', exact: true });
    await expect(notice).toBeVisible();
    await expect(notice).toHaveAttribute('data-border-tone', 'neutral');
    expect(
      await notice.evaluate((element) => {
        const tokenProbe = document.createElement('span');
        tokenProbe.style.color = 'var(--border)';
        element.append(tokenProbe);
        const borderColor = getComputedStyle(element).borderTopColor;
        const expectedColor = getComputedStyle(tokenProbe).color;
        tokenProbe.remove();
        return borderColor === expectedColor;
      }),
    ).toBe(true);
    await expect(notice.getByRole('heading', { name: 'Ordering from outside Greece?' })).toBeVisible();
    await expect(notice).toContainText(
      "Online checkout ships within Greece only for now. Email us what you'd like and where it's going, and we'll confirm shipping and payment with you.",
    );
    const href = new URL((await email.getAttribute('href'))!);
    expect(href.pathname).toBe('orders@blackboxrecordsathens.com');
    expect(href.searchParams.get('subject')).toBe('Order from outside Greece');
    expect(href.searchParams.get('body')).toBe('Items: Anarchotribal, Barren Point\nCountry:\nCity:');
    await expect(pay).toBeEnabled();
    await expect(pay).toHaveAttribute('data-checkout-pay-state', 'ready');
    expect(
      await review.evaluate((element) => {
        const delivery = element.querySelector('[data-delivery-summary]')!;
        const card = element.querySelector('aside[aria-label="Ordering from outside Greece"]')!;
        const action = element.querySelector('[data-checkout-pay-state]')!;
        return (
          Boolean(delivery.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING) &&
          Boolean(card.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING) &&
          !card.closest('[aria-live]')
        );
      }),
    ).toBe(true);
    await email.scrollIntoViewIfNeeded();
    expect((await email.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await email.focus();
    await expect(email).toBeFocused();
    await page.keyboard.press('Tab');
    const correction = notice.getByRole('button', { name: 'Deliver to Greece', exact: true });
    await expect(correction).toBeFocused();
    expect((await correction.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Tab');
    await expect(pay).toBeFocused();
    expect(await review.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(traceRequests).toBe(1);

    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('blackbox.storeCart.v2')!);
      saved.lines = [saved.lines[1]];
      saved.lines[0].title = 'Barren & Point, έκδοση?';
      localStorage.setItem('blackbox.storeCart.v2', JSON.stringify(saved));
      window.dispatchEvent(new CustomEvent('blackbox:checkout-cart-updated', { detail: saved }));
    });
    await expect(email).toHaveAttribute('href', /Barren%20%26%20Point/);
    expect(new URL((await email.getAttribute('href'))!).searchParams.get('body')).toBe(
      'Items: Barren & Point, έκδοση?\nCountry:\nCity:',
    );
    await expect(pay).toBeEnabled();
    expect(traceRequests).toBe(1);

    await correction.click();
    await expect(notice).toHaveCount(0);
    const change = review.getByRole('button', { name: 'Change delivery to outside Greece', exact: true });
    await expect(change).toBeFocused();
    await expect(pay).toBeEnabled();
    expect(traceRequests).toBe(1);

    // A missing provider URL leaves the existing error/retry state in place; no provider is contacted.
    await page.route('**/api/checkout/sessions', (route) => route.fulfill({ json: { checkoutUrl: '' } }));
    await review.locator('.checkout-review__newsletter summary').click();
    await review.getByRole('checkbox').check();
    const checkoutRequest = page.waitForRequest('**/api/checkout/sessions');
    await pay.click();
    const request = await checkoutRequest;
    expect(request.postDataJSON()).toEqual({
      lines: [{ quantity: 1, storeItemSlug: 'barren-point-vinyl', variantId: 'barren-point-vinyl_standard' }],
      newsletterOptIn: true,
      storeItemSlug: 'barren-point-vinyl',
      variantId: 'barren-point-vinyl_standard',
    });
    expect(request.headers()['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/i);
    await expect(review.getByRole('alert')).toContainText('Stripe checkout could not be opened');
    await expect(pay).toBeEnabled();
  });
}

for (const trace of ['loc=GR\n', 'loc=XX\n', 'loc=T1\n', 'invalid response']) {
  test(`checkout hides the international card for ${trace.trim()}`, async ({ page }) => {
    await prepareCheckout(page);
    await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: trace }));
    const review = await openCheckout(page);
    await expect(review.getByRole('button', { name: 'Continue to Payment', exact: true })).toBeEnabled();
    await expect(review.getByRole('complementary', { name: 'Ordering from outside Greece' })).toHaveCount(0);
    await expect(review.getByRole('link', { name: 'Email us to order' })).toHaveCount(0);
  });
}

test('a failed country request stays hidden while Greek checkout remains usable', async ({ page }) => {
  await prepareCheckout(page);
  await page.addInitScript(() => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (new URL(url, location.href).pathname === '/cdn-cgi/trace')
        return Promise.reject(new TypeError('Failed to fetch'));
      return nativeFetch(input, init);
    };
  });
  const review = await openCheckout(page);
  await expect(review.getByRole('button', { name: 'Continue to Payment', exact: true })).toBeEnabled();
  await expect(review.getByRole('complementary', { name: 'Ordering from outside Greece' })).toHaveCount(0);
});

test('the international card does not bypass a missing authoritative quote', async ({ page }) => {
  await prepareCheckout(page);
  await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' }));
  await page.route('**/api/store/delivery-quote', (route) => route.fulfill({ json: { quote: null } }));
  const review = await openCheckout(page);
  await expect(review.getByRole('complementary', { name: 'Ordering from outside Greece' })).toBeVisible();
  await expect(review).toContainText('Delivery is unavailable');
  await expect(review.getByRole('button', { name: 'Continue to Payment', exact: true })).toBeDisabled();
});

test('the checkout card and payment remain reachable with a 200 percent layout zoom', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await prepareCheckout(page);
  await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' }));
  const review = await openCheckout(page);
  await page.evaluate(() => {
    document.body.style.zoom = '2';
  });
  const email = review.getByRole('link', { name: 'Email us to order', exact: true });
  const pay = review.getByRole('button', { name: 'Continue to Payment', exact: true });
  await expect(email).toBeVisible();
  await email.scrollIntoViewIfNeeded();
  await expect(email).toBeInViewport({ ratio: 1 });
  await expect(pay).toBeEnabled();
  await email.focus();
  await expect(email).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(review.getByRole('button', { name: 'Deliver to Greece', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(pay).toBeFocused();
  await pay.scrollIntoViewIfNeeded();
  await expect(pay).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('empty checkout does not mount the international card or allow payment', async ({ page }) => {
  await prepareCheckout(page, []);
  await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' }));
  const review = await openCheckout(page);
  await expect(review).toContainText('Add a priced item to the cart before checkout.');
  await expect(review.getByRole('complementary', { name: 'Ordering from outside Greece' })).toHaveCount(0);
  await expect(review.getByRole('button', { name: 'Continue to Payment', exact: true })).toHaveCount(0);
});
