export type CheckoutOrderReferenceToken = string & {
  readonly __checkoutOrderReferenceToken: unique symbol;
};

const CHECKOUT_ORDER_REFERENCE_PREFIX = 'BBR';
const CHECKOUT_ORDER_REFERENCE_SEGMENT_LENGTH = 10;

export function createCheckoutOrderReferenceToken(input: {
  checkoutSessionId: string;
  orderId: string;
}): CheckoutOrderReferenceToken {
  const orderSegment = createLeadingReferenceSegment(input.orderId);
  const fallbackSegment = createTrailingReferenceSegment(input.checkoutSessionId);

  return formatCheckoutOrderReferenceToken(orderSegment || fallbackSegment || 'UNKNOWN');
}

export function formatCheckoutOrderReferenceToken(segment: string): CheckoutOrderReferenceToken {
  return `${CHECKOUT_ORDER_REFERENCE_PREFIX}-${segment}` as CheckoutOrderReferenceToken;
}

function createLeadingReferenceSegment(value: string): string {
  return sanitizeReferenceSegment(value).slice(0, CHECKOUT_ORDER_REFERENCE_SEGMENT_LENGTH);
}

function createTrailingReferenceSegment(value: string): string {
  return sanitizeReferenceSegment(value).slice(-CHECKOUT_ORDER_REFERENCE_SEGMENT_LENGTH);
}

function sanitizeReferenceSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}
