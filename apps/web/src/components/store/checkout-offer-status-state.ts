import {
  PublicCheckoutApiError,
  type PublicCheckoutApi,
  type PublicStoreOffer,
} from '../../lib/backend/public-checkout-api';

export type CheckoutOfferInitialAvailability = {
  label: string;
  optionLabel: string | null;
  priceDisplay: string;
  canBuy: boolean;
};

export type CheckoutOfferStatusView = {
  badgeLabel: string;
  detail: string;
  isReady: boolean;
  statusLabel: string;
  tone: 'loading' | 'ready' | 'unavailable' | 'error';
  variantId: string | null;
};

export type CheckoutOfferLoadState =
  | {
      kind: 'ready';
      offer: PublicStoreOffer;
      variants: PublicStoreOffer[];
    }
  | {
      kind: 'error';
      message: string;
    };

export async function loadCheckoutOfferState(api: PublicCheckoutApi, storeItemSlug: string): Promise<CheckoutOfferLoadState> {
  try {
    const [offer, variants] = await Promise.all([
      api.readStoreOffer(storeItemSlug),
      api.readStoreOfferVariants(storeItemSlug),
    ]);

    return {
      kind: 'ready',
      offer,
      variants,
    };
  } catch (error) {
    return {
      kind: 'error',
      message: readCheckoutErrorMessage(error),
    };
  }
}

export function createInitialCheckoutOfferView(initialAvailability: CheckoutOfferInitialAvailability): CheckoutOfferStatusView {
  return {
    badgeLabel: 'Checking Worker',
    detail: initialAvailability.canBuy
      ? 'Static store data is ready. Confirming checkout eligibility with the Worker.'
      : 'Static store data says this item is not currently buyable.',
    isReady: false,
    statusLabel: initialAvailability.label,
    tone: 'loading',
    variantId: null,
  };
}

export function createCheckoutOfferView(loadState: CheckoutOfferLoadState): CheckoutOfferStatusView {
  if (loadState.kind === 'error') {
    return {
      badgeLabel: 'Backend unavailable',
      detail: loadState.message,
      isReady: false,
      statusLabel: 'Worker state unavailable',
      tone: 'error',
      variantId: null,
    };
  }

  if (!loadState.offer.canCheckout) {
    return {
      badgeLabel: 'Not checkout-ready',
      detail: 'The Worker can see this item, but it is not eligible for checkout right now.',
      isReady: false,
      statusLabel: loadState.offer.availability.label,
      tone: 'unavailable',
      variantId: loadState.offer.variantId,
    };
  }

  return {
    badgeLabel: 'Worker ready',
    detail: `Checkout eligibility confirmed for ${loadState.variants.length} variant${loadState.variants.length === 1 ? '' : 's'}.`,
    isReady: true,
    statusLabel: loadState.offer.availability.label,
    tone: 'ready',
    variantId: loadState.offer.variantId,
  };
}

function readCheckoutErrorMessage(error: unknown): string {
  if (error instanceof PublicCheckoutApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Could not load Worker checkout state.';
}
