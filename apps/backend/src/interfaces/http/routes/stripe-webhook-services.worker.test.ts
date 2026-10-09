import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import * as stripe from '../../../infrastructure/stripe';
import * as orders from '../../../application/commerce/orders';
import type { CheckoutReconciliation } from '../../../application/commerce/checkout';
import type { AppBindings } from '../../../platform/env';
import { createStripeWebhookServices } from './stripe-webhook-services';

describe('paid webhook provider evidence', () => {
  it.each(['paid', 'unpaid', 'wrong_session', 'unavailable'])(
    'requires matching paid provider Session evidence before finalization (%s)',
    async (state) => {
      const providerSession = {
        checkoutSessionId: state === 'wrong_session' ? 'cs_test_wrong' : 'cs_test_expanded',
        paymentStatus: state === 'unpaid' ? 'unpaid' : 'paid',
        status: 'complete',
        monetary: { automaticTaxEnabled: false, deliveryAppliedTaxCount: 0, deliveryVatMinor: 0, totalVatMinor: 0 },
      };
      const readCheckoutSession =
        state === 'unavailable'
          ? vi.fn().mockRejectedValue(new Error('Provider unavailable'))
          : vi.fn().mockResolvedValue(providerSession);
      const lines = [{ lineVatMinor: 0, appliedTaxCount: 0, taxRatePercent: null }];
      const readCheckoutSessionLineItems = vi.fn().mockResolvedValue(lines);
      const gateway = vi.spyOn(stripe, 'createStripeCheckoutGateway').mockReturnValue({
        readCheckoutSession,
        readCheckoutSessionLineItems,
      } as never);
      const apply = vi.spyOn(orders, 'applyPaidCheckoutReconciliation').mockResolvedValue({
        kind: 'rejected',
        reason: 'fixture',
      });
      const services = createStripeWebhookServices({
        COMMERCE_DB: env.COMMERCE_DB,
        PRODUCT_ENVIRONMENT: 'LOCAL',
        STRIPE_SECRET_KEY: 'sk_test_mock',
        STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_mock',
      } satisfies AppBindings);
      const reconciliation = {
        recommendedOrderStatus: 'paid',
        source: { checkoutSessionId: 'cs_test_expanded', monetary: { deliveryAppliedTaxCount: null } },
      } as CheckoutReconciliation;
      try {
        const result = services.applyPaidCheckoutReconciliation(reconciliation);
        if (state !== 'paid') {
          await expect(result).rejects.toThrow(
            state === 'unavailable' ? 'Provider unavailable' : 'Paid Checkout Session evidence is unavailable.',
          );
          expect(apply).not.toHaveBeenCalled();
        } else {
          await expect(result).resolves.toEqual({ kind: 'rejected', reason: 'fixture' });
          expect(apply).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            expect.objectContaining({
              recommendedOrderStatus: 'paid',
              source: expect.objectContaining(providerSession),
            }),
            expect.any(Date),
            lines,
          );
        }
        expect(readCheckoutSession).toHaveBeenCalledWith('cs_test_expanded');
        expect(readCheckoutSessionLineItems).toHaveBeenCalledWith('cs_test_expanded');
      } finally {
        await services.disconnect();
        gateway.mockRestore();
        apply.mockRestore();
      }
    },
  );
});
