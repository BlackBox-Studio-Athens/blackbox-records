import { currentCatalogProductProjectionEntries } from '../../apps/backend/src/application/commerce/catalog-sync/catalog-product-projections';
import { createMoney, formatMoney, moneyToCurrencyCode, moneyToMinorAmount } from '../../apps/web/src/lib/money';
import type { CartLineItemSnapshot } from '../../apps/web/src/lib/store-cart';
import { createRouteUrl, resolveSmokeScenarioSelection } from '../smoke-core';
import type {
  StripeCheckoutSurfaceExpectation,
  StripeSandboxScenarioGroups,
  StripeSandboxSmokeScenario,
  StripeSandboxSmokeScenarioName,
  StripeSandboxSmokeScenarioSelection,
} from '../smoke-stripe-sandbox';
import { smokeStoreItemSlug, smokeVariantId } from './constants';

const smokeCatalogProjectionEntry = currentCatalogProductProjectionEntries.find(
  (entry) => entry.storeItemSlug === smokeStoreItemSlug && entry.variantId === smokeVariantId,
);

export const allScenarioNames: readonly StripeSandboxSmokeScenarioName[] = [
  'checkout_surface',
  'happy_path_paid',
  'three_d_secure',
  'card_declined',
  'insufficient_funds',
  'expired_card',
  'incorrect_cvc',
  'processing_error',
];

function requireSmokeCatalogProjectionEntry() {
  const expectedSandboxPrice = smokeCatalogProjectionEntry?.expectedSandboxPrice;

  if (!smokeCatalogProjectionEntry || !expectedSandboxPrice) {
    throw new Error(`Missing checkout-eligible Product Projection for ${smokeStoreItemSlug} / ${smokeVariantId}.`);
  }

  return { ...smokeCatalogProjectionEntry, expectedSandboxPrice };
}

const disintegrationCheckoutSurfaceExpectation: StripeCheckoutSurfaceExpectation = {
  expectedAmountText: 'Worker Store Offer price',
  expectedPaymentMethodLabels: [],
  expectedSessionProjection: {
    expectedAmountMinor: requireSmokeCatalogProjectionEntry().expectedSandboxPrice.amountMinor,
    expectedCurrencyCode: requireSmokeCatalogProjectionEntry().expectedSandboxPrice.currencyCode,
    expectedProductImageUrl: requireSmokeCatalogProjectionEntry().productProjection.imageUrls[0] ?? '',
    expectedProductName: requireSmokeCatalogProjectionEntry().productProjection.name,
  },
  minimumDynamicPaymentMethodCount: 1,
};

export const STRIPE_TEST_CARD_DOCS_URL = 'https://docs.stripe.com/testing#cards';
export const STRIPE_SANDBOX_SMOKE_SCENARIOS: Record<StripeSandboxSmokeScenarioName, StripeSandboxSmokeScenario> = {
  checkout_surface: {
    checkoutSurfaceExpectation: disintegrationCheckoutSurfaceExpectation,
    description: 'Hosted Checkout amount and dynamic payment method surface, without submitting payment.',
    expectedOrderStatus: 'not_submitted',
    name: 'checkout_surface',
    stripeFormExpectation:
      'Stripe should show the storefront amount and at least one dynamic payment option before payment is submitted.',
  },
  happy_path_paid: {
    cardNumber: '4242 4242 4242 4242',
    checkoutSurfaceExpectation: disintegrationCheckoutSurfaceExpectation,
    description: 'Immediate successful card payment.',
    expectedOrderStatus: 'paid',
    name: 'happy_path_paid',
    stripeFormExpectation:
      'Stripe should accept the card, return to the checkout return page, and emit a paid webhook.',
  },
  three_d_secure: {
    cardNumber: '4000 0000 0000 3220',
    description: '3D Secure authentication is required for every transaction.',
    expectedOrderStatus: 'paid',
    name: 'three_d_secure',
    stripeFormExpectation:
      'Stripe should open a 3D Secure challenge. The runner completes it and expects paid order evidence.',
  },
  card_declined: {
    cardNumber: '4000 0000 0000 0002',
    description: 'Generic card decline.',
    expectedOrderStatus: 'not_paid_or_pending',
    expectedStripeErrorPattern: /card (?:was )?declined|declined/i,
    name: 'card_declined',
    stripeFormExpectation: 'Stripe should show a declined-card error and remain on hosted Checkout.',
  },
  insufficient_funds: {
    cardNumber: '4000 0000 0000 9995',
    description: 'Insufficient funds decline.',
    expectedOrderStatus: 'not_paid_or_pending',
    expectedStripeErrorPattern: /insufficient funds|declined/i,
    name: 'insufficient_funds',
    stripeFormExpectation: 'Stripe should show an insufficient-funds error and remain on hosted Checkout.',
  },
  expired_card: {
    cardNumber: '4000 0000 0000 0069',
    description: 'Expired card decline.',
    expectedOrderStatus: 'not_paid_or_pending',
    expectedStripeErrorPattern: /expired|declined/i,
    name: 'expired_card',
    stripeFormExpectation: 'Stripe should show an expired-card error and remain on hosted Checkout.',
  },
  incorrect_cvc: {
    cardNumber: '4000 0000 0000 0127',
    description: 'Incorrect CVC decline.',
    expectedOrderStatus: 'not_paid_or_pending',
    expectedStripeErrorPattern: /security code|cvc|declined/i,
    name: 'incorrect_cvc',
    stripeFormExpectation: 'Stripe should show an incorrect-CVC error and remain on hosted Checkout.',
  },
  processing_error: {
    cardNumber: '4000 0000 0000 0119',
    description: 'Processing error decline.',
    expectedOrderStatus: 'not_paid_or_pending',
    expectedStripeErrorPattern: /processing error|try again|declined/i,
    name: 'processing_error',
    stripeFormExpectation: 'Stripe should show a processing-error decline and remain on hosted Checkout.',
  },
};

