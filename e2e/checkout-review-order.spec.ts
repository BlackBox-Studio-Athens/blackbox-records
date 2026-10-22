import { expect, expectNoHorizontalOverflow, test, waitForIsland, waitForShell } from './fixtures';

const titles = [
  'Anarchotribal, a very long record title for a narrow checkout screen',
  'Barren Point, another extended vinyl edition title',
];

for (const width of [320, 390, 768, 1440]) {
  test(`item purchase copy is compact and pre-order facts remain visible at ${width}px${width < 768 ? ' @phone' : ''}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('store/disintegration-black-vinyl-lp/');
    await waitForShell(page);
    const information = page.locator('[data-purchase-information]');
    await expect(information).toHaveCount(1);
    await expect(information).toContainText('Shipping calculated in your cart.');
    await expect(information).toContainText('BOX NOW locker delivery within Greece.');
    await expect(information.getByRole('link', { name: 'Delivery & returns', exact: true })).toHaveAttribute(
      'href',
      /\/terms\/$/,
    );
    await expect(information.getByRole('link')).toHaveCount(1);
    await expect(page.locator('.preorder-facts')).toHaveCount(0);
    await expect(
      page.getByText('Add it to the cart to review this item before checkout.', { exact: true }),
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await testInfo.attach(`stocked-item-${width}px`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    await page.route('**/api/store/items/disintegration-black-vinyl-lp', (route) =>
      route.fulfill({
        json: {
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'disintegration-black-vinyl-lp_standard',
          availability: { label: 'Pre-order', status: 'available' },
          canCheckout: true,
          catalogStatus: 'ready',
          price: { kind: 'fixed', amountMinor: 2800, currencyCode: 'EUR', display: '€28.00' },
          preorder: { shipEstimate: { kind: 'month', month: '2026-11', part: 'mid' } },
        },
      }),
    );
    await page.reload();
    await waitForShell(page);
    const facts = page.locator('.preorder-facts');
    await expect(facts).toContainText('Around mid November 2026');
    await expect(facts).toContainText('Charged in full today');
    // The inline action; on phones the buy bar repeats it with the same name until the shopper reaches it.
    const action = page.locator('[data-store-item-add-to-cart]');
    await expect(action).toHaveAccessibleName('Pre-order');
    await expect(action).toBeEnabled();
    expect((await facts.boundingBox())!.y + (await facts.boundingBox())!.height).toBeLessThanOrEqual(
      (await action.boundingBox())!.y,
    );
    await expectNoHorizontalOverflow(page);
    await testInfo.attach(`preorder-item-${width}px`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

  test(`checkout item review precedes payment at ${width}px${width < 768 ? ' @phone' : ''}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await page.addInitScript((savedTitles) => {
      localStorage.setItem(
        'blackbox.storeCart.v2',
        JSON.stringify({
          lines: savedTitles.map((title, index) => ({
            availabilityLabel: 'Available',
            image: null,
            imageAlt: null,
            optionLabel: 'Vinyl',
            priceAmountMinor: 2800,
            priceCurrencyCode: 'EUR',
            priceDisplay: '€28.00',
            priceKind: 'fixed',
            quantity: 1,
            storeItemSlug: index ? 'barren-point-vinyl' : 'anarchotribal-vinyl',
            subtitle: index ? 'Chronoboros' : 'Ouranopithecus',
            title,
            variantId: index ? 'barren-point-vinyl_standard' : 'anarchotribal-vinyl_standard',
          })),
        }),
      );
    }, titles);
    await page.route('**/api/store/capabilities', (route) =>
      route.fulfill({
        json: {
          pricing: {
            vatDisclosure: 'VAT included',
            deliveryQuantityBands: [{ maxUnits: null, amountMinor: 250 }],
            currencyCode: 'EUR',
          },
          nativeCheckout: { enabled: true, unavailableReason: null },
        },
      }),
    );
    const quotedQuantities: number[][] = [];
    await page.route('**/api/store/delivery-quote', (route) => {
      const { lines } = route.request().postDataJSON();
      const quantities = lines.map((line: { quantity: number }) => line.quantity);
      quotedQuantities.push(quantities);
      const merchandiseGrossMinor = quantities.reduce((sum: number, quantity: number) => sum + quantity * 2800, 0);
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
    let paymentRequests = 0;
    await page.route('**/api/checkout/sessions', (route) => {
      paymentRequests += 1;
      return route.abort();
    });

    await page.goto('store/checkout/');
    await waitForShell(page);
    await waitForIsland(page, 'CheckoutOrderSummary');
    await waitForIsland(page, 'CheckoutOfferStatus');
    const summary = page.locator('[data-checkout-order-summary]');
    const payment = page.locator('[data-checkout-offer-status]');
    const pay = payment.getByRole('button', { name: 'Continue to Payment', exact: true });
    await expect(summary).toHaveCount(1);
    await expect(payment).toHaveCount(1);
    await expect(summary.getByRole('heading', { name: titles[0], exact: true })).toBeVisible();
    await expect(summary.getByRole('heading', { name: titles[1], exact: true })).toBeVisible();
    await expect(pay).toBeEnabled();
    await expect(payment.locator('.checkout-review__total')).toContainText('€58.50');
    const stripe = payment.locator('[data-checkout-stripe-badge]');
    await expect(stripe).toHaveAccessibleName('Powered by Stripe');
    await expect(stripe).toBeVisible();
    expect(await stripe.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    const buttonBox = (await pay.boundingBox())!;
    const stripeBox = (await stripe.boundingBox())!;
    expect(stripeBox.y).toBeGreaterThanOrEqual(buttonBox.y + buttonBox.height);
    expect(Math.abs(stripeBox.x + stripeBox.width / 2 - (buttonBox.x + buttonBox.width / 2))).toBeLessThan(1);
    const support = payment.getByRole('link', { name: 'Purchase help', exact: true });
    expect((await support.boundingBox())!.y).toBeGreaterThan(stripeBox.y + stripeBox.height);
    await expect(payment).toContainText('A street address collected at payment does not mean home delivery.');
    await expect(payment).not.toContainText('Payment is taken on the Stripe page');
    await expect(payment.getByRole('checkbox')).not.toBeChecked();
    await expect(page.getByRole('link', { name: 'Withdraw from an order', exact: true })).toHaveCount(1);
    const cartTrigger = page.locator('[data-store-cart-trigger]').first();
    await expect(cartTrigger).toHaveClass(/site-button--ghost/);
    await expect(cartTrigger).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)');
    await expect(cartTrigger).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    const cartBox = (await cartTrigger.boundingBox())!;
    expect(cartBox.width).toBeGreaterThanOrEqual(44);
    expect(cartBox.height).toBeGreaterThanOrEqual(44);
    if (width === 1440) {
      await expect(pay).toBeInViewport({ ratio: 1 });
      await expect(stripe).toBeInViewport({ ratio: 1 });
    }
    expect(
      await page.locator('.checkout-review__columns').evaluate((columns) => {
        const review = columns.querySelector('.checkout-review__summary')!;
        const paymentPanel = columns.querySelector('.checkout-review__payment')!;
        return Boolean(review.compareDocumentPosition(paymentPanel) & Node.DOCUMENT_POSITION_FOLLOWING);
      }),
    ).toBe(true);
    const reviewBox = (await summary.boundingBox())!;
    const payBox = (await payment.boundingBox())!;
    if (width < 768) {
      expect(reviewBox.y + reviewBox.height).toBeLessThanOrEqual(payBox.y);
    } else {
      expect(payBox.x + payBox.width).toBeLessThan(reviewBox.x);
      expect(Math.abs(reviewBox.y - payBox.y)).toBeLessThanOrEqual(1);
    }
    await expectNoHorizontalOverflow(page);
    await testInfo.attach(`checkout-${width}px`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    const editor = summary.locator('summary');
    await page.locator('.checkout-review__continue').focus();
    await page.keyboard.press('Tab');
    await expect(editor).toBeFocused();
    await page.keyboard.press('Enter');
    const decrease = summary.getByRole('button', { name: `Decrease quantity for ${titles[0]}`, exact: true });
    const increase = summary.getByRole('button', { name: `Increase quantity for ${titles[0]}`, exact: true });
    await page.keyboard.press('Tab');
    await expect(decrease).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(increase).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(payment.locator('.checkout-review__total')).toContainText('€86.50');
    expect(quotedQuantities).toContainEqual([2, 1]);
    await expect(summary.locator('.checkout-summary__item').first()).toContainText('2 ×');
    await expect(increase).toBeFocused();
    await expectNoHorizontalOverflow(page);

    // Closing the native editor restores the short tab path through disclosure and consent to payment.
    await editor.focus();
    await page.keyboard.press('Enter');
    await expect(summary.locator('details')).not.toHaveAttribute('open', '');
    const checkbox = payment.getByRole('checkbox');
    let reachedConsent = false;
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab');
      if (await checkbox.evaluate((element) => element === document.activeElement)) {
        reachedConsent = true;
        break;
      }
      await expect(pay).not.toBeFocused();
    }
    expect(reachedConsent).toBe(true);
    const privacy = payment.getByRole('link', { name: 'Privacy information', exact: true });
    await page.keyboard.press('Tab');
    if (await privacy.count()) {
      await expect(privacy).toBeFocused();
      await page.keyboard.press('Tab');
    }
    await expect(pay).toBeFocused();
    expect(paymentRequests).toBe(0);
  });
}
