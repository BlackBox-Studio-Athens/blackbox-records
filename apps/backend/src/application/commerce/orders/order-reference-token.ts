import { uniqueNamesGenerator } from 'unique-names-generator';

export type CheckoutOrderReferenceToken = string & {
  readonly __checkoutOrderReferenceToken: unique symbol;
};

const CHECKOUT_ORDER_REFERENCE_PREFIX = 'BBR';
const CHECKOUT_ORDER_REFERENCE_WORDS = [
  [
    'analog',
    'basement',
    'collective',
    'direct',
    'handmade',
    'heavy',
    'local',
    'loud',
    'raw',
    'smallrun',
    'underground',
    'xerox',
  ],
  [
    'amp',
    'cassette',
    'distro',
    'flyer',
    'mailorder',
    'pressing',
    'record',
    'runout',
    'shelf',
    'sleeve',
    'split',
    'vinyl',
  ],
  ['carry', 'fold', 'fulfill', 'pack', 'press', 'release', 'route', 'seal', 'ship', 'stack', 'stamp', 'wire'],
];

export function createCheckoutOrderReferenceToken(input: {
  checkoutSessionId: string;
  orderId: string;
  referenceDate?: Date | null;
}): CheckoutOrderReferenceToken {
  const labelSegment = uniqueNamesGenerator({
    dictionaries: CHECKOUT_ORDER_REFERENCE_WORDS,
    length: 3,
    seed: createReferenceSeed(input.orderId, input.checkoutSessionId),
    separator: '-',
    style: 'upperCase',
  });
  const dateSegment = input.referenceDate ? `${formatReferenceDate(input.referenceDate)}-` : '';

  return formatCheckoutOrderReferenceToken(`${dateSegment}${labelSegment}`);
}

export function formatCheckoutOrderReferenceToken(segment: string): CheckoutOrderReferenceToken {
  return `${CHECKOUT_ORDER_REFERENCE_PREFIX}-${segment}` as CheckoutOrderReferenceToken;
}

function createReferenceSeed(orderId: string, checkoutSessionId: string): number {
  const value = `${orderId}:${checkoutSessionId}`;
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function formatReferenceDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
