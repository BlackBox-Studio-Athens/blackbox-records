import { expect, localRepresentativePaths, test, waitForIsland, waitForShell } from './fixtures';
import type { CDPSession, Locator } from 'playwright/test';

async function swipeUp(cdp: CDPSession, x: number, y: number, distance: number) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let step = 1; step <= 8; step++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - (distance * step) / 8 }],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function expectCartActionsVisible(drawer: Locator, hasCheckout = true) {
  if (hasCheckout)
    await expect(drawer.getByRole('link', { name: 'Checkout', exact: true })).toBeInViewport({ ratio: 1 });
  else await expect(drawer.getByRole('link', { name: 'Checkout', exact: true })).toHaveCount(0);
  await expect(drawer.getByRole('button', { name: 'Continue Shopping' })).toBeInViewport({ ratio: 1 });
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 390, height: 667 },
  { width: 320, height: 568 },
]) {
  test(`cart content scrolls above reachable actions at ${viewport.width}x${viewport.height}`, async ({
    page,
    isMobile,
  }, testInfo) => {
    test.skip(!isMobile, 'Touch overflow coverage runs in the mobile project.');
    await page.setViewportSize(viewport);
    const cartLines = ['disintegration-black-vinyl-lp', 'anarchotribal-vinyl', 'caregivers-vinyl'].map(
      (slug, index) => ({
        availabilityLabel: 'In stock',
        image: null,
        imageAlt: null,
        optionLabel: 'Black Vinyl LP',
        priceAmountMinor: 2800,
        priceCurrencyCode: 'EUR',
        priceDisplay: '€28.00',
        priceKind: 'fixed',
        storeItemSlug: slug,
        subtitle: 'Artist with a long name to exercise wrapping on small phones',
        title: index === 1 ? 'A very long record title that wraps across several lines in the mobile cart' : slug,
        variantId: `${slug}_standard`,
        quantity: 1,
      }),
    );
    await page.addInitScript(
      (lines) => localStorage.setItem('blackbox.storeCart.v2', JSON.stringify({ lines })),
      cartLines,
    );

    let releaseQuote = () => {};
    const quoteReleased = new Promise<void>((resolve) => {
      releaseQuote = resolve;
    });
    let quoteAvailable = true;
    await page.route('**/api/store/delivery-quote', async (route) => {
      await quoteReleased;
      await route.fulfill({
        json: {
          quote: quoteAvailable
            ? {
                tier: 'small',
                amountMinor: 250,
                currencyCode: 'EUR',
                merchandiseGrossMinor: 8400,
                totalAmountMinor: 8650,
              }
            : null,
        },
      });
    });
    await page.goto('store/');
    await waitForShell(page);
    const trigger = page.locator('[data-store-cart-trigger]').first();
    await trigger.click();
    const drawer = page.getByRole('dialog', { name: 'Cart' });
    const summary = drawer.locator('[data-delivery-summary]');
    try {
      await expect(summary).toHaveAttribute('aria-busy', 'true');
      await expectCartActionsVisible(drawer);
    } finally {
      releaseQuote();
    }
    await expect(summary).toContainText('Shipping');

    const scroller = drawer.locator('[data-lenis-scroll-root]');
    await expect.poll(() => scroller.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    const initialPageScroll = await page.evaluate(() => window.scrollY);
    const box = (await scroller.boundingBox())!;
    const cdp = await page.context().newCDPSession(page);
    await swipeUp(cdp, box.x + box.width / 2, box.y + box.height / 2, Math.min(200, box.height / 2));
    await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(initialPageScroll);
    await expectCartActionsVisible(drawer);
    if (viewport.height === 667) await page.screenshot({ path: testInfo.outputPath('cart-scrolled.png') });

    quoteAvailable = false;
    await drawer.getByRole('button', { name: `Increase quantity for ${cartLines[0]!.title}`, exact: true }).click();
    await expect(summary).toContainText('Delivery is unavailable');
    await expectCartActionsVisible(drawer);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('blackbox.storeCart.v2')!));
    expect(stored.lines[0].quantity).toBe(2);

    for (let remaining = cartLines.length - 1; remaining >= 0; remaining--) {
      await drawer
        .locator('[data-store-cart-line-item]')
        .last()
        .getByRole('button', { name: 'Remove', exact: true })
        .click();
      await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(remaining);
      await expectCartActionsVisible(drawer, remaining > 0);
    }
    await expect(drawer).toContainText('Your cart is empty');
    await drawer.getByRole('button', { name: 'Continue Shopping' }).click();
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
    await swipeUp(cdp, viewport.width / 2, viewport.height / 2, 200);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(initialPageScroll);
    await cdp.detach();
  });
}

