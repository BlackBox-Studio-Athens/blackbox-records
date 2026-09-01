import {
  logNewsletterRegistrationOutcome,
  registerNewsletterContact,
  sendPaidOrderOpsEmail,
  sendPaidOrderShopperEmail,
  type EmailOperationResult,
  type EmailProviderGateway,
  type EmailProviderSafeReason,
  type EmailRuntimeConfig,
  type NewsletterRegistrationResult,
  type PaidOrderEmailInput,
} from '../../email';
import type { CurrentPaidCheckoutOrder } from '../../../domain/commerce/repositories/spi';
import { createCheckoutOrderReferenceToken } from './order-reference-token';

export type PaidOrderDeliveryKind = 'newsletter_registration' | 'ops_fulfillment' | 'shopper_confirmation';

export type ClaimedPaidOrderDelivery = {
  attemptCount: number;
  createdAt: Date;
  id: string;
  kind: PaidOrderDeliveryKind;
  leaseUntil: Date;
  nextAttemptAt: Date;
  orderId: string;
  status: 'pending';
  updatedAt: Date;
};

export type ClaimDuePaidOrderDeliveryResult =
  { delivery: ClaimedPaidOrderDelivery; kind: 'claimed' } | { kind: 'not_claimed' };

export interface PaidOrderDeliveryRepository {
  claimDue(input: { claimedAt: Date; deliveryId: string | null }): Promise<ClaimDuePaidOrderDeliveryResult>;
}

export type PaidOrderDeliveryAttemptResult =
  { kind: 'delivered' } | { kind: 'not_delivered'; retryable: boolean; safeReason: EmailProviderSafeReason };

export async function attemptPaidOrderDelivery(input: {
  config: EmailRuntimeConfig;
  delivery: ClaimedPaidOrderDelivery;
  logger?: Pick<Console, 'info' | 'warn'>;
  order: CurrentPaidCheckoutOrder;
  provider: EmailProviderGateway;
}): Promise<PaidOrderDeliveryAttemptResult> {
  const order = toPaidOrderEmailInput(input.order);

  switch (input.delivery.kind) {
    case 'shopper_confirmation':
      return emailAttemptResult(
        await sendPaidOrderShopperEmail({
          config: input.config,
          logger: input.logger,
          order,
          provider: input.provider,
        }),
      );
    case 'ops_fulfillment':
      return emailAttemptResult(
        await sendPaidOrderOpsEmail({
          config: input.config,
          logger: input.logger,
          order,
          provider: input.provider,
        }),
      );
    case 'newsletter_registration': {
      if (!input.order.newsletterOptIn) {
        return { kind: 'not_delivered', retryable: false, safeReason: 'validation' };
      }

      const result = await registerNewsletterContact(input.provider, input.config, {
        consentCopyVersion: input.order.newsletterConsentCopyVersion,
        consentSource: 'checkout-opt-in',
        consentedAt: input.order.newsletterConsentAt,
        email: input.order.shopperEmail,
        properties: {
          checkoutSessionId: input.order.checkoutSessionId,
          orderReference: order.orderReference,
        },
      });
      logNewsletterRegistrationOutcome(input.logger ?? console, result, { source: 'checkout-opt-in' });

      return newsletterAttemptResult(result);
    }
  }
}

function toPaidOrderEmailInput(order: CurrentPaidCheckoutOrder): PaidOrderEmailInput {
  return {
    amountTotalMinor: order.amountTotalMinor,
    checkoutSessionId: order.checkoutSessionId,
    currencyCode: order.currencyCode,
    customerName: order.recipientName,
    lineItems: order.lines.map((line) => ({
      displayName: line.displayName,
      optionLabel: line.optionLabel,
      productImage: null,
      quantity: line.quantity,
      storeItemSlug: line.storeItemSlug,
      variantId: line.variantId,
    })),
    orderReference: createCheckoutOrderReferenceToken({
      checkoutSessionId: order.checkoutSessionId,
      orderId: order.id,
      referenceDate: order.paidAt,
    }),
    paidAt: order.paidAt,
    shippingAddress: {
      city: order.shippingAddressCity,
      country: order.shippingAddressCountryCode,
      line1: order.shippingAddressLine1,
      line2: order.shippingAddressLine2,
      postalCode: order.shippingAddressPostalCode,
      state: order.shippingAddressState,
    },
    shopperContact: {
      email: order.shopperEmail,
      phone: order.shopperPhone,
    },
  };
}

function emailAttemptResult(result: EmailOperationResult): PaidOrderDeliveryAttemptResult {
  return result.status === 'sent'
    ? { kind: 'delivered' }
    : {
        kind: 'not_delivered',
        retryable: result.retryable,
        safeReason: result.providerSafeReason ?? 'unknown',
      };
}

function newsletterAttemptResult(result: NewsletterRegistrationResult): PaidOrderDeliveryAttemptResult {
  return result.status === 'registered'
    ? { kind: 'delivered' }
    : {
        kind: 'not_delivered',
        retryable: result.retryable,
        safeReason: result.providerSafeReason ?? 'unknown',
      };
}
