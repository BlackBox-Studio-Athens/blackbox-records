import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PublicCheckoutApi, PublicStoreOffer } from '@/components/store/checkout/public-checkout-api';
import { STORE_CART_ADD_ITEM_EVENT, type CartLineItemSnapshot } from '@/components/store/cart/store-cart';
import StoreItemPurchaseActions, {
  createCartLineItemSnapshotFromWorkerOffer,
  loadStoreItemPurchaseActionState,
  readStoreItemPurchaseStatus,
  requestStoreCartAddItem,
  STORE_ITEM_PURCHASE_ACTION_COPY,
  type StoreItemCartSeed,
} from './StoreItemPurchaseActions';
import StoreItemPurchaseStatus from './StoreItemPurchaseStatus';
import { takePendingStoreCartAddItems } from '@/components/store/cart/store-cart-events';
import AvailabilityAlertForm, {
  AVAILABILITY_ALERT_COPY,
  availabilityAlertErrors,
  sendAvailabilityAlert,
} from './AvailabilityAlertForm';

const cartItem: CartLineItemSnapshot = {
  availabilityLabel: 'Available',
  image: '/blackbox-records/assets/disintegration.jpg',
  imageAlt: 'Disintegration by Afterwise',
  optionLabel: 'Black Vinyl LP',
  priceAmountMinor: 2800,
  priceCurrencyCode: 'EUR',
  priceDisplay: '€28.00',
  priceKind: 'fixed',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

const cartSeed: StoreItemCartSeed = {
  availabilityLabel: 'Available',
  image: '/blackbox-records/assets/disintegration.jpg',
  imageAlt: 'Disintegration by Afterwise',
  optionLabel: 'Black Vinyl LP',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
  variantId: null,
};

const readyOffer: PublicStoreOffer = {
  availability: { label: 'Available', status: 'available' },
  canCheckout: true,
  catalogStatus: 'ready',
  preorder: null,
  price: { amountMinor: 2800, currencyCode: 'EUR', display: '€28.00', kind: 'fixed' },
  storeItemSlug: 'disintegration-black-vinyl-lp',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

const soldOutOffer: PublicStoreOffer = {
  availability: { label: 'Sold Out', state: 'sold_out', status: 'sold_out' },
  canCheckout: false,
  catalogStatus: 'sold_out',
  price: null,
  storeItemSlug: 'disintegration-black-vinyl-lp',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

const comingSoonOffer: PublicStoreOffer = {
  ...soldOutOffer,
  availability: { label: 'Coming Soon', state: 'coming_soon', status: 'sold_out' },
  expectedMonth: '2026-11',
  links: [{ rel: 'availability-alert', href: '/api/store/items/disintegration-black-vinyl-lp/availability-alerts' }],
};

const repressingOffer: PublicStoreOffer = {
  ...comingSoonOffer,
  availability: { label: 'Repressing', state: 'repressing', status: 'sold_out' },
};

const pausedOffer: PublicStoreOffer = {
  ...soldOutOffer,
  availability: { label: 'Unavailable', state: 'unavailable', status: 'sold_out' },
};

const checkoutPausedOffer: PublicStoreOffer = {
  availability: { label: 'Checkout Paused', status: 'unavailable' },
  canCheckout: false,
  catalogStatus: 'catalog_drift',
  price: null,
  storeItemSlug: 'disintegration-black-vinyl-lp',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

describe('StoreItemPurchaseActions', () => {
  afterEach(() => vi.useRealTimers());

  it('renders Add To Cart for eligible items without direct checkout copy', () => {
    const html = renderToStaticMarkup(<StoreItemPurchaseActions cartItem={cartItem} cartSeed={null} />);

    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.addToCart);
    expect(html).toContain('data-store-item-add-to-cart="true"');
    expect(html).toContain('min-h-11');
    expect(html).toContain('sm:w-56');
    expect(html).toContain('w-full');
    expect(html).not.toContain('Buy Now');
    expect(html).not.toContain('href=');
    expect(html).not.toContain('data-store-item-added');
    expect(html).not.toContain('preorder-action');
    expect(html).toContain('aria-live="polite"');
  });

  it.each([
    { shipEstimate: null },
    { shipEstimate: { kind: 'month' as const, month: '2026-10', part: 'mid' as const } },
    { shipEstimate: { kind: 'date' as const, date: '2026-10-20' } },
  ])('renders the pre-order action and exact hint for an active snapshot: %j', (preorder) => {
    const html = renderToStaticMarkup(
      <StoreItemPurchaseActions cartItem={{ ...cartItem, preorder }} cartSeed={null} purchaseHint="Ordinary hint" />,
    );
    expect(html).toContain('>Pre-order</button>');
    expect(html).toContain('preorder-action');
    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.preorderHint);
    expect(html).not.toContain('Ordinary hint');
    expect(html).toContain('data-store-item-add-to-cart="true"');
    expect(html).toContain('sm:w-56');
    expect(html).toContain('min-h-11');
  });

  it('keeps a stale pre-order hidden while a fresh Worker offer is pending', () => {
    const html = renderToStaticMarkup(
      <StoreItemPurchaseActions cartItem={{ ...cartItem, preorder: { shipEstimate: null } }} cartSeed={cartSeed} />,
    );
    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.checking);
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('preorder-action');
    expect(html).not.toContain(STORE_ITEM_PURCHASE_ACTION_COPY.preorderHint);
  });

  it.each([
    ['2026-10-16', true, STORE_ITEM_PURCHASE_ACTION_COPY.preorderHint],
    ['2026-06-09', true, STORE_ITEM_PURCHASE_ACTION_COPY.releasedVinylPreorderHint],
    ['2026-10-03T23:30:00Z', true, STORE_ITEM_PURCHASE_ACTION_COPY.releasedVinylPreorderHint],
    [null, true, STORE_ITEM_PURCHASE_ACTION_COPY.preorderHint],
    ['2026-06-09', false, STORE_ITEM_PURCHASE_ACTION_COPY.releasedPreorderHint],
  ] as const)('distinguishes released music from pending copies for %s, vinyl=%s', (releaseDate, isVinyl, hint) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-03T00:15:00Z'));
    const html = renderToStaticMarkup(
      <StoreItemPurchaseActions
        cartItem={{ ...cartItem, optionLabel: isVinyl ? 'Black Vinyl LP' : 'CD', preorder: { shipEstimate: null } }}
        cartSeed={null}
        releaseDate={releaseDate}
        isVinyl={isVinyl}
      />,
    );

    expect(html).toContain(hint);
    expect(html).toContain('>Pre-order</button>');
    if (!isVinyl) expect(html).not.toContain('vinyl');
    if (hint === STORE_ITEM_PURCHASE_ACTION_COPY.preorderHint) expect(html).not.toContain('album is out');
  });

  it('does not keep release-aware pre-order hints after a fresh ordinary or unavailable offer', async () => {
    const readStoreOffer = vi
      .fn<PublicCheckoutApi['readStoreOffer']>()
      .mockResolvedValueOnce(readyOffer)
      .mockResolvedValueOnce(soldOutOffer);
    const api = createApi({ readStoreOffer });
    const staleSeed = { ...cartSeed, preorder: { shipEstimate: null } };

    for (let index = 0; index < 2; index++) {
      const state = await loadStoreItemPurchaseActionState(api, staleSeed);
      const html = renderToStaticMarkup(
        <StoreItemPurchaseActions cartItem={state.cartItem} cartSeed={null} releaseDate="2026-06-09" isVinyl />,
      );
      expect(html).not.toContain('preorder-action');
      expect(html).not.toContain(STORE_ITEM_PURCHASE_ACTION_COPY.releasedVinylPreorderHint);
    }
  });

  it('keeps an older cart snapshot disabled while a fresh Worker offer is pending', () => {
    const html = renderToStaticMarkup(<StoreItemPurchaseActions cartItem={cartItem} cartSeed={cartSeed} />);

    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.checking);
    expect(html).toContain('disabled=""');
    expect(html).not.toContain(STORE_ITEM_PURCHASE_ACTION_COPY.addToCart);
    expect(html).not.toContain('data-store-item-add-to-cart');
  });

  it('renders pending availability as disabled, busy, and non-actionable', () => {
    const html = renderToStaticMarkup(<StoreItemPurchaseActions cartItem={null} cartSeed={cartSeed} />);

    expect(html).toContain(STORE_ITEM_PURCHASE_ACTION_COPY.checking);
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('animate-spin');
    expect(html).not.toContain(STORE_ITEM_PURCHASE_ACTION_COPY.addToCart);
    expect(html).not.toContain('data-store-item-add-to-cart');
  });

  it('renders nothing in the purchase slot when no offer can be shown', () => {
    expect(renderToStaticMarkup(<StoreItemPurchaseActions cartItem={null} cartSeed={null} />)).toBe('');
  });

  it('renders Sold Out as a solid Store Blood status, not a disabled button, with no line or Notify me', () => {
    const html = renderToStaticMarkup(
      <StoreItemPurchaseStatus state={readStoreItemPurchaseStatus(soldOutOffer)} storeItemSlug="item" />,
    );
    expect(html).toMatch(/^<p role="status"/);
    expect(html).toContain('>Sold Out</p>');
    expect(html).toContain('border-[var(--store-accent)]');
    expect(html).toContain('data-store-item-purchase-tone="sold-out"');
    expect(html).toContain('min-h-11');
    expect(html).toContain('sm:w-56');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('<svg');
    expect(html).not.toContain('data-store-item-availability-note');
    expect(html).not.toContain(AVAILABILITY_ALERT_COPY.open);
  });

  it.each([
    [comingSoonOffer, 'Coming Soon', 'lucide-disc-3', 'First pressing on its way · Expected November 2026'],
    [repressingOffer, 'Repressing', 'lucide-rotate-cw', 'More copies being pressed · Expected November 2026'],
    [{ ...repressingOffer, expectedMonth: undefined }, 'Repressing', 'lucide-rotate-cw', 'More copies being pressed'],
  ] as [PublicStoreOffer, string, string, string][])(
    'renders %#: a dashed status with a small icon, its line and the quiet Notify me action',
    (offer, label, icon, line) => {
      const html = renderToStaticMarkup(
        <StoreItemPurchaseStatus state={readStoreItemPurchaseStatus(offer)} storeItemSlug="item" />,
      );
      expect(html).toContain('data-store-item-purchase-tone="incoming"');
      expect(html).toContain('border-dashed');
      expect(html).not.toContain('border-[var(--store-accent)]');
      expect(html).toContain(icon);
      expect(html).toMatch(/<svg[^>]*width="14"/);
      expect(html).toContain(`${label}</p>`);
      expect(html).toContain(`data-store-item-availability-note="true">${line}</p>`);
      expect(html).toContain('site-button--ghost');
      expect(html).toContain('lucide-mail');
      expect(html).toContain(AVAILABILITY_ALERT_COPY.open);
      expect(html).not.toMatch(/Out of Stock|Currently Unavailable|Unavailable/);
    },
  );

  it('shows no status, line or Notify me for a paused or unrecognised state', () => {
    const unknownOffer = {
      ...pausedOffer,
      availability: { ...pausedOffer.availability, state: 'out_of_stock' },
    } as unknown as PublicStoreOffer;
    for (const offer of [pausedOffer, unknownOffer])
      expect(
        renderToStaticMarkup(
          <StoreItemPurchaseStatus state={readStoreItemPurchaseStatus(offer)} storeItemSlug="item" />,
        ),
      ).toBe('');
  });

  it('dispatches the browser-safe cart item through the existing cart event', () => {
    const eventTarget = new EventTarget();
    let receivedDetail: CartLineItemSnapshot | null = null;

    eventTarget.addEventListener(STORE_CART_ADD_ITEM_EVENT, (event) => {
      receivedDetail = (event as CustomEvent<CartLineItemSnapshot>).detail;
    });

    expect(requestStoreCartAddItem(cartItem, eventTarget)).toBe(true);
    expect(receivedDetail).toEqual(cartItem);
    expect(JSON.stringify(receivedDetail)).toContain('disintegration-black-vinyl-lp');
    expect(JSON.stringify(receivedDetail)).not.toContain('price_');
    expect(JSON.stringify(receivedDetail)).not.toContain('clientSecret');
    expect(JSON.stringify(receivedDetail)).not.toContain('stockCount');
  });

  it('keeps an add until a cart bridge acknowledges it', () => {
    takePendingStoreCartAddItems();
    const acknowledging = new EventTarget();
    acknowledging.addEventListener(STORE_CART_ADD_ITEM_EVENT, (event) => event.preventDefault());

    expect(requestStoreCartAddItem(cartItem, acknowledging)).toBe(false);
    expect(takePendingStoreCartAddItems()).toEqual([]);

    expect(requestStoreCartAddItem(cartItem, new EventTarget())).toBe(true);
    expect(takePendingStoreCartAddItems()).toEqual([cartItem]);
  });

  it('creates a browser-safe CartLineItemSnapshot from Worker checkout readiness', () => {
    const workerCartItem = createCartLineItemSnapshotFromWorkerOffer(cartSeed, {
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
    });

    expect(workerCartItem).toEqual({
      ...cartItem,
      availabilityLabel: 'Available',
      preorder: null,
    });
    expect(JSON.stringify(workerCartItem)).not.toContain('price_');
    expect(JSON.stringify(workerCartItem)).not.toContain('clientSecret');
  });

  it('creates a pay-what-you-want CartLineItemSnapshot without a fixed amount', () => {
    expect(
      createCartLineItemSnapshotFromWorkerOffer(cartSeed, {
        availability: {
          label: 'Available',
          status: 'available',
        },
        canCheckout: true,
        catalogStatus: 'ready',
        preorder: null,
        price: {
          currencyCode: 'EUR',
          display: 'Pay what you want',
          kind: 'pay_what_you_want',
          maximumAmountMinor: 10000,
          minimumAmountMinor: 100,
          presetAmountMinor: 500,
        },
        storeItemSlug: 'band-in-the-pit-2016-cassette',
        variantId: 'variant_band-in-the-pit-2016-cassette_standard',
      }),
    ).toMatchObject({
      priceAmountMinor: null,
      priceCurrencyCode: 'EUR',
      priceDisplay: 'Pay what you want',
      priceKind: 'pay_what_you_want',
    });
  });

  it('does not create a CartLineItemSnapshot from unavailable Worker state', () => {
    expect(
      createCartLineItemSnapshotFromWorkerOffer(cartSeed, {
        availability: {
          label: 'Sold Out',
          state: 'sold_out',
          status: 'sold_out',
        },
        canCheckout: false,
        catalogStatus: 'sold_out',
        price: null,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      }),
    ).toBeNull();
  });

  it('uses the resolved Worker label, then accepts a later ready offer without restoring the stale snapshot', async () => {
    const readStoreOffer = vi
      .fn<PublicCheckoutApi['readStoreOffer']>()
      .mockResolvedValueOnce(soldOutOffer)
      .mockResolvedValueOnce(readyOffer);
    const api = createApi({ readStoreOffer });

    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toEqual({
      cartItem: null,
      label: 'Sold Out',
      statusTone: 'sold-out',
      availabilityState: 'sold_out',
    });
    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toMatchObject({
      cartItem: { priceDisplay: '€28.00', variantId: readyOffer.variantId },
      label: null,
      statusTone: 'neutral',
    });
  });

  it('carries the Worker copies-left count only with a buyable offer', async () => {
    const readStoreOffer = vi
      .fn<PublicCheckoutApi['readStoreOffer']>()
      .mockResolvedValueOnce({ ...readyOffer, lowStockQuantity: 3 })
      .mockResolvedValueOnce({ ...readyOffer, lowStockQuantity: 1 })
      .mockResolvedValueOnce(readyOffer);
    const api = createApi({ readStoreOffer });

    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toMatchObject({
      cartItem: { variantId: readyOffer.variantId },
      lowStockLabel: 'Only 3 left',
    });
    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toMatchObject({
      lowStockLabel: 'Only 1 left',
    });
    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.not.toHaveProperty('lowStockLabel');
  });

  it('takes the live pre-order from the Worker and preserves its copies-left label', async () => {
    const preorder = { shipEstimate: { kind: 'month' as const, month: '2026-10', part: null } };
    const readStoreOffer = vi
      .fn<PublicCheckoutApi['readStoreOffer']>()
      .mockResolvedValueOnce({ ...readyOffer, preorder, lowStockQuantity: 3 })
      .mockResolvedValueOnce(readyOffer)
      .mockResolvedValueOnce(soldOutOffer);
    const api = createApi({ readStoreOffer });
    const staleSeed = { ...cartSeed, preorder: { shipEstimate: null } };
    await expect(loadStoreItemPurchaseActionState(api, staleSeed)).resolves.toMatchObject({
      cartItem: { preorder },
      lowStockLabel: 'Only 3 left',
      label: null,
    });
    await expect(loadStoreItemPurchaseActionState(api, staleSeed)).resolves.toMatchObject({
      cartItem: { preorder: null },
    });
    await expect(loadStoreItemPurchaseActionState(api, staleSeed)).resolves.toEqual({
      cartItem: null,
      label: 'Sold Out',
      statusTone: 'sold-out',
      availabilityState: 'sold_out',
    });
  });

  it('takes label, tone and month from the typed state, never from the label text', async () => {
    const readStoreOffer = vi
      .fn<PublicCheckoutApi['readStoreOffer']>()
      .mockResolvedValueOnce(comingSoonOffer)
      .mockResolvedValueOnce(checkoutPausedOffer)
      .mockResolvedValueOnce(pausedOffer)
      .mockResolvedValueOnce({ ...soldOutOffer, availability: { ...soldOutOffer.availability, label: 'Coming Soon' } });
    const api = createApi({ readStoreOffer });

    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toEqual({
      cartItem: null,
      label: 'Coming Soon',
      statusTone: 'incoming',
      availabilityState: 'coming_soon',
      expectedMonth: '2026-11',
    });
    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toEqual({
      cartItem: null,
      label: 'Checkout Paused',
      statusTone: 'neutral',
    });
    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toMatchObject({
      label: null,
      availabilityState: 'unavailable',
    });
    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toMatchObject({
      label: 'Sold Out',
      statusTone: 'sold-out',
    });
  });

  it('drops a month that came with a Sold Out offer', () => {
    expect(readStoreItemPurchaseStatus({ ...soldOutOffer, expectedMonth: '2026-11' })).not.toHaveProperty(
      'expectedMonth',
    );
  });

  it('shows no status after a failed Worker read', async () => {
    const api = createApi({
      readStoreOffer: vi.fn(async () => {
        throw new Error('Worker unavailable');
      }),
    });

    await expect(loadStoreItemPurchaseActionState(api, cartSeed)).resolves.toEqual({
      cartItem: null,
      label: null,
      statusTone: 'neutral',
    });
  });

  it('does not create a CartLineItemSnapshot when the static page has no priced seed', () => {
    expect(
      createCartLineItemSnapshotFromWorkerOffer(null, {
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
        storeItemSlug: 'aftermaths',
        variantId: 'variant_aftermaths_standard',
      }),
    ).toBeNull();
  });
});

