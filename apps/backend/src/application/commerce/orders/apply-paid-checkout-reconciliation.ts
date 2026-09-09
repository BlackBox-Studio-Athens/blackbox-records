import type { CheckoutReconciliation } from '../checkout/reconcile-checkout-session';
import type {
  CheckoutOrderRecord,
  CheckoutOrderLineRecord,
  StockChangeRecord,
  StockRecord,
  OrderStateRepository,
  PaidCheckoutFulfillmentReadResult,
  OrderReviewReason,
} from '../../../domain/commerce/repositories/spi';
import { readPaidCheckoutFulfillment } from '../../../domain/commerce/repositories/spi';
import {
  createCartQuantity,
  type CartQuantity,
  type CheckoutSessionId,
  type StripePriceId,
} from '../../../domain/commerce';
import {
  createCheckoutOrderPaidEvent,
  readStripeCollectedPaidOrderFulfillmentDetails,
  type CheckoutOrderPaid,
} from './checkout-order-paid-event';
import { InvalidOrderTransitionError } from './errors';
import type { PaidCheckoutFinalizationRepository } from './paid-checkout-finalization';

export type ApplyPaidCheckoutReconciliationResult =
  | {
      checkoutOrderPaid: CheckoutOrderPaid;
      kind: 'applied';
      order: CheckoutOrderRecord;
      stock: StockRecord;
      stockChange: StockChangeRecord;
    }
  | {
      kind: 'ignored';
      reason: 'not_paid_recommendation';
    }
  | {
      checkoutSessionId: CheckoutSessionId;
      kind: 'missing_order';
    }
  | {
      kind: 'rejected';
      reason: string;
    }
  | {
      kind: 'needs_review';
      order: CheckoutOrderRecord;
      reason: string;
    }
  | {
      kind: 'replay';
      order: CheckoutOrderRecord;
      paidFulfillment: PaidCheckoutFulfillmentReadResult;
    }
  | {
      kind: 'stock_unavailable';
      order: CheckoutOrderRecord;
      reason: string;
    };

export async function applyPaidCheckoutReconciliation(
  orders: OrderStateRepository,
  paidCheckoutFinalizer: PaidCheckoutFinalizationRepository,
  reconciliation: CheckoutReconciliation,
  appliedAt = new Date(),
  finalizedLineItems: FinalizedPaidCheckoutLineItem[] = [],
): Promise<ApplyPaidCheckoutReconciliationResult> {
  if (reconciliation.recommendedOrderStatus !== 'paid') {
    return {
      kind: 'ignored',
      reason: 'not_paid_recommendation',
    };
  }

  const checkoutSessionId = reconciliation.source.checkoutSessionId;
  const currentOrder = await orders.findByCheckoutSessionId(checkoutSessionId);

  if (!currentOrder) {
    return {
      checkoutSessionId,
      kind: 'missing_order',
    };
  }

  if (currentOrder.status !== 'pending_payment') {
    return { kind: 'replay', order: currentOrder, paidFulfillment: readPaidCheckoutFulfillment(currentOrder) };
  }

  async function recordReview(reason: OrderReviewReason): Promise<ApplyPaidCheckoutReconciliationResult> {
    const order = await orders.saveTransition(checkoutSessionId, {
      expectedStatus: 'pending_payment',
      status: 'needs_review',
      statusUpdatedAt: appliedAt,
      stripePaymentIntentId: reconciliation.source.stripePaymentIntentId,
      needsReviewReason: reason,
    });
    if (!order || order.status === 'pending_payment') throw new Error('Paid checkout review was not saved.');
    if (order.status !== 'needs_review' || order.needsReviewReason !== reason) {
      return { kind: 'replay', order, paidFulfillment: readPaidCheckoutFulfillment(order) };
    }
    return { kind: 'needs_review', order, reason };
  }

  const persistedOrderLines = readCheckoutOrderLines(currentOrder);
  const reconciledOrderLines = reconcileFinalizedLineItems(persistedOrderLines, finalizedLineItems);

  if (!reconciledOrderLines) {
    return recordReview('line_mismatch');
  }

  let paidFulfillmentDetails;
  try {
    paidFulfillmentDetails = readStripeCollectedPaidOrderFulfillmentDetails(reconciliation);
  } catch {
    return recordReview('incomplete_fulfillment');
  }
  const amountTotalMinor = reconciliation.source.amountTotalMinor;
  const currencyCode = reconciliation.source.currencyCode;

  if (!Number.isInteger(amountTotalMinor) || !amountTotalMinor || amountTotalMinor < 1 || currencyCode !== 'EUR') {
    throw new Error('Paid checkout payment details are incomplete.');
  }

  const newsletterConsentCopyVersion = reconciliation.source.newsletterOptIn
    ? (reconciliation.source.newsletterConsentCopyVersion?.trim() ?? null)
    : null;

  if (reconciliation.source.newsletterOptIn && !newsletterConsentCopyVersion) {
    throw new Error('Paid checkout newsletter consent details are incomplete.');
  }

  try {
    const finalizationResult = await paidCheckoutFinalizer.finalizePaidCheckout({
      amountTotalMinor,
      checkoutSessionId,
      currencyCode,
      lineItems: reconciledOrderLines.map((line) => ({
        lineAmountMinor: line.lineAmountMinor!,
        quantity: line.quantity,
        unitAmountMinor: line.unitAmountMinor!,
        variantId: line.variantId,
      })),
      newsletterConsentAt: reconciliation.source.newsletterOptIn ? appliedAt : null,
      newsletterConsentCopyVersion,
      newsletterOptIn: reconciliation.source.newsletterOptIn,
      recipientName: paidFulfillmentDetails.recipientName,
      shippingAddressCity: paidFulfillmentDetails.shippingAddress.city,
      shippingAddressCountryCode: paidFulfillmentDetails.shippingAddress.country,
      shippingAddressLine1: paidFulfillmentDetails.shippingAddress.line1,
      shippingAddressLine2: paidFulfillmentDetails.shippingAddress.line2,
      shippingAddressPostalCode: paidFulfillmentDetails.shippingAddress.postalCode,
      shippingAddressState: paidFulfillmentDetails.shippingAddress.state,
      shopperEmail: paidFulfillmentDetails.shopperContact.email,
      shopperPhone: paidFulfillmentDetails.shopperContact.phone,
      stripePaymentIntentId: reconciliation.source.stripePaymentIntentId,
      transitionedAt: appliedAt,
    });

    if (finalizationResult.kind === 'replay') {
      return {
        kind: 'replay',
        order: finalizationResult.order,
        paidFulfillment: finalizationResult.paidFulfillment,
      };
    }

    if (finalizationResult.kind === 'stock_unavailable') {
      return recordReview('stock_unavailable');
    }

    return {
      checkoutOrderPaid: createCheckoutOrderPaidEvent({
        fulfillment: paidFulfillmentDetails,
        lineItems: reconciledOrderLines,
        occurredAt: appliedAt,
        order: finalizationResult.order,
        reconciliation,
      }),
      kind: 'applied',
      order: finalizationResult.order,
      stock: finalizationResult.stock[0]!,
      stockChange: finalizationResult.stockChanges[0]!,
    };
  } catch (error) {
    if (error instanceof InvalidOrderTransitionError) {
      const order = await orders.findByCheckoutSessionId(checkoutSessionId);
      if (order && order.status !== 'pending_payment') {
        return { kind: 'replay', order, paidFulfillment: readPaidCheckoutFulfillment(order) };
      }
    }

    throw error;
  }
}

