import { expect, test, waitForShell } from './fixtures';
import type { Locator, Page } from 'playwright/test';

const noticeLabel = 'Ordering from outside Greece';
const cartLines = [
  {
    availabilityLabel: 'In stock',
    image: null,
    imageAlt: null,
    optionLabel: 'Black Vinyl LP',
    priceAmountMinor: 2800,
    priceCurrencyCode: 'EUR',
    priceDisplay: '€28.00',
    priceKind: 'fixed',
    storeItemSlug: 'anarchotribal-vinyl',
    subtitle: 'Ouranopithecus',
    title: 'Anarchotribal',
    variantId: 'anarchotribal-vinyl_standard',
    quantity: 1,
    preorder: { shipEstimate: { kind: 'month', month: '2026-11', part: 'early' } },
  },
  {
    availabilityLabel: 'In stock',
    image: null,
    imageAlt: null,
    optionLabel: 'Black Vinyl LP',
    priceAmountMinor: 2800,
    priceCurrencyCode: 'EUR',
    priceDisplay: '€28.00',
    priceKind: 'fixed',
    storeItemSlug: 'disintegration-black-vinyl-lp',
    subtitle: 'Afterwise',
    title: 'Disintegration',
    variantId: 'disintegration-black-vinyl-lp_standard',
    quantity: 1,
  },
];

async function openCart(page: Page) {
  await page.addInitScript((lines) => {
    localStorage.setItem('blackbox.storeCart.v2', JSON.stringify({ lines }));
  }, cartLines);
  await page.route('**/api/store/delivery-quote', (route) =>
    route.fulfill({
      json: {
        quote: {
          tier: 'small',
          amountMinor: 250,
          currencyCode: 'EUR',
          merchandiseGrossMinor: 5600,
          totalAmountMinor: 5850,
        },
      },
    }),
  );
  await page.goto('store/');
  await waitForShell(page);
  await page.locator('[data-store-cart-trigger]').first().click();
  const drawer = page.getByRole('dialog', { name: 'Cart', exact: true });
  await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(cartLines.length);
  await expect(drawer.locator('[data-delivery-summary]')).toContainText('BOX NOW locker delivery');
  return drawer;
}

