import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PublicCheckoutApi, PublicStoreOffer } from '@/components/store/checkout/public-checkout-api';
import StoreOfferPriceDisplay, {
  createStoreOfferPriceDisplayView,
  loadStoreOfferPriceDisplayView,
  STORE_OFFER_PRICE_DISPLAY_COPY,
  type StoreOfferPriceDisplayView,
} from './StoreOfferPriceDisplay';

const renderedState = vi.hoisted(() => ({ view: undefined as StoreOfferPriceDisplayView | undefined }));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof React>();
  return {
    ...actual,
    useState: (initial: unknown) => (renderedState.view ? [renderedState.view, vi.fn()] : actual.useState(initial)),
  };
});

const workerOffer: PublicStoreOffer = {
  availability: {
    label: 'Available',
    status: 'available',
  },
  canCheckout: true,
  catalogStatus: 'ready',
  preorder: null,
  price: {
    amountMinor: 2800,
    currencyCode: 'EUR',
    display: '€28.00',
    kind: 'fixed',
  },
  storeItemSlug: 'disintegration-black-vinyl-lp',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

describe('StoreOfferPriceDisplay', () => {
  afterEach(() => {
    renderedState.view = undefined;
    vi.useRealTimers();
  });

  it('renders a loading placeholder during server render', () => {
    const html = renderToStaticMarkup(<StoreOfferPriceDisplay storeItemSlug="disintegration-black-vinyl-lp" />);

    expect(html).toContain(STORE_OFFER_PRICE_DISPLAY_COPY.loading);
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('Worker-confirmed');
    expect(html).not.toContain('€28.00');
  });

  it('loads the browser-safe Worker Store Offer price', async () => {
    const api = createApi({
      readStoreOffer: vi.fn(async () => workerOffer),
    });

    await expect(loadStoreOfferPriceDisplayView(api, 'disintegration-black-vinyl-lp')).resolves.toEqual({
      isLoading: false,
      label: '€28.00',
      tone: 'ready',
    });
    expect(api.readStoreOffer).toHaveBeenCalledWith('disintegration-black-vinyl-lp');
  });

  it('does not show a fake price when Worker cannot confirm checkout', () => {
    expect(
      createStoreOfferPriceDisplayView({
        ...workerOffer,
        availability: {
          label: 'Checkout Paused',
          status: 'unavailable',
        },
        canCheckout: false,
        catalogStatus: 'catalog_drift',
        price: null,
      }),
    ).toEqual({
      isLoading: false,
      label: STORE_OFFER_PRICE_DISPLAY_COPY.unavailable,
      tone: 'unavailable',
    });
  });

  it('falls back closed when the Worker request fails', async () => {
    const api = createApi({
      readStoreOffer: vi.fn(async () => {
        throw new Error('Worker unavailable');
      }),
    });

    await expect(loadStoreOfferPriceDisplayView(api, 'disintegration-black-vinyl-lp')).resolves.toEqual({
      isLoading: false,
      label: STORE_OFFER_PRICE_DISPLAY_COPY.unavailable,
      tone: 'error',
    });
  });

  it('loads the pre-order estimate from the fresh ready offer', async () => {
    const preorder = { shipEstimate: { kind: 'month', month: '2026-10', part: null } } as const;
    const api = createApi({ readStoreOffer: vi.fn(async () => ({ ...workerOffer, preorder })) });

    await expect(loadStoreOfferPriceDisplayView(api, workerOffer.storeItemSlug)).resolves.toEqual({
      isLoading: false,
      label: '€28.00',
      tone: 'ready',
      preorder,
    });
  });

  it.each([
    ['2026-10-16', 'Release date', '16 Oct 2026'],
    ['2026-06-09', 'Album', 'Out now, released 9 Jun 2026'],
    ['2026-10-02', 'Album', 'Out now, released 2 Oct 2026'],
  ])('renders release facts for %s', (releaseDate, label, value) => {
    const html = renderView(
      createStoreOfferPriceDisplayView({
        ...workerOffer,
        preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
      }),
      { preorderFacts: true, releaseDate, isVinyl: true },
    );

    expect(html).toContain('class="preorder-facts"');
    expect(html).toContain(`<dt>${label}</dt><dd>${value}</dd>`);
    expect(html).toContain('<dt>Vinyl expected to ship</dt><dd>Around October 2026</dd>');
    expect(html).toContain('<dt>Payment</dt><dd>Charged in full today</dd>');
    expect(html.indexOf('€28.00')).toBeLessThan(html.indexOf('<dl'));
    expect(html).toMatch(/^<div>/);
    expect(html).toContain('class="preorder-badge">Pre-order</span>');
    expect(html.includes('class="store-item-card__release-status">Out now</span>')).toBe(label === 'Album');
  });

  it.each([
    [{ kind: 'month', month: '2026-10', part: 'early' }, 'Around early October 2026'],
    [{ kind: 'date', date: '2026-10-20' }, 'On 20 October 2026'],
    [null, 'To be confirmed'],
  ] as const)('renders the ship estimate %j', (shipEstimate, wording) => {
    const html = renderView(createStoreOfferPriceDisplayView({ ...workerOffer, preorder: { shipEstimate } }), {
      preorderFacts: true,
      releaseDate: new Date('2026-10-16T00:00:00Z'),
    });

    expect(html).toContain(`<dt>Expected to ship</dt><dd>${wording}</dd>`);
    expect(html).toContain('<dt>Release date</dt><dd>16 Oct 2026</dd>');
  });

  it('keeps the release day in UTC near midnight', () => {
    const html = renderView(createStoreOfferPriceDisplayView({ ...workerOffer, preorder: { shipEstimate: null } }), {
      preorderFacts: true,
      releaseDate: new Date('2026-10-02T23:30:00Z'),
    });

    expect(html).toContain('<dt>Album</dt><dd>Out now, released 2 Oct 2026</dd>');
    expect(html).toContain('class="store-item-card__release-status">Out now</span>');
  });

  it('does not invent a release date when none is available', () => {
    const html = renderView(createStoreOfferPriceDisplayView({ ...workerOffer, preorder: { shipEstimate: null } }), {
      preorderFacts: true,
    });

    expect(html).toContain('<dt>Release date</dt><dd>To be confirmed</dd>');
    expect(html).toContain('class="preorder-badge">Pre-order</span>');
    expect(html).not.toContain('Out now');
  });

  it('leaves other uses unchanged without the facts opt-in', () => {
    const ordinary = renderView(createStoreOfferPriceDisplayView(workerOffer));
    const preorder = renderView(
      createStoreOfferPriceDisplayView({ ...workerOffer, preorder: { shipEstimate: null } }),
      { releaseDate: '2026-10-16' },
    );

    expect(preorder).toBe(ordinary);
    expect(preorder).toMatch(/^<span>/);
  });

  it('shows no facts for an ordinary ready offer', () => {
    const html = renderView(createStoreOfferPriceDisplayView(workerOffer), {
      preorderFacts: true,
      releaseDate: '2026-06-09',
      isVinyl: true,
    });

    expect(html).toContain('€28.00');
    expect(html).not.toContain('preorder-facts');
    expect(html).not.toContain('preorder-badge');
    expect(html).not.toContain('Out now');
  });

  it.each(['sold_out', 'catalog_drift'] as const)('shows no facts for a %s offer', (catalogStatus) => {
    const view = createStoreOfferPriceDisplayView({
      ...workerOffer,
      catalogStatus,
      canCheckout: false,
      price: null,
      availability: {
        status: catalogStatus === 'sold_out' ? 'sold_out' : 'unavailable',
        label: 'Unavailable',
      },
    } as PublicStoreOffer);

    expect(view).not.toHaveProperty('preorder');
    expect(renderView(view, { preorderFacts: true })).not.toContain('preorder-facts');
  });

  it('shows no facts while the offer is pending', () => {
    const html = renderToStaticMarkup(
      <StoreOfferPriceDisplay storeItemSlug={workerOffer.storeItemSlug} preorderFacts releaseDate="2026-10-16" />,
    );

    expect(html).toContain(STORE_OFFER_PRICE_DISPLAY_COPY.loading);
    expect(html).not.toContain('preorder-facts');
  });

  it('shows no facts after a failed read', async () => {
    const api = createApi({
      readStoreOffer: vi.fn(async () => {
        throw new Error('Worker unavailable');
      }),
    });
    const view = await loadStoreOfferPriceDisplayView(api, workerOffer.storeItemSlug);

    expect(renderView(view, { preorderFacts: true })).not.toContain('preorder-facts');
  });
});

function renderView(
  view: StoreOfferPriceDisplayView,
  props: Partial<Parameters<typeof StoreOfferPriceDisplay>[0]> = {},
) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-02T12:00:00Z'));
  renderedState.view = view;

  return renderToStaticMarkup(<StoreOfferPriceDisplay storeItemSlug={workerOffer.storeItemSlug} {...props} />);
}

function createApi(overrides: Partial<PublicCheckoutApi>): PublicCheckoutApi {
  return {
    readCheckoutState: vi.fn(),
    readStoreCapabilities: vi.fn(),
    readStoreOffer: vi.fn(),
    readStoreOfferVariants: vi.fn(),
    registerNewsletterSignup: vi.fn(),
    startCheckout: vi.fn(),
    ...overrides,
  };
}
