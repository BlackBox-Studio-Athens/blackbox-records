import type { PublicApiComponents } from '@blackbox/api-client/public';
import { expect, test, plantSentinel, sentinelIntact, waitForIsland, waitForShell } from './fixtures';

type CheckoutState = PublicApiComponents['schemas']['CheckoutState'];
const paidState = {
  checkoutSessionId: 'cs_fixture_saved_preorder',
  paymentStatus: 'paid',
  orderStatus: 'paid',
  state: 'paid',
  status: 'complete',
  shippingLocker: null,
  preorder: { shipEstimate: { kind: 'month', month: '2026-11', part: null } },
  orderSnapshot: {
    reference: 'BBR-FIXTURE-SAVED-ORDER',
    lines: [
      {
        displayName: 'Saved pre-order record',
        optionLabel: 'Vinyl',
        quantity: 1,
        storeItemSlug: 'saved-preorder',
        preorder: { shipEstimate: { kind: 'month', month: '2026-11', part: null } },
      },
      {
        displayName: 'Saved ordinary record',
        optionLabel: 'Vinyl',
        quantity: 1,
        storeItemSlug: 'saved-ordinary',
        preorder: null,
      },
    ],
  },
} satisfies CheckoutState;

test('paid mixed return shows saved facts and shopping preserves the shell', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.route('**/api/checkout/sessions/*/state', (route) => route.fulfill({ json: paidState }));
  await page.goto(`store/checkout/return/?session_id=${paidState.checkoutSessionId}`);
  await waitForShell(page);
  await waitForIsland(page, 'CheckoutReturnStatus');
  const screen = page.locator('[data-checkout-preorder-confirmed]');
  await expect(screen.getByText('Paid', { exact: true })).toBeVisible();
  await expect(screen).toContainText(paidState.orderSnapshot.reference);
  await expect(screen.locator('dl > div')).toHaveCount(3);
  await expect(screen).toContainText('Pre-order, expected to ship around November 2026');
  await expect(screen).toContainText('In stock, sent with the pre-order');
  await expect(screen).toContainText('We contact you to arrange the locker before dispatch.');
  expect(
    await screen.locator('.checkout-return__panel').evaluate((element) => element.getBoundingClientRect().width),
  ).toBeCloseTo(720, 0);
  await plantSentinel(page);
  await screen.getByRole('link', { name: 'Continue Shopping', exact: true }).click();
  await expect(page).toHaveURL(/\/store\/$/);
  expect(await sentinelIntact(page)).toBe(true);
});

test('pre-order-only unknown return stays truthful and keyboard usable at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state: CheckoutState = {
    ...paidState,
    preorder: { shipEstimate: null },
    orderSnapshot: {
      ...paidState.orderSnapshot,
      lines: [{ ...paidState.orderSnapshot.lines[0]!, preorder: { shipEstimate: null } }],
    },
  };
  await page.route('**/api/checkout/sessions/*/state', (route) => route.fulfill({ json: state }));
  await page.goto(`store/checkout/return/?session_id=${state.checkoutSessionId}`);
  const screen = page.locator('[data-checkout-preorder-confirmed]');
  await expect(screen).toBeVisible();
  await expect(screen).toContainText('ship estimate to be announced');
  await expect(screen).not.toContainText('November');
  await expect(screen).not.toContainText('In stock, sent with the pre-order');
  await expect(screen).not.toContainText('Out now, while you wait');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const shopping = screen.getByRole('link', { name: 'Continue Shopping', exact: true });
  await shopping.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(shopping).toBeFocused();
  await expect(shopping).toBeInViewport({ ratio: 1 });
  expect(await shopping.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
});

test('delayed order callback polls and clears the cart only after confirmed payment', async ({ page }) => {
  const draft = {
    lines: [
      {
        storeItemSlug: 'saved-preorder',
        variantId: 'saved_variant',
        title: 'Saved pre-order record',
        subtitle: 'Fixture artist',
        optionLabel: 'Vinyl',
        quantity: 1,
        image: null,
        imageAlt: null,
        availabilityLabel: 'Available',
        priceDisplay: '€25.00',
        priceKind: 'fixed',
        priceCurrencyCode: 'EUR',
        priceAmountMinor: 2500,
      },
    ],
  };
  await page.addInitScript((value) => localStorage.setItem('blackbox.storeCart.v2', JSON.stringify(value)), draft);
  let reads = 0;
  await page.route('**/api/checkout/sessions/*/state', (route) =>
    route.fulfill({
      json: ++reads === 1 ? { ...paidState, orderStatus: 'pending_payment' } : paidState,
    }),
  );
  await page.goto(`store/checkout/return/?session_id=${paidState.checkoutSessionId}&redirect_status=succeeded`);
  await expect(page.getByRole('heading', { name: 'Confirming your order', exact: true })).toBeVisible();
  await expect(page.locator('[data-checkout-preorder-confirmed]')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('blackbox.storeCart.v2')!).lines.length)).toBe(1);
  await expect(page.locator('[data-checkout-preorder-confirmed]')).toBeVisible();
  expect(reads).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem('blackbox.storeCart.v2'))).toBeNull();
});

for (const scenario of [
  {
    name: 'expired',
    state: { ...paidState, orderStatus: 'not_paid', paymentStatus: 'unpaid', state: 'expired', status: 'expired' },
    title: 'Checkout Expired',
  },
  {
    name: 'cancelled or failed',
    state: { ...paidState, orderStatus: 'not_paid', paymentStatus: 'unpaid', state: 'unknown' },
    title: 'We Could Not Confirm Payment',
  },
] satisfies { name: string; state: CheckoutState; title: string }[]) {
  test(`${scenario.name} return never accepts claimed paid details`, async ({ page }) => {
    await page.route('**/api/checkout/sessions/*/state', (route) => route.fulfill({ json: scenario.state }));
    await page.goto(`store/checkout/return/?session_id=${paidState.checkoutSessionId}&redirect_status=succeeded`);
    await expect(page.getByRole('heading', { name: scenario.title, exact: true })).toBeVisible();
    await expect(page.locator('[data-checkout-preorder-confirmed]')).toHaveCount(0);
  });
}

test('unavailable and missing-session returns retain their recovery states', async ({ page }) => {
  await page.addInitScript(() => {
    const realFetch = window.fetch.bind(window);
    window.fetch = (input, options) => {
      const url = new URL(
        typeof input === 'string' ? input : input instanceof Request ? input.url : String(input),
        location.href,
      );
      if (url.pathname.startsWith('/api/checkout/sessions/') && url.pathname.endsWith('/state')) {
        return Promise.reject(new TypeError('Fixture status unavailable'));
      }
      return realFetch(input, options);
    };
  });
  await page.goto(`store/checkout/return/?session_id=${paidState.checkoutSessionId}`);
  await expect(page.getByRole('heading', { name: 'We Could Not Confirm Payment', exact: true })).toBeVisible();
  await expect(page.getByText('Fixture status unavailable', { exact: true })).toBeVisible();
  await expect(page.locator('[data-checkout-preorder-confirmed]')).toHaveCount(0);
  await page.goto('store/checkout/return/?redirect_status=succeeded');
  await expect(page.getByRole('heading', { name: 'Return Link Incomplete', exact: true })).toBeVisible();
  await expect(page.locator('[data-checkout-preorder-confirmed]')).toHaveCount(0);
});
