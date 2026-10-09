import {
  expect,
  localRepresentativePaths,
  openSurfaceWithinClickTask,
  test,
  waitForIsland,
  waitForShell,
  watchSurfaceWarmup,
} from './fixtures';
import type { CDPSession, Locator } from 'playwright/test';
import type { PublicApiComponents } from '../packages/api-client/src/public-client';

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
  const close = drawer.getByRole('button', { name: 'Close cart', exact: true });
  await expect(close).toBeInViewport({ ratio: 1 });
  expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(drawer.getByRole('heading', { name: 'Cart', exact: true })).toBeInViewport({ ratio: 1 });
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
    browserName,
    hasTouch,
  }, testInfo) => {
    test.skip(!hasTouch, 'Overflow coverage runs in the compact touch projects.');
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
    await page.addInitScript((lines) => {
      if (!localStorage.getItem('blackbox.storeCart.v2'))
        localStorage.setItem('blackbox.storeCart.v2', JSON.stringify({ lines }));
    }, cartLines);

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
    await expect(summary).toContainText('BOX NOW locker delivery');

    const scroller = drawer.locator('[data-lenis-scroll-root]');
    await expect.poll(() => scroller.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    const initialPageScroll = await page.evaluate(() => window.scrollY);
    const box = (await scroller.boundingBox())!;
    const cdp = browserName === 'chromium' ? await page.context().newCDPSession(page) : null;
    if (cdp) await swipeUp(cdp, box.x + box.width / 2, box.y + box.height / 2, Math.min(200, box.height / 2));
    else {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, 500);
    }
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

    await page.reload();
    await waitForShell(page);
    await expect(trigger).toHaveAccessibleName('Cart, 4 items');
    await trigger.click();
    await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(3);
    await expect(summary).toContainText('Delivery is unavailable');
    await expectCartActionsVisible(drawer);

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
    const close = drawer.getByRole('button', { name: 'Close cart' });
    if (cdp) await close.click();
    else await close.tap();
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
    if (cdp) await swipeUp(cdp, viewport.width / 2, viewport.height / 2, 200);
    else {
      await page.mouse.move(viewport.width / 2, viewport.height / 2);
      await page.mouse.wheel(0, 500);
    }
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(initialPageScroll);
    await cdp?.detach();
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
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveCSS('outline-style', 'solid');
  await expect(trigger).toHaveAccessibleName('Cart, 1 item');
});

