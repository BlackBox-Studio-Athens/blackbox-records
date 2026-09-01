import type { CheckoutSessionId, PaymentIntentId, StoreItemSlug, StripePriceId, VariantId } from '../ids';
import type { CartQuantity } from '../quantities';

export type OrderStatus = 'pending_payment' | 'paid' | 'not_paid' | 'needs_review';

export type ShippingLockerSnapshot = {
  locker_id: string;
  country_code: 'GR';
  locker_name_or_label: string;
};

export type CheckoutOrderRecord = {
  amountTotalMinor: number | null;
  id: string;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  checkoutSessionId: CheckoutSessionId | null;
  checkoutExpiresAt: Date;
  currencyCode: string | null;
  newsletterConsentAt: Date | null;
  newsletterConsentCopyVersion: string | null;
  newsletterOptIn: boolean | null;
  recipientName: string | null;
  shopperEmail: string | null;
  shopperPhone: string | null;
  shippingAddressCity: string | null;
  shippingAddressCountryCode: string | null;
  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingAddressPostalCode: string | null;
  shippingAddressState: string | null;
  stripePaymentIntentId: PaymentIntentId | null;
  shippingLocker: ShippingLockerSnapshot | null;
  status: OrderStatus;
  statusUpdatedAt: Date;
  paidAt: Date | null;
  notPaidAt: Date | null;
  needsReviewAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lines?: CheckoutOrderLineRecord[];
};

export const EMPTY_PAID_CHECKOUT_ORDER_FIELDS = {
  amountTotalMinor: null,
  currencyCode: null,
  newsletterConsentAt: null,
  newsletterConsentCopyVersion: null,
  newsletterOptIn: null,
  recipientName: null,
  shopperEmail: null,
  shopperPhone: null,
  shippingAddressCity: null,
  shippingAddressCountryCode: null,
  shippingAddressLine1: null,
  shippingAddressLine2: null,
  shippingAddressPostalCode: null,
  shippingAddressState: null,
} as const satisfies Pick<
  CheckoutOrderRecord,
  | 'amountTotalMinor'
  | 'currencyCode'
  | 'newsletterConsentAt'
  | 'newsletterConsentCopyVersion'
  | 'newsletterOptIn'
  | 'recipientName'
  | 'shopperEmail'
  | 'shopperPhone'
  | 'shippingAddressCity'
  | 'shippingAddressCountryCode'
  | 'shippingAddressLine1'
  | 'shippingAddressLine2'
  | 'shippingAddressPostalCode'
  | 'shippingAddressState'
>;

type CurrentPaidNewsletterConsent =
  | {
      newsletterConsentAt: Date;
      newsletterConsentCopyVersion: string;
      newsletterOptIn: true;
    }
  | {
      newsletterConsentAt: null;
      newsletterConsentCopyVersion: null;
      newsletterOptIn: false;
    };

export type CurrentPaidCheckoutOrderLine = Omit<
  CheckoutOrderLineRecord,
  'displayName' | 'lineAmountMinor' | 'unitAmountMinor'
> & {
  displayName: string;
  lineAmountMinor: number;
  unitAmountMinor: number;
};

export type CurrentPaidCheckoutOrder = Omit<
  CheckoutOrderRecord,
  | 'amountTotalMinor'
  | 'checkoutSessionId'
  | 'currencyCode'
  | 'lines'
  | 'newsletterConsentAt'
  | 'newsletterConsentCopyVersion'
  | 'newsletterOptIn'
  | 'paidAt'
  | 'recipientName'
  | 'shopperEmail'
  | 'shippingAddressCity'
  | 'shippingAddressCountryCode'
  | 'shippingAddressLine1'
  | 'shippingAddressPostalCode'
  | 'status'
> &
  CurrentPaidNewsletterConsent & {
    amountTotalMinor: number;
    checkoutSessionId: CheckoutSessionId;
    currencyCode: 'EUR';
    lines: [CurrentPaidCheckoutOrderLine, ...CurrentPaidCheckoutOrderLine[]];
    paidAt: Date;
    recipientName: string;
    shopperEmail: string;
    shippingAddressCity: string;
    shippingAddressCountryCode: 'GR';
    shippingAddressLine1: string;
    shippingAddressPostalCode: string;
    status: 'paid';
  };

export type PaidCheckoutFulfillmentReadResult =
  | { kind: 'current'; order: CurrentPaidCheckoutOrder }
  | { kind: 'incomplete'; order: CheckoutOrderRecord; reason: 'incomplete_paid_fulfillment' }
  | { kind: 'not_paid'; order: CheckoutOrderRecord };

