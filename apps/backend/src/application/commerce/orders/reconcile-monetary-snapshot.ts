import type { OrderMonetarySnapshot } from '../../../domain/commerce';
import { resolveTaxCollectionMode, isAcceptedDeliveryCategory } from '../../../domain/commerce';
import type { CheckoutOrderRecord } from '../../../domain/commerce/repositories/spi';
import type { FinalizedCheckoutSessionLineItem } from '../checkout/spi';
import type { CheckoutReconciliation } from '../checkout';

const positiveCents = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const collectedTaxCents = (value: unknown, noTax: boolean): value is number =>
  noTax ? value === 0 : positiveCents(value);

export function reconcileMonetarySnapshot(
  order: CheckoutOrderRecord,
  session: CheckoutReconciliation['source'],
  lines: FinalizedCheckoutSessionLineItem[],
): OrderMonetarySnapshot | null {
  const money = session.monetary;
  const acceptedLines = order.lines ?? [];
  const mode = resolveTaxCollectionMode(order.monetaryPolicyReference);
  const noTax = mode === 'NO_TAX_COLLECTED';
  if (
    !mode ||
    !isAcceptedDeliveryCategory(order.monetaryPolicyReference, order.acceptedParcelTier) ||
    !order.monetaryPolicyReference ||
    !money ||
    session.orderId !== order.id ||
    session.checkoutSessionId !== order.checkoutSessionId ||
    session.currencyCode !== 'EUR' ||
    session.status !== 'complete' ||
    session.paymentStatus !== 'paid' ||
    (noTax
      ? money.automaticTaxEnabled !== false || money.automaticTaxStatus !== null || money.deliveryAppliedTaxCount !== 0
      : money.automaticTaxStatus !== 'complete') ||
    money.policyReference !== order.monetaryPolicyReference ||
    money.parcelTier !== order.acceptedParcelTier ||
    !positiveCents(order.acceptedDeliveryAmountMinor) ||
    money.deliveryGrossMinor !== order.acceptedDeliveryAmountMinor ||
    !collectedTaxCents(money.deliveryVatMinor, noTax) ||
    money.deliveryVatMinor >= money.deliveryGrossMinor ||
    !collectedTaxCents(money.totalVatMinor, noTax) ||
    money.discountMinor !== 0 ||
    !positiveCents(session.amountTotalMinor) ||
    !lines.length ||
    lines.length !== acceptedLines.length
  )
    return null;

  const seen = new Set<string>();
  let merchandiseGrossMinor = 0;
  let merchandiseVatMinor = 0;
  for (const line of lines) {
    const accepted = acceptedLines.find((candidate) => candidate.stripePriceId === line.stripePriceId);
    if (
      !accepted ||
      seen.has(line.stripePriceId) ||
      line.quantity !== accepted.quantity ||
      !positiveCents(line.lineAmountMinor) ||
      !collectedTaxCents(line.lineVatMinor, noTax) ||
      (noTax && (line.appliedTaxCount !== 0 || line.taxRatePercent !== null)) ||
      line.lineVatMinor >= line.lineAmountMinor ||
      line.currencyCode !== 'EUR' ||
      line.taxInclusive !== true ||
      line.discountMinor !== 0 ||
      (!noTax &&
        (typeof line.taxRatePercent !== 'number' ||
          !Number.isFinite(line.taxRatePercent) ||
          line.taxRatePercent <= 0 ||
          line.taxRatePercent > 100)) ||
      (accepted.unitAmountMinor !== null && line.lineAmountMinor !== accepted.unitAmountMinor * accepted.quantity) ||
      (accepted.unitAmountMinor === null &&
        (lines.length !== 1 || line.quantity !== 1 || line.customAmountValid !== true))
    )
      return null;
    seen.add(line.stripePriceId);
    merchandiseGrossMinor += line.lineAmountMinor;
    merchandiseVatMinor += line.lineVatMinor;
  }
  if (
    !positiveCents(merchandiseGrossMinor) ||
    (noTax ? merchandiseVatMinor !== 0 : !positiveCents(merchandiseVatMinor)) ||
    !Number.isSafeInteger(merchandiseGrossMinor + money.deliveryGrossMinor) ||
    merchandiseGrossMinor + money.deliveryGrossMinor !== session.amountTotalMinor ||
    merchandiseVatMinor + money.deliveryVatMinor !== money.totalVatMinor
  )
    return null;
  return {
    merchandiseGrossMinor,
    deliveryGrossMinor: money.deliveryGrossMinor,
    deliveryVatMinor: money.deliveryVatMinor,
    totalVatMinor: money.totalVatMinor,
  };
}
