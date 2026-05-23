import { http, HttpResponse, type HttpHandler } from 'msw';

import type { InternalApiComponents } from '../internal-client';
import type { PublicApiComponents } from '../public-client';

export const apiClientMswBaseUrl = 'http://blackbox.test';

type CheckoutState = PublicApiComponents['schemas']['CheckoutState'];
type PublicCommerceError = PublicApiComponents['schemas']['PublicCommerceError'];
type PublicStoreOffer = PublicApiComponents['schemas']['PublicStoreOffer'];
type StartCheckoutBody = PublicApiComponents['schemas']['StartCheckoutBody'];
type StartCheckoutResponse = PublicApiComponents['schemas']['StartCheckoutResponse'];
type StoreCapabilities = PublicApiComponents['schemas']['StoreCapabilities'];

type InternalStockChangeBody = InternalApiComponents['schemas']['InternalStockChangeBody'];
type InternalStockDetail = InternalApiComponents['schemas']['InternalStockDetail'];
type InternalStockError = InternalApiComponents['schemas']['InternalStockError'];
type InternalStockHistoryResponse = InternalApiComponents['schemas']['InternalStockHistoryResponse'];
type InternalVariantSummary = InternalApiComponents['schemas']['InternalVariantSummary'];
type RecordedStockChangeResponse = InternalApiComponents['schemas']['RecordedStockChangeResponse'];

export const publicCheckoutFixtures = {
  checkoutState: {
    checkoutSessionId: 'cs_test_123',
    paymentStatus: 'paid',
    shippingLocker: null,
    state: 'paid',
    status: 'complete',
  } satisfies CheckoutState,
  checkoutUnavailable: {
    error: 'Checkout unavailable or not configured.',
  } satisfies PublicCommerceError,
  startCheckoutBody: {
    storeItemSlug: 'disintegration-black-vinyl-lp',
    variantId: 'variant_barren-point_standard',
  } satisfies StartCheckoutBody,
  startCheckoutResponse: {
    checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
  } satisfies StartCheckoutResponse,
  storeCapabilities: {
    nativeCheckout: {
      enabled: true,
      unavailableReason: null,
    },
  } satisfies StoreCapabilities,
  storeOffer: {
    availability: {
      label: 'Available now',
      status: 'available',
    },
    canCheckout: true,
    catalogStatus: 'ready',
    price: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      display: '€28.00',
    },
    storeItemSlug: 'disintegration-black-vinyl-lp',
    variantId: 'variant_barren-point_standard',
  } satisfies PublicStoreOffer,
};

export const internalStockFixtures = {
  missingOperatorIdentity: {
    error: 'Missing operator identity.',
  } satisfies InternalStockError,
  stockChangeBody: {
    delta: -1,
    notes: 'Table sale',
    reason: 'sale',
  } satisfies InternalStockChangeBody,
  stockDetail: {
    sourceId: 'barren-point',
    sourceKind: 'release',
    stock: {
      onlineQuantity: 4,
      quantity: 5,
      updatedAt: '2026-05-23T10:15:00.000Z',
    },
    storeItemSlug: 'disintegration-black-vinyl-lp',
    variantId: 'variant_barren-point_standard',
  } satisfies InternalStockDetail,
  variant: {
    sourceId: 'barren-point',
    sourceKind: 'release',
    storeItemSlug: 'disintegration-black-vinyl-lp',
    variantId: 'variant_barren-point_standard',
  } satisfies InternalVariantSummary,
};

export function createPublicCheckoutHandlers(): HttpHandler[] {
  return [
    http.get<Record<string, never>, never, StoreCapabilities>('*/api/store/capabilities', () =>
      HttpResponse.json(publicCheckoutFixtures.storeCapabilities),
    ),
    http.get<{ storeItemSlug: string }, never, PublicStoreOffer>('*/api/store/items/:storeItemSlug', () =>
      HttpResponse.json(publicCheckoutFixtures.storeOffer),
    ),
    http.get<{ storeItemSlug: string }, never, PublicStoreOffer[]>('*/api/store/items/:storeItemSlug/variants', () =>
      HttpResponse.json([publicCheckoutFixtures.storeOffer]),
    ),
    http.post<Record<string, never>, StartCheckoutBody, StartCheckoutResponse>(
      '*/api/checkout/sessions',
      async ({ request }) => {
        await request.json();

        return HttpResponse.json(publicCheckoutFixtures.startCheckoutResponse);
      },
    ),
    http.get<{ checkoutSessionId: string }, never, CheckoutState>(
      '*/api/checkout/sessions/:checkoutSessionId/state',
      () => HttpResponse.json(publicCheckoutFixtures.checkoutState),
    ),
  ];
}

export function createInternalStockHandlers(): HttpHandler[] {
  return [
    http.get<Record<string, never>, never, InternalVariantSummary[]>('*/api/internal/variants', () =>
      HttpResponse.json([internalStockFixtures.variant]),
    ),
    http.get<{ variantId: string }, never, InternalStockDetail>('*/api/internal/variants/:variantId/stock', () =>
      HttpResponse.json(internalStockFixtures.stockDetail),
    ),
    http.get<{ variantId: string }, never, InternalStockHistoryResponse>(
      '*/api/internal/variants/:variantId/stock/history',
      () =>
        HttpResponse.json({
          entries: [],
          variantId: internalStockFixtures.variant.variantId,
        }),
    ),
    http.post<{ variantId: string }, InternalStockChangeBody, RecordedStockChangeResponse>(
      '*/api/internal/variants/:variantId/stock/changes',
      async ({ params, request }) => {
        const body = (await request.json()) as InternalStockChangeBody;

        return HttpResponse.json({
          entry: {
            actorEmail: 'operator@example.com',
            id: 'stock_change_test_123',
            notes: body.notes ?? null,
            quantityDelta: body.delta,
            reason: body.reason,
            recordedAt: '2026-05-23T10:20:00.000Z',
            type: 'change',
            variantId: params.variantId,
          },
          stock: {
            onlineQuantity: 3,
            quantity: 4,
            updatedAt: '2026-05-23T10:20:00.000Z',
          },
          variantId: params.variantId,
        });
      },
    ),
  ];
}

export function createApiClientHandlers(): HttpHandler[] {
  return [...createPublicCheckoutHandlers(), ...createInternalStockHandlers()];
}
