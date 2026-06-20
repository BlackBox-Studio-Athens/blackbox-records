import type { CheckoutReconciliation } from '../checkout/reconcile-checkout-session';
import type { CheckoutOrderLineRecord, CheckoutOrderRecord } from '../../../domain/commerce/repositories/spi';
import { createCheckoutOrderReferenceToken, type CheckoutOrderReferenceToken } from './order-reference-token';

export type CheckoutOrderPaidLineItem = {
  quantity: number;
  storeItemSlug: string;
  stripePriceId: string | null;
  variantId: string;
};

export type CheckoutOrderPaid = {
  amountTotalMinor: number | null;
  checkoutSessionId: string;
  currencyCode: string | null;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  lineItems: CheckoutOrderPaidLineItem[];
  newsletterOptIn: boolean;
  occurredAt: Date;
  orderId: string;
  orderReference: CheckoutOrderReferenceToken;
  paidAt: Date | null;
  paymentStatus: 'paid';
  shippingAddress: CheckoutReconciliation['source']['shippingAddress'];
  stripePaymentIntentId: string | null;
};

export function createCheckoutOrderPaidEvent(input: {
  lineItems: CheckoutOrderLineRecord[];
  occurredAt: Date;
  order: CheckoutOrderRecord;
  reconciliation: CheckoutReconciliation;
}): CheckoutOrderPaid {
  return {
    amountTotalMinor: input.reconciliation.source.amountTotalMinor,
    checkoutSessionId: input.reconciliation.source.checkoutSessionId,
    currencyCode: input.reconciliation.source.currencyCode,
    customerEmail: input.reconciliation.source.customer.email,
    customerName: input.reconciliation.source.customer.name,
    customerPhone: input.reconciliation.source.customer.phone,
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
    }),
    paidAt: input.order.paidAt,
    paymentStatus: 'paid',
    shippingAddress: input.reconciliation.source.shippingAddress,
    stripePaymentIntentId: input.reconciliation.source.stripePaymentIntentId,
  };
}