test('add to cart opens the drawer, persists the line and restores it on another page', async ({ page }) => {
  await page.goto(`.${localRepresentativePaths.storeItem}`);
  await waitForShell(page);
  // Built pages server-render the button; a click before hydration is ignored.
  await waitForIsland(page, 'StoreItemPurchaseActions');

  // Ready because the fixture serves a ready offer for this item.
  const addToCart = page.locator('[data-store-item-add-to-cart]');
  await addToCart.click();
  // The purchase control confirms in place at once (the drawer's chunks may still be loading in dev).
  await expect(addToCart).toHaveText('Added');
  const drawer = page.getByRole('dialog', { name: 'Cart' });
  await expect(drawer).toBeVisible();
  await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(1);
  await expect(drawer.getByRole('link', { name: 'Checkout' })).toHaveAttribute(
    'href',
    /\/blackbox-records\/store\/checkout\/$/,
  );
  expect(await page.evaluate(() => localStorage.getItem('blackbox.storeCart.v2'))).not.toBeNull();

  // Closing returns focus to what opened the drawer; the confirmation then resets on its own.
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(addToCart).toBeFocused();
  await expect(addToCart).toHaveText('Add To Cart', { timeout: 6000 });

  // A controllable clock lets the test step past Undo's six seconds.
  await page.clock.install();
  await page.goto('store/');
  await waitForShell(page);
  const trigger = page.locator('[data-store-cart-trigger]').first();
  await expect(trigger).toHaveAccessibleName('Cart, 1 item');
  await trigger.click();
  const reopened = page.getByRole('dialog', { name: 'Cart' });
  await expect(reopened.locator('[data-store-cart-line-item]')).toHaveCount(1);

  // Remove acts at once and leaves a focused Undo in the line's place; Undo restores it.
  await reopened.getByRole('button', { name: 'Remove' }).click();
  await expect(reopened.locator('[data-store-cart-line-item]')).toHaveCount(0);
  const undo = reopened.getByRole('button', { name: 'Undo' });
  await expect(undo).toBeFocused();
  // Undo waits while it has focus.
  await page.clock.fastForward(7000);
  await expect(undo).toBeVisible();
  await undo.click();
  await expect(reopened.locator('[data-store-cart-line-item]')).toHaveCount(1);

  // The modal hides the header from assistive technology; after closing, the control is back with its count and focus.
  await page.keyboard.press('Escape');
  await expect(reopened).toBeHidden();
  await expect(trigger).toBeFocused();
  // Keyboard focus draws the family ring on the header control.
  await expect(trigger).toHaveCSS('outline-style', 'solid');
  await expect(trigger).toHaveAccessibleName('Cart, 1 item');
});