async function expectEmailItems(link: Locator, titles: string[]) {
  const href = await link.getAttribute('href');
  expect(href).toMatch(/^mailto:orders@blackboxrecordsathens\.com\?/);
  const email = new URL(href!);
  expect(email.searchParams.get('subject')).toBe('Order from outside Greece');
  expect(email.searchParams.get('body')).toBe(`Items: ${titles.join(', ')}\nCountry:\nCity:`);
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`international cart notice preserves actions and live item titles at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' }));
    const drawer = await openCart(page);
    const card = drawer.getByRole('complementary', { name: noticeLabel, exact: true });
    const emailLink = card.getByRole('link', { name: 'Email us to order', exact: true });
    const checkout = drawer.getByRole('link', { name: 'Checkout', exact: true });
    await expect(card).toContainText('Online checkout ships within Greece only for now.');
    await expectEmailItems(
      emailLink,
      cartLines.map((line) => line.title),
    );
    expect((await emailLink.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(checkout).toBeInViewport({ ratio: 1 });

    const summary = drawer.locator('.store-cart-drawer__summary');
    const order = await summary.evaluate((element) =>
      Array.from(element.children).map((child) =>
        child.getAttribute('data-delivery-summary') !== null ? 'delivery' : child.getAttribute('aria-label'),
      ),
    );
    expect(order.indexOf('delivery')).toBeLessThan(order.indexOf(noticeLabel));
    const previousScroll = await page.evaluate(() => window.scrollY);
    await emailLink.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(emailLink).toBeFocused();
    await expect(emailLink).toBeInViewport({ ratio: 1 });
    await expect(emailLink).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Tab');
    const correction = card.getByRole('button', { name: 'Deliver to Greece', exact: true });
    await expect(correction).toBeFocused();
    expect((await correction.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Tab');
    await expect(checkout).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(previousScroll);

    await drawer
      .locator('[data-store-cart-line-item]')
      .first()
      .getByRole('button', { name: 'Remove', exact: true })
      .click();
    await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(1);
    await expectEmailItems(emailLink, [cartLines[1]!.title]);
    const undo = drawer.getByRole('button', { name: 'Undo', exact: true });
    await expect(undo).toBeFocused();
    await undo.click();
    await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(2);
    await expectEmailItems(
      emailLink,
      cartLines.map((line) => line.title),
    );

    await correction.click();
    await expect(card).toHaveCount(0);
    await expect(page.locator('.international-order-notice--strip')).toHaveCount(0);
    const change = drawer.getByRole('button', { name: 'Change delivery to outside Greece', exact: true });
    await expect(change).toBeFocused();
    await expect(checkout).toBeInViewport({ ratio: 1 });
    await change.click();
    await expect(card).toBeVisible();
    await expect(page.locator('.international-order-notice--strip')).toHaveCount(1);
    await expect(correction).toBeFocused();

    for (let remaining = cartLines.length - 1; remaining >= 0; remaining--) {
      await drawer
        .locator('[data-store-cart-line-item]')
        .last()
        .getByRole('button', { name: 'Remove', exact: true })
        .click();
      await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(remaining);
    }
    await expect(card).toHaveCount(0);
    await expect(checkout).toHaveCount(0);
    await expect(drawer).toContainText('Your cart is empty');
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(page.locator('[data-store-cart-trigger]').first()).toBeFocused();
  });
}

for (const country of ['GR', 'failed']) {
  test(`international cart notice stays hidden for ${country}`, async ({ page }) => {
    const lookupSettled =
      country === 'failed'
        ? page.waitForEvent('requestfailed', {
            predicate: (request) => new URL(request.url()).pathname === '/cdn-cgi/trace',
          })
        : page.waitForResponse((response) => new URL(response.url()).pathname === '/cdn-cgi/trace');
    await page.route('**/cdn-cgi/trace', (route) =>
      country === 'failed'
        ? route.abort('aborted')
        : route.fulfill({ contentType: 'text/plain', body: `loc=${country}\n` }),
    );
    const drawer = await openCart(page);
    await lookupSettled;
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    await expect(drawer.getByRole('complementary', { name: noticeLabel, exact: true })).toHaveCount(0);
    await expect(drawer.getByRole('link', { name: 'Email us to order', exact: true })).toHaveCount(0);
    await expect(drawer.getByRole('link', { name: 'Checkout', exact: true })).toBeInViewport({ ratio: 1 });
  });
}

test('international cart card scrolls while Checkout stays reachable at 195x422 compact reflow', async ({ page }) => {
  // 195x422 is the CSS viewport left by a 200% browser zoom on a 390x844 display.
  await page.setViewportSize({ width: 195, height: 422 });
  await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' }));
  const drawer = await openCart(page);
  const checkout = drawer.getByRole('link', { name: 'Checkout', exact: true });
  const scroller = drawer.locator('[data-lenis-scroll-root]');
  const emailLink = drawer
    .getByRole('complementary', { name: noticeLabel })
    .getByRole('link', { name: 'Email us to order' });
  await expect(scroller).toContainText('Ships together');
  await expect.poll(() => scroller.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await emailLink.focus();
  await expect(emailLink).toBeInViewport({ ratio: 1 });
  await page.keyboard.press('Tab');
  await expect(drawer.getByRole('button', { name: 'Deliver to Greece', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(checkout).toBeFocused();
  await expect(checkout).toBeInViewport({ ratio: 1 });
  await expect(drawer.getByRole('button', { name: 'Close cart', exact: true })).toBeInViewport({ ratio: 1 });
});

test('international cart notice preserves the player across cart actions and Store category navigation', async ({
  page,
}) => {
  await page.route('**/cdn-cgi/trace', (route) => route.fulfill({ contentType: 'text/plain', body: 'loc=US\n' }));
  await page.route(/^https:\/\/(bandcamp\.com|embed\.tidal\.com)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  const drawer = await openCart(page);
  await drawer.getByRole('button', { name: 'Continue Shopping', exact: true }).click();
  await page.locator('[data-music-streaming-service-embedded-player-trigger]:visible').first().click();
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  await iframe.contentFrame().getByRole('button', { name: 'Player fixture', exact: true }).click();
  await page.getByRole('button', { name: 'Minimize player', exact: true }).click();
  const originalIframe = await iframe.elementHandle();

  await page.locator('[data-store-cart-trigger]').first().click();
  await expect(drawer.getByRole('complementary', { name: noticeLabel, exact: true })).toBeVisible();
  await drawer
    .locator('[data-store-cart-line-item]')
    .first()
    .getByRole('button', { name: 'Remove', exact: true })
    .click();
  await drawer.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await originalIframe!.evaluate((element) => element.isConnected)).toBe(true);
  await drawer.getByRole('button', { name: 'Continue Shopping', exact: true }).click();

  await page.locator('main').getByRole('link', { name: 'Distro', exact: true }).click();
  await expect(page).toHaveURL(/\/store\/distro\/$/);
  expect(await originalIframe!.evaluate((element) => element.isConnected)).toBe(true);
  await page.locator('[data-store-cart-trigger]').first().click();
  await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(2);
  await expectEmailItems(
    drawer
      .getByRole('complementary', { name: noticeLabel, exact: true })
      .getByRole('link', { name: 'Email us to order' }),
    cartLines.map((line) => line.title),
  );
  expect(await originalIframe!.evaluate((element) => element.isConnected)).toBe(true);
});