export type FinalizedPaidCheckoutLineItem = {
  lineAmountMinor: number | null;
  quantity: CartQuantity;
  stripePriceId: StripePriceId;
};

function readCheckoutOrderLines(order: CheckoutOrderRecord): CheckoutOrderLineRecord[] {
  return order.lines?.length
    ? order.lines
    : [
        {
          createdAt: order.createdAt,
          displayName: null,
          id: order.id,
          lineAmountMinor: null,
          optionLabel: null,
          orderId: order.id,
          quantity: createCartQuantity(1),
          storeItemSlug: order.storeItemSlug,
          stripePriceId: null,
          unitAmountMinor: null,
          variantId: order.variantId,
        },
      ];
}

function reconcileFinalizedLineItems(
  orderLines: CheckoutOrderLineRecord[],
  finalizedLineItems: FinalizedPaidCheckoutLineItem[],
): CheckoutOrderLineRecord[] | null {
  if (finalizedLineItems.length === 0) {
    return orderLines.every((line) => line.displayName && line.lineAmountMinor && line.unitAmountMinor)
      ? orderLines
      : null;
  }

  const finalizedByStripePriceId = new Map<string, { lineAmountMinor: number; quantity: number }>();

  for (const providerFinalizedLineItem of finalizedLineItems) {
    if (
      !Number.isInteger(providerFinalizedLineItem.quantity) ||
      providerFinalizedLineItem.quantity < 1 ||
      !Number.isInteger(providerFinalizedLineItem.lineAmountMinor) ||
      !providerFinalizedLineItem.lineAmountMinor ||
      providerFinalizedLineItem.lineAmountMinor < 1
    ) {
      return null;
    }

    const current = finalizedByStripePriceId.get(providerFinalizedLineItem.stripePriceId);
    finalizedByStripePriceId.set(providerFinalizedLineItem.stripePriceId, {
      lineAmountMinor: (current?.lineAmountMinor ?? 0) + providerFinalizedLineItem.lineAmountMinor,
      quantity: (current?.quantity ?? 0) + providerFinalizedLineItem.quantity,
    });
  }

  const reconciledLines: CheckoutOrderLineRecord[] = [];

  for (const line of orderLines) {
    if (!line.stripePriceId) {
      return null;
    }

    const finalized = finalizedByStripePriceId.get(line.stripePriceId);
    if (!finalized || finalized.lineAmountMinor % finalized.quantity !== 0) return null;

    reconciledLines.push({
      ...line,
      lineAmountMinor: finalized.lineAmountMinor,
      quantity: createCartQuantity(finalized.quantity),
      unitAmountMinor: finalized.lineAmountMinor / finalized.quantity,
    });
  }

  if (reconciledLines.length !== finalizedByStripePriceId.size) {
    return null;
  }

  if (reconciledLines.some((line) => !line.displayName || !line.lineAmountMinor || !line.unitAmountMinor)) return null;

  return reconciledLines;
}