test('Buy on a Store card reopens a three-item cart after every dismissal and preserves the player', async ({
  page,
  hasTouch,
  browserName,
}) => {
  const storeItemSlug = 'disintegration-black-vinyl-lp';
  const secondSlug = 'anarchotribal-vinyl';
  const thirdSlug = 'caregivers-vinyl';
  await page.route(/^https:\/\/(bandcamp\.com|embed\.tidal\.com)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  await page.route('**/api/store/listing-prices', (route) =>
    route.fulfill({
      json: [storeItemSlug, secondSlug, thirdSlug].map((slug) => ({
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
  await expect(page.locator('[data-store-card-buy]:visible')).toHaveCount(3);

  await page.locator('[data-music-streaming-service-embedded-player-trigger]:visible').first().click();
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  await iframe.contentFrame().getByRole('button', { name: 'Player fixture' }).click();
  if (browserName === 'firefox') {
    await expect.poll(() => iframe.evaluate((element) => document.activeElement === element)).toBe(true);
    // The mocked provider's parent-window blur is not emitted by headless Firefox's frame click.
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  }
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
  await drawer.getByRole('button', { name: 'Continue Shopping' }).click();
  await expect(drawer).toBeHidden();
  await expect(secondBuy).toBeFocused();
  const thirdBuy = page.locator(`[data-store-card-buy][data-store-item-slug="${thirdSlug}"]`);
  await thirdBuy.click();
  await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(3);
  let quantity = 1;
  let opener = thirdBuy;
  for (const dismissal of ['Close cart', 'Continue Shopping', 'Escape', 'backdrop']) {
    await expectCartActionsVisible(drawer);
    if (dismissal === 'Escape') await page.keyboard.press('Escape');
    else if (dismissal === 'backdrop') {
      // The cart spans the phone width below the header; its backdrop remains above it.
      if (hasTouch) await page.touchscreen.tap(10, 10);
      else await page.mouse.click(10, 10);
    } else {
      const control = drawer.getByRole('button', { name: dismissal, exact: true });
      if (hasTouch) await control.tap();
      else await control.click();
    }
    await expect(drawer).toBeHidden();
    await expect(opener).toBeFocused();
    expect(await originalIframe!.evaluate((element) => element.isConnected)).toBe(true);
    const previousScroll = await page.evaluate(() => window.scrollY);
    await page.mouse.move(150, 250);
    await page.mouse.wheel(0, previousScroll > 0 ? -300 : 300);
    await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(previousScroll);
    await expect(buy).toHaveText('Buy', { timeout: 6000 });
    await buy.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    if (hasTouch) await buy.tap();
    else await buy.click();
    quantity++;
    await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(3);
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('blackbox.storeCart.v2')!).lines[0].quantity))
      .toBe(quantity);
    opener = buy;
  }
  await drawer.getByRole('button', { name: 'Close cart' }).click();
  await page.reload();
  await waitForShell(page);
  await expect(page.locator('[data-store-cart-trigger]').first()).toHaveAccessibleName('Cart, 7 items');
});

test('a Store card shows copies left beside its price without hiding Buy', async ({ page }) => {
  const storeItemSlug = 'disintegration-black-vinyl-lp';
  const secondSlug = 'anarchotribal-vinyl';
  await page.route('**/api/store/listing-prices', (route) =>
    route.fulfill({
      json: [
        {
          storeItemSlug,
          presentationState: 'ready',
          displayPrice: '€28.00',
          availabilityState: 'stocked',
          lowStockQuantity: 3,
        },
        { storeItemSlug: secondSlug, presentationState: 'ready', displayPrice: '€28.00', availabilityState: 'stocked' },
      ],
    }),
  );
  await page.goto('store/');
  await waitForShell(page);

  const notice = page.locator(`[data-store-listing-availability][data-store-item-slug="${storeItemSlug}"]`);
  await expect(notice).toHaveText('Only 3 left');
  await expect(notice).toHaveAttribute('data-store-listing-availability-state', 'low_stock');
  await expect(page.locator(`[data-store-card-buy][data-store-item-slug="${storeItemSlug}"]`)).toBeVisible();
  await expect(page.locator(`[data-store-listing-availability][data-store-item-slug="${secondSlug}"]`)).toBeHidden();
});

test('the item page fuses copies left to the top edge of Add To Cart', async ({ page }) => {
  const storeItemSlug = 'disintegration-black-vinyl-lp';
  await page.route(`**/api/store/items/${storeItemSlug}`, (route) =>
    route.fulfill({
      json: {
        storeItemSlug,
        variantId: `${storeItemSlug}_standard`,
        availability: { label: 'Available', status: 'available' },
        canCheckout: true,
        catalogStatus: 'ready',
        lowStockQuantity: 2,
        price: { kind: 'fixed', amountMinor: 2800, currencyCode: 'EUR', display: '€28.00' },
      },
    }),
  );
  await page.goto(`store/${storeItemSlug}/`);
  await waitForShell(page);

  const notice = page.locator('[data-store-item-low-stock]');
  const addToCart = page.locator('[data-store-item-add-to-cart]');
  await expect(notice).toHaveText('Only 2 left');
  await expect(addToCart).toBeEnabled();
  const [tab, button] = await Promise.all([notice.boundingBox(), addToCart.boundingBox()]);
  expect(tab && button).toBeTruthy();
  expect(tab!.x).toBe(button!.x);
  expect(tab!.width).toBe(button!.width);
  expect(tab!.y + tab!.height).toBeCloseTo(button!.y, 2);
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
        pricing: {
          vatDisclosure: 'No VAT is calculated or collected at checkout.',
          taxCollectionMode: 'NO_TAX_COLLECTED',
          deliveryQuantityBands: [
            { maxUnits: 4, amountMinor: 450 },
            { maxUnits: 8, amountMinor: 650 },
            { maxUnits: null, amountMinor: 1050 },
          ],
          currencyCode: 'EUR',
        },
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
          taxCollectionMode: 'NO_TAX_COLLECTED',
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
  await expect(page.locator('[data-tax-disclosure]').last()).toHaveText(
    'No VAT is calculated or collected at checkout.',
  );
  await expect(page.locator('[data-checkout-order-summary]')).not.toContainText('VAT included');
  // Webfonts are stubbed here, so this guards the layout around the control, not Bebas metrics.
  expect((await pay.boundingBox())?.y).toBeCloseTo(waitingBox?.y ?? Number.NaN, 0);
});

test('mounted checkout follows drawer quantity changes before payment', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('blackbox.storeCart.v2'))
      localStorage.setItem(
        'blackbox.storeCart.v2',
        JSON.stringify({
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
              storeItemSlug: 'disintegration-black-vinyl-lp',
              subtitle: 'Black Vinyl LP',
              title: 'Disintegration',
              variantId: 'variant_disintegration-black-vinyl-lp_standard',
              quantity: 1,
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
  let releaseQuotes!: () => void;
  const changedQuotes = new Promise<void>((resolve) => {
    releaseQuotes = resolve;
  });
  await page.route('**/api/store/delivery-quote', async (route) => {
    const quantity = route.request().postDataJSON().lines[0].quantity;
    if (quantity > 1) await changedQuotes;
    const amountMinor = quantity > 1 ? 350 : 250;
    await route.fulfill({
      json: {
        quote: {
          tier: quantity > 1 ? 'medium' : 'small',
          amountMinor,
          currencyCode: 'EUR',
          merchandiseGrossMinor: quantity * 2800,
          totalAmountMinor: quantity * 2800 + amountMinor,
        },
      },
    });
  });
  await page.route('**/api/checkout/sessions', (route) => route.fulfill({ json: { checkoutUrl: '' } }));
  await page.goto('store/checkout/');
  await waitForShell(page);
  const pay = page.locator('[data-checkout-pay-state]');
  await expect(pay).toHaveAttribute('data-checkout-pay-state', 'ready');
  await expect(pay).toContainText('€30.50');
  await page.locator('[data-store-cart-trigger]').first().click();
  const drawer = page.getByRole('dialog', { name: 'Cart' });
  try {
    for (let quantity = 2; quantity <= 9; quantity++) {
      await drawer.getByRole('button', { name: 'Increase quantity for Disintegration' }).click();
      await expect
        .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('blackbox.storeCart.v2')!).lines[0].quantity))
        .toBe(quantity);
    }
    await expect(page.locator('[data-checkout-order-summary]')).toContainText('€252.00');
    await expect(pay).toHaveAttribute('data-checkout-pay-state', 'waiting');
    await expect(pay).toBeDisabled();
  } finally {
    releaseQuotes();
  }
  await drawer.getByRole('button', { name: 'Close cart', exact: true }).click();
  await expect(pay).toHaveAttribute('data-checkout-pay-state', 'ready');
  await expect(pay).toContainText('€255.50');
  await expect(page.locator('[data-delivery-summary]').first()).toContainText('€3.50');
  const submitted = page.waitForRequest(
    (request) => request.url().endsWith('/api/checkout/sessions') && request.method() === 'POST',
  );
  await pay.click();
  expect((await submitted).postDataJSON().lines).toEqual([
    {
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
      quantity: 9,
    },
  ]);
});

test('the header cart control appears only with items or in the store', async ({ page }) => {
  await page.goto('.');
  await waitForShell(page);
  await expect(page.locator('[data-store-cart-trigger]')).toHaveCount(0);

  await page.goto('store/');
  await waitForShell(page);
  await expect(page.locator('[data-store-cart-trigger]').first()).toHaveAccessibleName('Cart');
});

test('Store routes warm the cart drawer so the header control opens it in the click task', async ({ page }) => {
  const cartDrawerWarmed = watchSurfaceWarmup(page, 'StoreCartDrawer');
  await page.goto(`.${localRepresentativePaths.storeItem}`);
  await waitForShell(page);
  const trigger = '[data-store-cart-trigger]';
  await expect(page.locator(trigger).first()).toBeVisible();
  // Idle warm-up, with no pointer or focus intent on the cart control.
  await cartDrawerWarmed();

  expect(await openSurfaceWithinClickTask(page, trigger, '[role="dialog"][data-tone="store"]')).toEqual({
    loadingStatus: false,
    visible: true,
  });
  await expect(page.getByRole('dialog', { name: 'Cart' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue Shopping' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator(trigger).first()).toBeFocused();
});

test('the open cart drawer holds the page behind it still', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Wheel input over the backdrop is a desktop pointer behaviour.');
  await page.goto('store/');
  await waitForShell(page);
  await page.locator('[data-store-cart-trigger]').first().click();
  await expect(page.getByRole('dialog', { name: 'Cart' })).toBeVisible();
  // Radix portals the drawer after its first commit; the native body lock must still find it.
  await expect(page.locator('body')).toHaveClass(/\bis-shell-scroll-locked\b/);

  await page.mouse.move(80, 400);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/\bis-shell-scroll-locked\b/);
});

for (const width of [440, 390]) {
  test(`mixed cart refinement preserves live quotes, state changes and checkout gates at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 440 ? 1040 : 844 });
    const lines = [
      {
        availabilityLabel: 'Available',
        image: null,
        imageAlt: null,
        optionLabel: 'Vinyl',
        priceAmountMinor: 2500,
        priceCurrencyCode: 'EUR',
        priceDisplay: '€25.00',
        priceKind: 'fixed',
        storeItemSlug: 'caregivers-vinyl',
        subtitle: 'Test artist',
        title: 'Caregivers',
        variantId: 'caregivers-vinyl_standard',
        quantity: 1,
        preorder: { shipEstimate: { kind: 'month', month: '2026-11', part: 'mid' } },
      },
      {
        availabilityLabel: 'Available',
        image: null,
        imageAlt: null,
        optionLabel: 'Vinyl',
        priceAmountMinor: 2000,
        priceCurrencyCode: 'EUR',
        priceDisplay: '€20.00',
        priceKind: 'fixed',
        storeItemSlug: 'anarchotribal-vinyl',
        subtitle: 'Ouranopithecus',
        title: 'Anarchotribal',
        variantId: 'anarchotribal-vinyl_standard',
        quantity: 1,
        preorder: null,
      },
    ];
    await page.addInitScript((savedLines) => {
      if (!localStorage.getItem('blackbox.storeCart.v2'))
        localStorage.setItem('blackbox.storeCart.v2', JSON.stringify({ lines: savedLines }));
    }, lines);
    let inStock = true;
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
    await page.route('**/api/store/items/*', (route) => {
      const slug = new URL(route.request().url()).pathname.split('/').pop()!;
      return route.fulfill({
        json: {
          storeItemSlug: slug,
          variantId: `${slug}_standard`,
          availability: inStock
            ? { label: 'In stock', status: 'available' }
            : { label: 'Sold Out', status: 'sold_out' },
          canCheckout: inStock,
          catalogStatus: 'ready',
          price: {
            kind: 'fixed',
            amountMinor: slug === 'caregivers-vinyl' ? 2000 : 2800,
            currencyCode: 'EUR',
            display: slug === 'caregivers-vinyl' ? '€20.00' : '€28.00',
          },
          preorder: slug === 'caregivers-vinyl' ? lines[0]!.preorder : null,
        },
      });
    });
    await page.route('**/api/store/delivery-quote', (route) => {
      const requested = route.request().postDataJSON().lines as { storeItemSlug: string; quantity: number }[];
      const merchandiseGrossMinor = requested.reduce(
        (total, line) => total + line.quantity * (line.storeItemSlug === 'caregivers-vinyl' ? 2000 : 2800),
        0,
      );
      return route.fulfill({
        json: {
          quote: inStock
            ? {
                tier: 'small',
                amountMinor: 250,
                currencyCode: 'EUR',
                merchandiseGrossMinor,
                totalAmountMinor: merchandiseGrossMinor + 250,
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
    const notice = drawer.locator('.preorder-notice');
    const summary = drawer.locator('[data-delivery-summary]');
    await expect(notice.getByRole('heading', { name: 'Ships together' })).toBeVisible();
    await expect(notice).toContainText('Around mid November 2026');
    await expect(notice).toContainText('The in-stock item waits for CAREGIVERS and travels with it.');
    await expect(summary).toContainText('€48.00');
    await expect(summary).toContainText('€2.50');
    await expectCartActionsVisible(drawer);
    expect((await drawer.boundingBox())!.width).toBeCloseTo(width, 0);
    expect(await drawer.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

    await drawer.getByRole('button', { name: 'Increase quantity for Caregivers', exact: true }).click();
    await expect(summary).toContainText('€68.00');
    await drawer.getByRole('button', { name: 'Decrease quantity for Caregivers', exact: true }).click();
    await expect(summary).toContainText('€48.00');
    await drawer
      .locator('[data-store-cart-line-item]')
      .last()
      .getByRole('button', { name: 'Remove', exact: true })
      .click();
    await expect(notice).toContainText('Your order ships together when the pre-order arrives.');
    await expect(notice).not.toContainText('in-stock');
    await drawer.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(notice).toContainText('The in-stock item waits');
    await drawer
      .locator('[data-store-cart-line-item]')
      .first()
      .getByRole('button', { name: 'Remove', exact: true })
      .click();
    await expect(notice).toHaveCount(0);
    await expect(drawer.locator('[data-store-cart-checkout]')).not.toHaveClass(/preorder-action/);
    await drawer.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(notice).toHaveCount(1);
    await page.screenshot({
      path: `.codex-artifacts/preorders/mixed-cart/behavior-${width}-${testInfo.project.name}.png`,
    });

    await page.reload();
    await waitForShell(page);
    await expect(trigger).toHaveAccessibleName('Cart, 2 items');
    await trigger.click();
    await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(2);
    await drawer.getByRole('link', { name: 'Checkout', exact: true }).click();
    const pay = page.locator('[data-checkout-pay-state]');
    await expect(pay).toHaveAttribute('data-checkout-pay-state', 'ready');
    await expect(pay).toContainText('€50.50');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('blackbox.storeCart.v2')!));
    // Browser snapshots remain a convenience draft; the Worker quote revalidates payment prices.
    expect(saved.lines.map((line: { priceAmountMinor: number }) => line.priceAmountMinor)).toEqual([2500, 2000]);
    inStock = false;
    await page.reload();
    await waitForShell(page);
    await expect(page.locator('[data-delivery-summary]')).toContainText('Delivery is unavailable');
    await expect(pay).toBeDisabled();
    await expect(page.locator('[data-checkout-pay-state="ready"]')).toHaveCount(0);
  });
}

test('paid pre-order return fixture keeps its rail and keyboard action usable at 390px', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const consoleIssues: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') consoleIssues.push(message.text());
  });
  // Named UI fixture only: the actual mixed payment and return are recorded in acceptance-local.
  const checkoutState = {
    checkoutSessionId: 'cs_fixture_preorder_paid_390',
    orderStatus: 'paid',
    paymentStatus: 'paid',
    state: 'paid',
    status: 'complete',
    preorder: { shipEstimate: { kind: 'month', month: '2026-11', part: 'mid' } },
    shippingLocker: {
      country_code: 'GR',
      locker_id: '4',
      locker_name_or_label: 'ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234',
    },
  } satisfies PublicApiComponents['schemas']['CheckoutState'];
  await page.route(`**/api/checkout/sessions/${checkoutState.checkoutSessionId}/state`, (route) =>
    route.fulfill({ json: checkoutState }),
  );
  await page.goto(`store/checkout/return/?session_id=${checkoutState.checkoutSessionId}`);
  await waitForShell(page);
  await waitForIsland(page, 'CheckoutReturnStatus');

  const screen = page.locator('[data-checkout-success-screen]');
  await expect(screen.getByRole('heading', { name: /pre-order confirmed/i })).toBeVisible();
  await expect(screen.getByText('Payment is confirmed and your pre-order is recorded.', { exact: true })).toBeVisible();
  const rail = screen.locator('[data-checkout-next-steps]');
  await expect(rail.getByRole('heading', { name: /what happens next/i })).toBeVisible();
  await expect(rail.getByRole('listitem')).toHaveCount(3);
  await expect(
    rail.getByText(
      'Your whole order is sent together when the pre-order arrives, expected around mid November 2026. We email you if that changes.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    rail.getByText('BOX NOW details will follow once the shipment is arranged.', { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.innerWidth)).toBe(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const item of await rail.getByRole('listitem').all()) {
    const bounds = await item.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  }

  const shopping = screen.getByRole('link', { name: /continue shopping/i });
  await shopping.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(shopping).toBeFocused();
  await expect(shopping).toBeInViewport({ ratio: 1 });
  expect(await shopping.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
  expect(await shopping.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
  expect(consoleIssues).toEqual([]);
  await page.screenshot({
    path: `.codex-artifacts/preorders/paid-return-390fixture-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
