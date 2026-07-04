import type {
  StripeCheckoutSessionProjectionExpectation,
  StripeCheckoutSessionProjectionObservation,
  StripeCheckoutSurfaceExpectation,
  StripeCheckoutSurfaceObservation,
} from '../smoke-stripe-sandbox';
import { normalizeBaseUrl } from '../smoke-core';
import { smokeStoreItemSlug } from './constants';
import { scrubSensitiveStripeSmokeText } from './redaction';

type StripeCheckoutLineItemsApiResponse = {
  data?: Array<{
    amount_total?: number | null;
    currency?: string | null;
    price?: {
      product?: StripeProductApiObject | string | null;
    } | null;
  }>;
};

type StripeProductApiObject = {
  images?: string[] | null;
  name?: string | null;
};

type PublicStoreOfferResponse = {
  canCheckout?: boolean;
  price?: {
    display?: string;
  } | null;
};

export async function resolveCheckoutSurfaceExpectation(
  workerUrl: string,
  baseExpectation: StripeCheckoutSurfaceExpectation,
  expectedPaymentMethodLabels: string[],
  storeItemSlug = smokeStoreItemSlug,
): Promise<StripeCheckoutSurfaceExpectation> {
  const offer = await readWorkerStoreOffer(workerUrl, storeItemSlug);

  if (!offer.canCheckout || !offer.price?.display) {
    throw new Error('Worker Store Offer is not checkout-ready for sandbox smoke.');
  }

  return {
    ...baseExpectation,
    expectedAmountText:
      baseExpectation.expectedAmountText === 'Worker Store Offer price'
        ? offer.price.display
        : baseExpectation.expectedAmountText,
    expectedPaymentMethodLabels,
  };
}

export function createStripeCheckoutSurfaceObservation(
  bodyText: string,
  expectation: StripeCheckoutSurfaceExpectation,
): StripeCheckoutSurfaceObservation {
  const normalizedBodyText = normalizeVisibleStripeText(bodyText);
  const paymentMethodLabels = extractPaymentMethodLabels(normalizedBodyText);
  const dynamicPaymentMethodLabels = extractDynamicPaymentMethodLabels(normalizedBodyText);
  const observedPaymentSurfaceLabels = uniqueStrings([...paymentMethodLabels, ...dynamicPaymentMethodLabels]);
  const observedAmountTexts = extractAmountTexts(normalizedBodyText);
  const amountTextPresent = normalizedBodyText.includes(expectation.expectedAmountText);
  const expectedPaymentMethodLabels = uniqueStrings(
    expectation.expectedPaymentMethodLabels.map(normalizePaymentMethodLabel),
  );
  const missingPaymentMethodLabels = expectedPaymentMethodLabels.filter(
    (expectedLabel) =>
      !observedPaymentSurfaceLabels.some((label) => normalizePaymentMethodLabel(label) === expectedLabel),
  );
  const issues: string[] = [];

  if (!amountTextPresent) {
    issues.push(
      `Expected hosted Checkout amount ${expectation.expectedAmountText}; observed: ${
        observedAmountTexts.length ? observedAmountTexts.join(', ') : 'none'
      }.`,
    );
  }

  if (dynamicPaymentMethodLabels.length < expectation.minimumDynamicPaymentMethodCount) {
    issues.push(
      `Expected at least ${expectation.minimumDynamicPaymentMethodCount} dynamic payment method surface label(s); observed: ${
        observedPaymentSurfaceLabels.length ? observedPaymentSurfaceLabels.join(', ') : 'none'
      }.`,
    );
  }

  if (missingPaymentMethodLabels.length) {
    issues.push(
      `Expected hosted Checkout payment method label(s) ${missingPaymentMethodLabels.join(', ')}; observed: ${
        observedPaymentSurfaceLabels.length ? observedPaymentSurfaceLabels.join(', ') : 'none'
      }.`,
    );
  }

  return {
    amountTextPresent,
    dynamicPaymentMethodLabels,
    expectedAmountText: expectation.expectedAmountText,
    expectedPaymentMethodLabels,
    issues,
    observedAmountTexts,
    paymentMethodLabels,
  };
}

export async function readStripeCheckoutSessionProjection(
  checkoutSessionId: string,
  expectation: StripeCheckoutSessionProjectionExpectation,
  secretKey = process.env.STRIPE_SECRET_KEY ?? '',
): Promise<StripeCheckoutSessionProjectionObservation> {
  const normalizedSecretKey = secretKey.trim();

  if (!normalizedSecretKey) {
    return createStripeCheckoutSessionProjectionObservation(null, expectation, [
      'STRIPE_SECRET_KEY is required to verify hosted Checkout Product Projection through Stripe API.',
    ]);
  }

  const apiBaseUrl = (process.env.STRIPE_API_BASE_URL?.trim() || 'https://api.stripe.com').replace(/\/+$/, '');
  const searchParams = new URLSearchParams({
    limit: '1',
  });
  searchParams.append('expand[]', 'data.price.product');
  const response = await fetch(
    `${apiBaseUrl}/v1/checkout/sessions/${encodeURIComponent(checkoutSessionId)}/line_items?${searchParams}`,
    {
      headers: {
        Authorization: `Bearer ${normalizedSecretKey}`,
      },
    },
  );

  if (!response.ok) {
    const responseText = await response.text();

    return createStripeCheckoutSessionProjectionObservation(null, expectation, [
      `Stripe Checkout Session line item read failed with HTTP ${response.status}: ${scrubSensitiveStripeSmokeText(
        responseText,
      )}`,
    ]);
  }

  const body = (await response.json()) as StripeCheckoutLineItemsApiResponse;
  const lineItem = body.data?.[0] ?? null;
  const product = getExpandedStripeProduct(lineItem?.price?.product ?? null);

  return createStripeCheckoutSessionProjectionObservation(
    lineItem && product
      ? {
          amountMinor: typeof lineItem.amount_total === 'number' ? lineItem.amount_total : null,
          currencyCode: lineItem.currency ?? null,
          productImageUrls: product.images ?? [],
          productName: product.name ?? null,
        }
      : null,
    expectation,
    lineItem && product ? [] : ['Stripe Checkout Session line item Product was not expanded.'],
  );
}