test('Buy on a Store card adds the item and opens the cart', async ({ page }) => {
  const storeItemSlug = 'disintegration-black-vinyl-lp';
  const secondSlug = 'anarchotribal-vinyl';
  await page.route(/^https:\/\/(bandcamp\.com|embed\.tidal\.com)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  await page.route('**/api/store/listing-prices', (route) =>
    route.fulfill({
      json: [storeItemSlug, secondSlug].map((slug) => ({
        storeItemSlug: slug,
        presentationState: 'ready',
        displayPrice: '€28.00',
        availabilityState: 'stocked',
      })),
    }),
  );
  await page.goto('store/');
  await waitForShell(page);

  const buy = page.locator(`[data-store-card-buy][data-store-item-slug="${storeItemSlug}"]`);
  await expect(buy).toBeVisible();
  await expect(page.locator('[data-store-card-buy]:visible')).toHaveCount(2);

  await page.locator('[data-music-streaming-service-embedded-player-trigger]').first().click();
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  await iframe.contentFrame().getByRole('button', { name: 'Player fixture' }).click();
  await page.getByRole('button', { name: 'Minimize player' }).click();
  const originalIframe = await iframe.elementHandle();

  await buy.click();
  // Added shows at once and lasts four seconds; the drawer's chunks may still be loading in dev.
  await expect(buy).toHaveText('Added');
  const drawer = page.getByRole('dialog', { name: 'Cart' });
  await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(1);

  await expectCartActionsVisible(drawer);
  await drawer.getByRole('button', { name: 'Continue Shopping' }).click();
  await expect(drawer).toBeHidden();
  await expect(buy).toBeFocused();
  const secondBuy = page.locator(`[data-store-card-buy][data-store-item-slug="${secondSlug}"]`);
  await secondBuy.click();
  await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(2);
  await expectCartActionsVisible(drawer);
  await drawer.getByRole('button', { name: 'Increase quantity for Disintegration', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('blackbox.storeCart.v2')!).lines.map(
          (line: { quantity: number }) => line.quantity,
        ),
      ),
    )
    .toEqual([2, 1]);
  await drawer.getByRole('button', { name: 'Continue Shopping' }).click();
  expect(await originalIframe!.evaluate((element) => element.isConnected)).toBe(true);
  await page.reload();
  await waitForShell(page);
  await expect(page.locator('[data-store-cart-trigger]').first()).toHaveAccessibleName('Cart, 3 items');
});

test('the checkout pay control fills in place when the shipping quote arrives', async ({ page }) => {
  await page.goto(`.${localRepresentativePaths.storeItem}`);
  await waitForShell(page);
  await waitForIsland(page, 'StoreItemPurchaseActions');
  await page.locator('[data-store-item-add-to-cart]').click();
  await expect(page.getByRole('dialog', { name: 'Cart' })).toBeVisible();

  // Checkout reads capabilities, and its quote is held back until the waiting state is measured.
  await page.route('**/api/store/capabilities', (route) =>
    route.fulfill({
      json: {
        pricing: { vatDisclosure: 'VAT included', deliveryCharges: { small: 450, medium: 650 }, currencyCode: 'EUR' },
        nativeCheckout: { enabled: true, unavailableReason: null },
      },
    }),
  );
  let releaseQuote = () => {};
  const quoteReleased = new Promise<void>((resolve) => {
    releaseQuote = resolve;
  });
  await page.route('**/api/store/delivery-quote', async (route) => {
    await quoteReleased;
    await route.fulfill({
      json: {
        quote: {
          tier: 'small',
          amountMinor: 450,
          currencyCode: 'EUR',
          merchandiseGrossMinor: 2800,
          totalAmountMinor: 3250,
        },
      },
    });
  });

  await page.getByRole('dialog', { name: 'Cart' }).getByRole('link', { name: 'Checkout', exact: true }).click();
  const pay = page.locator('[data-checkout-pay-state]');
  await expect(pay).toHaveAttribute('data-checkout-pay-state', 'waiting');
  await expect(pay).toBeDisabled();
  const waitingBox = await pay.boundingBox();

  releaseQuote();
  await expect(pay).toHaveAttribute('data-checkout-pay-state', 'ready');
  await expect(pay).toContainText('€32.50');
  // Webfonts are stubbed here, so this guards the layout around the control, not Bebas metrics.
  expect((await pay.boundingBox())?.y).toBeCloseTo(waitingBox?.y ?? Number.NaN, 0);
});

test('the header cart control appears only with items or in the store', async ({ page }) => {
  await page.goto('.');
  await waitForShell(page);
  await expect(page.locator('[data-store-cart-trigger]')).toHaveCount(0);

  await page.goto('store/');
  await waitForShell(page);
  await expect(page.locator('[data-store-cart-trigger]').first()).toHaveAccessibleName('Cart');
});
