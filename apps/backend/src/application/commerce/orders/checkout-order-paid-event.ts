import type { CheckoutReconciliation } from '../checkout';
import type { CheckoutOrderLineRecord, CheckoutOrderRecord } from '../../../domain/commerce/repositories/spi';
import { type CheckoutOrderReferenceToken, createCheckoutOrderReferenceToken } from './order-reference-token';

export type CheckoutOrderPaidLineItem = {
  quantity: number;
  storeItemSlug: string;
  stripePriceId: string | null;
  variantId: string;
};

export type CheckoutOrderPaidShippingAddress = {
  city: string;
  country: 'GR';
  line1: string;
  line2: string | null;
  postalCode: string;
  state: string | null;
};

export type CheckoutOrderPaidShopperContact = {
  email: string;
  phone: string;
};

export type CheckoutOrderPaidFulfillmentDetails = {
  shippingAddress: CheckoutOrderPaidShippingAddress;
  shopperContact: CheckoutOrderPaidShopperContact;
};

export type CheckoutOrderPaid = {
  amountTotalMinor: number | null;
  checkoutSessionId: string;
  currencyCode: string | null;
  customerName: string | null;
  lineItems: CheckoutOrderPaidLineItem[];
  newsletterOptIn: boolean;
  occurredAt: Date;
  orderId: string;
  orderReference: CheckoutOrderReferenceToken;
  paidAt: Date | null;
  paymentStatus: 'paid';
  shippingAddress: CheckoutOrderPaidShippingAddress;
  shopperContact: CheckoutOrderPaidShopperContact;
  stripePaymentIntentId: string | null;
};

export function createCheckoutOrderPaidEvent(input: {
  fulfillment: CheckoutOrderPaidFulfillmentDetails;
  lineItems: CheckoutOrderLineRecord[];
  occurredAt: Date;
  order: CheckoutOrderRecord;
  reconciliation: CheckoutReconciliation;
}): CheckoutOrderPaid {
  return {
    amountTotalMinor: input.reconciliation.source.amountTotalMinor,
    checkoutSessionId: input.reconciliation.source.checkoutSessionId,
    currencyCode: input.reconciliation.source.currencyCode,
    customerName: input.reconciliation.source.customer.name,
    lineItems: input.lineItems.map((lineItem) => ({
      quantity: lineItem.quantity,
      storeItemSlug: lineItem.storeItemSlug,
      stripePriceId: lineItem.stripePriceId,
      variantId: lineItem.variantId,
    })),
    newsletterOptIn: input.reconciliation.source.newsletterOptIn,
    occurredAt: input.occurredAt,
    orderId: input.order.id,
    orderReference: createCheckoutOrderReferenceToken({
      checkoutSessionId: input.order.checkoutSessionId,
      orderId: input.order.id,
      referenceDate: input.order.paidAt ?? input.occurredAt,
    }),
    paidAt: input.order.paidAt,
    paymentStatus: 'paid',
    shippingAddress: input.fulfillment.shippingAddress,
    shopperContact: input.fulfillment.shopperContact,
    stripePaymentIntentId: input.reconciliation.source.stripePaymentIntentId,
  };
}

/**
 * Converts Stripe's nullable Checkout Session SDK shape into BlackBox paid-order fulfillment facts.
 *
 * This is safe by construction for paid events created by this app: `StripeCheckoutGateway`
 * creates hosted Checkout Sessions with Greek shipping-address collection enabled,
 * phone-number collection enabled, and Stripe-hosted Checkout collects shopper email
 * before payment completion. After this boundary, email and fulfillment code treat
 * shipping address, shopper email, and shopper phone as required paid-order data.
 */
export function readStripeCollectedPaidOrderFulfillmentDetails(
  reconciliation: CheckoutReconciliation,
): CheckoutOrderPaidFulfillmentDetails {
  const shippingAddress = reconciliation.source.shippingAddress!;

  return {
    shippingAddress: {
      city: shippingAddress.city!,
      country: shippingAddress.country as 'GR',
      line1: shippingAddress.line1!,
      line2: shippingAddress.line2,
      postalCode: shippingAddress.postalCode!,
      state: shippingAddress.state,
    },
    shopperContact: {
      email: reconciliation.source.customer.email!,
      phone: reconciliation.source.customer.phone!,
    },
  };
}
