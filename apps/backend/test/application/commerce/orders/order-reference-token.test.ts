import { describe, expect, it } from 'vitest';

import { createCheckoutOrderReferenceToken } from '../../../../src/application/commerce/orders';

describe('CheckoutOrderReferenceToken', () => {
  it('formats the visible reference from the compact order id', () => {
    expect(
      createCheckoutOrderReferenceToken({
        checkoutSessionId: 'cs_test_1234567890',
        orderId: 'order_12345-abcde-67890',
      }),
    ).toBe('BBR-ORDER12345');
  });

  it('falls back to a sanitized checkout session suffix when the order id has no token characters', () => {
    expect(
      createCheckoutOrderReferenceToken({
        checkoutSessionId: 'cs_test_1234567890',
        orderId: '---',
      }),
    ).toBe('BBR-1234567890');
  });

  it('uses UNKNOWN when neither identity can produce a readable token', () => {
    expect(
      createCheckoutOrderReferenceToken({
        checkoutSessionId: '---',
        orderId: '---',
      }),
    ).toBe('BBR-UNKNOWN');
  });
});
