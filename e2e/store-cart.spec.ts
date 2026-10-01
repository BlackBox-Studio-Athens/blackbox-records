import { expect, localRepresentativePaths, test, waitForIsland, waitForShell } from './fixtures';

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

  await page.goto('store/checkout/');
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
