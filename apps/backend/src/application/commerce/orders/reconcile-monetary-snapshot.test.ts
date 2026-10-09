import { describe, expect, it } from 'vitest';
import type { CheckoutOrderRecord } from '../../../domain/commerce/repositories/spi';
import type { CheckoutReconciliation } from '../checkout';
import type { FinalizedCheckoutSessionLineItem } from '../checkout/spi';
import { reconcileMonetarySnapshot } from './reconcile-monetary-snapshot';

function fixture(reference = 'synthetic-uat-no-tax-collected-2026-10-09-v1') {
  const order = {
    id: 'order',
    checkoutSessionId: 'cs_test_tax',
    monetaryPolicyReference: reference,
    acceptedDeliveryAmountMinor: 250,
    acceptedParcelTier: 'small',
    lines: [{ stripePriceId: 'price_fixed', quantity: 2, unitAmountMinor: 1240 }],
  } as unknown as CheckoutOrderRecord;
  const source = {
    orderId: order.id,
    checkoutSessionId: order.checkoutSessionId,
    currencyCode: 'EUR',
    status: 'complete',
    paymentStatus: 'paid',
    amountTotalMinor: 2730,
    monetary: {
      automaticTaxEnabled: false,
      automaticTaxStatus: null,
      deliveryAppliedTaxCount: 0,
      deliveryGrossMinor: 250,
      deliveryVatMinor: 0,
      totalVatMinor: 0,
      discountMinor: 0,
      parcelTier: 'small',
      policyReference: reference,
    },
  } as CheckoutReconciliation['source'];
  const lines = [
    {
      stripePriceId: 'price_fixed',
      quantity: 2,
      lineAmountMinor: 2480,
      lineVatMinor: 0,
      taxRatePercent: null,
      appliedTaxCount: 0,
      currencyCode: 'EUR',
      taxInclusive: true,
      discountMinor: 0,
    },
  ] as FinalizedCheckoutSessionLineItem[];
  return { order, source, lines };
}

describe('explicit no-collection monetary reconciliation', () => {
  it('records exact gross amounts and actual zero collection without a tax rate', () => {
    const { order, source, lines } = fixture();
    expect(reconcileMonetarySnapshot(order, source, lines)).toEqual({
      merchandiseGrossMinor: 2480,
      deliveryGrossMinor: 250,
      deliveryVatMinor: 0,
      totalVatMinor: 0,
    });
    order.lines![0]!.unitAmountMinor = null;
    order.lines![0]!.quantity = lines[0]!.quantity = 1 as never;
    lines[0]!.customAmountValid = true;
    expect(reconcileMonetarySnapshot(order, source, lines)).not.toBeNull();
    lines[0]!.customAmountValid = false;
    expect(reconcileMonetarySnapshot(order, source, lines)).toBeNull();
  });
  it.each([
    ['automaticTaxEnabled', true],
    ['automaticTaxEnabled', null],
    ['automaticTaxEnabled', undefined],
    ['automaticTaxStatus', 'complete'],
    ['deliveryAppliedTaxCount', 1],
    ['deliveryAppliedTaxCount', null],
    ['deliveryVatMinor', null],
    ['deliveryVatMinor', 1],
    ['deliveryVatMinor', -1],
    ['totalVatMinor', null],
    ['totalVatMinor', 1],
    ['discountMinor', 1],
    ['deliveryGrossMinor', 350],
    ['policyReference', 'synthetic-uat-inclusive-v1'],
    ['parcelTier', 'medium'],
  ])('rejects inconsistent provider %s=%s', (key, value) => {
    const { order, source, lines } = fixture();
    Object.assign(source.monetary!, { [key as string]: value });
    expect(reconcileMonetarySnapshot(order, source, lines)).toBeNull();
  });
  it.each([
    ['lineVatMinor', null],
    ['lineVatMinor', 1],
    ['lineVatMinor', -1],
    ['taxRatePercent', 0],
    ['taxRatePercent', 24],
    ['taxRatePercent', undefined],
    ['appliedTaxCount', 1],
    ['appliedTaxCount', null],
    ['appliedTaxCount', undefined],
    ['lineAmountMinor', 2479],
    ['currencyCode', 'USD'],
    ['quantity', 1],
    ['discountMinor', 1],
    ['stripePriceId', 'price_other'],
  ])('rejects inconsistent finalized line %s=%s', (key, value) => {
    const { order, source, lines } = fixture();
    Object.assign(lines[0]!, { [key as string]: value });
    expect(reconcileMonetarySnapshot(order, source, lines)).toBeNull();
  });
  it('preserves inclusive treatment and rejects unknown or changed accepted policies', () => {
    const { order, source, lines } = fixture('synthetic-uat-inclusive-v1');
    expect(reconcileMonetarySnapshot(order, source, lines)).toBeNull();
    Object.assign(source.monetary!, {
      automaticTaxEnabled: true,
      automaticTaxStatus: 'complete',
      deliveryVatMinor: 48,
      totalVatMinor: 528,
    });
    Object.assign(lines[0]!, { lineVatMinor: 480, taxRatePercent: 24, appliedTaxCount: 1 });
    expect(reconcileMonetarySnapshot(order, source, lines)?.totalVatMinor).toBe(528);
    order.monetaryPolicyReference = source.monetary!.policyReference = 'unknown-inclusive-v1';
    expect(reconcileMonetarySnapshot(order, source, lines)).toBeNull();
  });
});