describe('Notify me', () => {
  it('opens to an email field and an unticked one-off consent with Send and Cancel', () => {
    const html = renderToStaticMarkup(<AvailabilityAlertForm initial={{ step: 'open' }} storeItemSlug="item" />);
    expect(html).toContain('>Email</label>');
    expect(html).toMatch(/<input[^>]*type="email"[^>]*autoComplete="email"/);
    expect(html).toContain(AVAILABILITY_ALERT_COPY.consent);
    expect(html).toMatch(/<input type="checkbox" name="consent"(?![^>]*checked)[^>]*>/);
    expect(html).toContain('>Send</button>');
    expect(html).toContain('site-button--link');
    expect(html).toContain('>Cancel</button>');
    expect(html).not.toContain('aria-invalid');
  });

  it('validates the email and consent in the browser before any request', () => {
    expect(availabilityAlertErrors('', false)).toEqual({
      email: AVAILABILITY_ALERT_COPY.invalidEmail,
      consent: AVAILABILITY_ALERT_COPY.missingConsent,
    });
    expect(availabilityAlertErrors('listener@example', true)).toEqual({ email: 'Enter a valid email.' });
    expect(availabilityAlertErrors(' listener@example.com ', false)).toEqual({
      consent: 'Tick the box so we can email you.',
    });
    expect(availabilityAlertErrors('listener@example.com', true)).toEqual({});
  });

  it('links each error to its control', () => {
    const html = renderToStaticMarkup(
      <AvailabilityAlertForm
        initial={{ step: 'open', email: 'nope', errors: availabilityAlertErrors('nope', false) }}
        storeItemSlug="item"
      />,
    );
    const emailError = /<input[^>]*type="email"[^>]*aria-describedby="([^"]+)"/.exec(html)?.[1];
    const consentError = /<input type="checkbox"[^>]*aria-describedby="([^"]+)"/.exec(html)?.[1];
    expect(html.match(/aria-invalid="true"/g)).toHaveLength(2);
    expect(html).toContain(`id="${emailError}" class="availability-alert__error">Enter a valid email.</p>`);
    expect(html).toContain(
      `id="${consentError}" class="availability-alert__error">Tick the box so we can email you.</p>`,
    );
  });

  it('keeps the Send width while sending and confirms in a status region', () => {
    const sending = renderToStaticMarkup(
      <AvailabilityAlertForm initial={{ step: 'sending', email: 'a@b.co', consent: true }} storeItemSlug="item" />,
    );
    expect(sending).toMatch(/<button[^>]*availability-alert__send[^>]*aria-busy="true"[^>]*>Sending<\/button>/);
    const done = renderToStaticMarkup(<AvailabilityAlertForm initial={{ step: 'done' }} storeItemSlug="item" />);
    expect(done).toContain('role="status"');
    expect(done).toContain('tabindex="-1"');
    expect(done).toContain('We&#x27;ll email you once when it can be ordered.');
    expect(done).not.toContain('<form');
  });

  it('sends only the email, consent and Store Item, and reads any failure as retryable', async () => {
    const requestAvailabilityAlert = vi
      .fn<PublicCheckoutApi['requestAvailabilityAlert']>()
      .mockResolvedValueOnce({ status: 'requested' })
      .mockRejectedValueOnce(new Error('availability_alert_busy'));
    const api = createApi({ requestAvailabilityAlert });
    await expect(sendAvailabilityAlert(api, 'item', ' listener@example.com ')).resolves.toBe('done');
    expect(requestAvailabilityAlert).toHaveBeenCalledWith('item', { email: 'listener@example.com', consent: true });
    await expect(sendAvailabilityAlert(api, 'item', 'listener@example.com')).resolves.toEqual({
      form: AVAILABILITY_ALERT_COPY.failed,
    });
    const retry = renderToStaticMarkup(
      <AvailabilityAlertForm
        initial={{
          step: 'open',
          email: 'listener@example.com',
          consent: true,
          errors: { form: AVAILABILITY_ALERT_COPY.failed },
        }}
        storeItemSlug="item"
      />,
    );
    expect(retry).toContain('value="listener@example.com"');
    expect(retry).toMatch(/<input type="checkbox" name="consent" checked=""/);
    expect(retry).toContain('role="alert">Couldn&#x27;t save that. Try again.</p>');
  });
});

function createApi(overrides: Partial<PublicCheckoutApi>): PublicCheckoutApi {
  return {
    readCheckoutState: vi.fn(),
    readStoreCapabilities: vi.fn(),
    readStoreOffer: vi.fn(),
    readStoreOfferVariants: vi.fn(),
    registerNewsletterSignup: vi.fn(),
    requestAvailabilityAlert: vi.fn(),
    startCheckout: vi.fn(),
    ...overrides,
  };
}