export function readPaidCheckoutFulfillment(order: CheckoutOrderRecord): PaidCheckoutFulfillmentReadResult {
  if (order.status !== 'paid') return { kind: 'not_paid', order };

  const lines = order.lines ?? [];
  const hasCompleteNewsletterConsent =
    order.newsletterOptIn === false
      ? order.newsletterConsentAt === null && order.newsletterConsentCopyVersion === null
      : order.newsletterOptIn === true &&
        isValidDate(order.newsletterConsentAt) &&
        isPresentString(order.newsletterConsentCopyVersion);

  if (
    !isPositiveInteger(order.amountTotalMinor) ||
    !order.checkoutSessionId ||
    order.currencyCode !== 'EUR' ||
    !isValidDate(order.paidAt) ||
    !isPresentString(order.recipientName) ||
    !isPresentString(order.shopperEmail) ||
    !isOptionalPresentString(order.shopperPhone) ||
    !isPresentString(order.shippingAddressCity) ||
    order.shippingAddressCountryCode !== 'GR' ||
    !isPresentString(order.shippingAddressLine1) ||
    !isOptionalPresentString(order.shippingAddressLine2) ||
    !isPresentString(order.shippingAddressPostalCode) ||
    !isOptionalPresentString(order.shippingAddressState) ||
    !hasCompleteNewsletterConsent ||
    lines.length === 0 ||
    !lines.every(isCurrentPaidCheckoutOrderLine)
  ) {
    return { kind: 'incomplete', order, reason: 'incomplete_paid_fulfillment' };
  }

  return { kind: 'current', order: order as CurrentPaidCheckoutOrder };
}

function isCurrentPaidCheckoutOrderLine(line: CheckoutOrderLineRecord): line is CurrentPaidCheckoutOrderLine {
  return (
    isPresentString(line.displayName) &&
    isOptionalPresentString(line.optionLabel) &&
    isPositiveInteger(line.quantity) &&
    isPositiveInteger(line.unitAmountMinor) &&
    isPositiveInteger(line.lineAmountMinor) &&
    line.lineAmountMinor === line.unitAmountMinor * line.quantity
  );
}

function isOptionalPresentString(value: string | null): boolean {
  return value === null || isPresentString(value);
}

function isPositiveInteger(value: number | null): value is number {
  return Number.isInteger(value) && value !== null && value > 0;
}

function isPresentString(value: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidDate(value: Date | null): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export type CheckoutOrderLineRecord = {
  displayName: string | null;
  id: string;
  lineAmountMinor: number | null;
  optionLabel: string | null;
  orderId: string;
  stripePriceId: StripePriceId | null;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  quantity: CartQuantity;
  unitAmountMinor: number | null;
  createdAt: Date;
};

export type CreatePendingCheckoutOrderInput = {
  lines?: CreatePendingCheckoutOrderLineInput[];
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  checkoutSessionId: CheckoutSessionId;
  checkoutExpiresAt?: Date;
  shippingLocker: ShippingLockerSnapshot | null;
  stripePaymentIntentId?: PaymentIntentId | null;
  createdAt?: Date;
};

export type CreatePendingCheckoutOrderLineInput = {
  displayName: string | null;
  lineAmountMinor: number | null;
  optionLabel: string | null;
  quantity: CartQuantity;
  stripePriceId?: StripePriceId | null;
  storeItemSlug: StoreItemSlug;
  unitAmountMinor: number | null;
  variantId: VariantId;
};

export type CheckoutOrderTransitionInput = {
  status: OrderStatus;
  statusUpdatedAt: Date;
  stripePaymentIntentId?: PaymentIntentId | null;
};

export type ListRecentCheckoutOrdersInput = {
  limit: number;
  status?: OrderStatus | null;
};

export interface OrderStateRepository {
  createPending(input: CreatePendingCheckoutOrderInput): Promise<CheckoutOrderRecord>;
  findByCheckoutSessionId(checkoutSessionId: CheckoutSessionId): Promise<CheckoutOrderRecord | null>;
  listRecent(input: ListRecentCheckoutOrdersInput): Promise<CheckoutOrderRecord[]>;
  saveTransition(
    checkoutSessionId: CheckoutSessionId,
    transition: CheckoutOrderTransitionInput,
  ): Promise<CheckoutOrderRecord | null>;
}
