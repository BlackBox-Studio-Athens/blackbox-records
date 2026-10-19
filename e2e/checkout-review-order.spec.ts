import { expect, expectNoHorizontalOverflow, test, waitForIsland, waitForShell } from './fixtures';

const titles = [
  'Anarchotribal, a very long record title for a narrow checkout screen',
  'Barren Point, another extended vinyl edition title',
];

for (const width of [320, 390, 1440]) {
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