export function createStripeCheckoutSessionProjectionObservation(
  observed: {
    amountMinor: number | null;
    currencyCode: string | null;
    productImageUrls: string[];
    productName: string | null;
  } | null,
  expectation: StripeCheckoutSessionProjectionExpectation,
  extraIssues: string[] = [],
): StripeCheckoutSessionProjectionObservation {
  const observedCurrencyCode = observed?.currencyCode?.toUpperCase() ?? null;
  const expectedCurrencyCode = expectation.expectedCurrencyCode.toUpperCase();
  const observedProductImageUrls = observed?.productImageUrls ?? [];
  const amountMatches = observed?.amountMinor === expectation.expectedAmountMinor;
  const currencyMatches = observedCurrencyCode === expectedCurrencyCode;
  const productNameMatches = observed?.productName === expectation.expectedProductName;
  const productImageMatches = observedProductImageUrls.includes(expectation.expectedProductImageUrl);
  const issues = [...extraIssues];

  if (!amountMatches) {
    issues.push(
      `Expected Checkout Session amount ${expectation.expectedAmountMinor}; observed ${observed?.amountMinor ?? 'none'}.`,
    );
  }

  if (!currencyMatches) {
    issues.push(
      `Expected Checkout Session currency ${expectedCurrencyCode}; observed ${observedCurrencyCode ?? 'none'}.`,
    );
  }

  if (!productNameMatches) {
    issues.push(
      `Expected Checkout Session Product name "${expectation.expectedProductName}"; observed "${
        observed?.productName ?? 'none'
      }".`,
    );
  }

  if (!productImageMatches) {
    issues.push(
      `Expected Checkout Session Product image ${expectation.expectedProductImageUrl}; observed ${
        observedProductImageUrls.length ? observedProductImageUrls.join(', ') : 'none'
      }.`,
    );
  }

  return {
    amountMatches,
    currencyMatches,
    expectedAmountMinor: expectation.expectedAmountMinor,
    expectedCurrencyCode,
    expectedProductImageUrl: expectation.expectedProductImageUrl,
    expectedProductName: expectation.expectedProductName,
    issues,
    observedAmountMinor: observed?.amountMinor ?? null,
    observedCurrencyCode,
    observedProductImageUrls,
    observedProductName: observed?.productName ?? null,
    productImageMatches,
    productNameMatches,
  };
}

async function readWorkerStoreOffer(workerUrl: string, storeItemSlug: string): Promise<PublicStoreOfferResponse> {
  const response = await fetch(
    `${normalizeBaseUrl(workerUrl, 'workerUrl')}/api/store/items/${encodeURIComponent(storeItemSlug)}`,
  );

  if (!response.ok) {
    throw new Error(`Worker Store Offer read failed with HTTP ${response.status}.`);
  }

  return (await response.json()) as PublicStoreOfferResponse;
}

function getExpandedStripeProduct(value: StripeProductApiObject | string | null): StripeProductApiObject | null {
  return value && typeof value === 'object' ? value : null;
}

function normalizeVisibleStripeText(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim();
}

function extractPaymentMethodLabels(text: string): string[] {
  const lines = createVisibleTextLines(text);
  const paymentMethodIndex = lines.findIndex((line) => /^payment method$/i.test(line));

  if (paymentMethodIndex < 0) {
    return [];
  }

  const terminalIndex = lines.findIndex(
    (line, index) =>
      index > paymentMethodIndex &&
      /^(card information|billing information|billing info is same as shipping|save my information|pay)$/i.test(line),
  );
  const labels = lines.slice(paymentMethodIndex + 1, terminalIndex > paymentMethodIndex ? terminalIndex : undefined);

  return uniqueStrings(
    labels.filter((line) =>
      /^(?:card|link|apple pay|google pay|pay with link|pay with apple pay|pay with google pay)$/i.test(line),
    ),
  );
}

function extractDynamicPaymentMethodLabels(text: string): string[] {
  const labels: string[] = [];

  for (const line of createVisibleTextLines(text)) {
    if (/^(?:apple pay|pay with apple pay)$/i.test(line)) {
      labels.push('Apple Pay');
    }

    if (/^(?:google pay|pay with google pay)$/i.test(line)) {
      labels.push('Google Pay');
    }

    if (/^(?:link|pay with link)$/i.test(line)) {
      labels.push('Link');
    }
  }

  if (/pay securely\b[\s\S]*\blink is accepted\b/i.test(text)) {
    labels.push('Link');
  }

  return uniqueStrings(labels);
}

function normalizePaymentMethodLabel(label: string): string {
  return label.trim().replace(/\s+/g, ' ');
}

function extractAmountTexts(text: string): string[] {
  return uniqueStrings(text.match(/(?:€|CHF|USD|EUR|GBP)\s?\d+(?:[.,]\d{2})?/g) ?? []);
}

function createVisibleTextLines(text: string): string[] {
  return normalizeVisibleStripeText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}
