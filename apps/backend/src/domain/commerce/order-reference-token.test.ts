import { describe, expect, it } from 'vitest';

import { createCheckoutOrderReferenceToken } from './';

describe('CheckoutOrderReferenceToken', () => {
  it('formats a human-readable three-word label with the paid date', () => {
    const reference = createCheckoutOrderReferenceToken({
      checkoutSessionId: 'cs_test_1234567890',
      orderId: 'order_12345-abcde-67890',
      referenceDate: new Date('2026-04-25T11:00:00.000Z'),
    });

    expect(reference).toBe('BBR-2026-04-25-RAW-SHELF-CARRY');
  });

  it('preserves the same three-word label when the paid date is unavailable', () => {
    const reference = createCheckoutOrderReferenceToken({
      checkoutSessionId: 'cs_test_1234567890',
      orderId: 'order_12345-abcde-67890',
    });

    expect(reference).toBe('BBR-RAW-SHELF-CARRY');
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
