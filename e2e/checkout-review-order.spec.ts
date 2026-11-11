import { expect, expectNoHorizontalOverflow, test, waitForIsland, waitForShell } from './fixtures';

const titles = [
  'Anarchotribal, a very long record title for a narrow checkout screen',
  'Barren Point, another extended vinyl edition title',
];

for (const width of [320, 390, 768, 1440]) {
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
      // A remembered locker lets the review reach payment without opening BOX NOW's map.
      localStorage.setItem(
        'blackbox-boxnow-last-locker',
        JSON.stringify({ lockerId: '7721', name: 'BOX NOW STORE - Ακαδημίας 86 (Αθήνα)', countryCode: 'GR' }),
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
    await expect(pay).toBeDisabled();
    await page.locator('[data-checkout-locker-panel]').getByRole('button', { name: 'Use this locker' }).click();
    await expect(pay).toBeEnabled();
    await expect(payment.locator('.checkout-review__total')).toContainText('€58.50');
    const stripe = payment.locator('[data-checkout-stripe-badge]');
    await expect(stripe).toHaveAccessibleName('Powered by Stripe');
    await expect(stripe).toBeVisible();
    // The badge mounts once a locker is chosen, so its image may still be loading.
    await expect
      .poll(() => stripe.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0))
      .toBe(true);
    const buttonBox = (await pay.boundingBox())!;
    const stripeBox = (await stripe.boundingBox())!;
    expect(stripeBox.y).toBeGreaterThanOrEqual(buttonBox.y + buttonBox.height);
    expect(Math.abs(stripeBox.x + stripeBox.width / 2 - (buttonBox.x + buttonBox.width / 2))).toBeLessThan(1);
    const support = payment.getByRole('link', { name: 'Purchase help', exact: true });
    expect((await support.boundingBox())!.y).toBeGreaterThan(stripeBox.y + stripeBox.height);
    await expect(payment).toContainText('Stripe also asks for a street address; it is not used for delivery.');
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
      // The spec keeps the total and the payment action in the first 1440x900 view. With the BOX NOW locker panel
      // above Review and pay, the Stripe badge under the button may sit just below the fold.
      await expect(payment.locator('.checkout-review__total')).toBeInViewport({ ratio: 1 });
      await expect(pay).toBeInViewport({ ratio: 1 });
    }
    expect(
      await page.locator('.checkout-review__columns').evaluate((columns) => {
        const review = columns.querySelector('.checkout-review__summary')!;
        const paymentPanel = columns.querySelector('.checkout-review__payment')!;
        return Boolean(review.compareDocumentPosition(paymentPanel) & Node.DOCUMENT_POSITION_FOLLOWING);
      }),
    ).toBe(true);
    const reviewBox = (await summary.boundingBox())!;
    // The payment column now opens with the locker panel; compare the column, not the Review and pay card.
    const payBox = (await page.locator('.checkout-review__payment').boundingBox())!;
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
