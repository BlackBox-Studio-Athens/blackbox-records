import { describe, expect, it } from 'vitest';

import { createCheckoutOrderReferenceToken } from '../../../../src/application/commerce/orders';

describe('CheckoutOrderReferenceToken', () => {
  it('formats a human-readable three-word label with the paid date', () => {
    const reference = createCheckoutOrderReferenceToken({
      checkoutSessionId: 'cs_test_1234567890',
      orderId: 'order_12345-abcde-67890',
      referenceDate: new Date('2026-04-25T11:00:00.000Z'),
    });

    expect(reference).toMatch(/^BBR-2026-04-25-[A-Z]+-[A-Z]+-[A-Z]+$/);
  });

  it('uses the same reference for the same order identity and date', () => {
    const input = {
      checkoutSessionId: 'cs_test_1234567890',
      orderId: 'order_12345-abcde-67890',
      referenceDate: new Date('2026-04-25T11:00:00.000Z'),
    };

    expect(createCheckoutOrderReferenceToken(input)).toBe(createCheckoutOrderReferenceToken(input));
  });

  it('does not expose raw order or checkout identifiers', () => {
    const reference = createCheckoutOrderReferenceToken({
      checkoutSessionId: 'cs_test_1234567890',
      orderId: 'order_12345-abcde-67890',
      referenceDate: new Date('2026-04-25T11:00:00.000Z'),
    });

    expect(reference).not.toContain('ORDER12345');
    expect(reference).not.toContain('CS_TEST');
    expect(reference).not.toContain('1234567890');
  });
});