export function resolveSelectedStripeSandboxScenarios(
  selection: StripeSandboxSmokeScenarioSelection,
): StripeSandboxSmokeScenario[] {
  return resolveSmokeScenarioSelection(selection, Object.values(STRIPE_SANDBOX_SMOKE_SCENARIOS));
}

export function groupStripeSandboxSmokeScenarios(
  scenarios: readonly StripeSandboxSmokeScenario[],
): StripeSandboxScenarioGroups {
  return {
    checkoutSurfaceScenarios: scenarios.filter((scenario) => scenario.expectedOrderStatus === 'not_submitted'),
    declineScenarios: scenarios.filter((scenario) => scenario.expectedOrderStatus === 'not_paid_or_pending'),
    paidScenarios: scenarios.filter((scenario) => scenario.expectedOrderStatus === 'paid'),
  };
}

export function createCheckoutPageUrl(siteUrl: string, storeItemSlug = smokeStoreItemSlug): string {
  void storeItemSlug;
  return createRouteUrl(siteUrl, '/store/checkout/');
}

export function createSmokeStoreCartLineItemSnapshot(): CartLineItemSnapshot {
  const { expectedSandboxPrice, productProjection, storeItemSlug, variantId } = requireSmokeCatalogProjectionEntry();
  const price = createMoney(expectedSandboxPrice);

  return {
    availabilityLabel: 'Available',
    image: productProjection.imageUrls[0] ?? null,
    imageAlt: productProjection.name,
    optionLabel: null,
    priceAmountMinor: moneyToMinorAmount(price),
    priceCurrencyCode: moneyToCurrencyCode(price),
    priceDisplay: formatMoney(price),
    storeItemSlug,
    subtitle: productProjection.description,
    title: productProjection.name,
    variantId,
  };
}

export function createScenarioEmail(runId: string, scenarioName: string): string {
  return `sandbox-checkout+${runId}-${scenarioName}@blackbox.example`;
}

export function countPaidStripeSandboxScenarios(scenarios: readonly StripeSandboxSmokeScenario[]): number {
  return scenarios.filter((scenario) => scenario.expectedOrderStatus === 'paid').length;
}

export function calculateMinimumSmokeOnlineQuantity(scenarios: readonly StripeSandboxSmokeScenario[]): number {
  const paidScenarioCount = countPaidStripeSandboxScenarios(scenarios);
  const hasDeclineScenario = scenarios.some((scenario) => scenario.expectedOrderStatus === 'not_paid_or_pending');

  return Math.max(1, paidScenarioCount + (hasDeclineScenario ? 1 : 0));
}
