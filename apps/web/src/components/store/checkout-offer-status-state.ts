import {
  PublicCheckoutApiError,
  type PublicCheckoutApi,
  type PublicStoreOffer,
} from '../../lib/backend/public-checkout-api';
import type { EmbeddedCheckoutAdapter, EmbeddedCheckoutMount } from '../../lib/backend/stripe-embedded-checkout';

export type CheckoutOfferInitialAvailability = {
  label: string;
  optionLabel: string | null;
  priceDisplay: string;
  canBuy: boolean;
};

export type CheckoutOfferStatusView = {
  badgeLabel: string;
  canStartCheckout: boolean;
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
    canStartCheckout: false,
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
      canStartCheckout: false,
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
      canStartCheckout: false,
      detail: 'The Worker can see this item, but it is not eligible for checkout right now.',
      isReady: false,
      statusLabel: loadState.offer.availability.label,
      tone: 'unavailable',
      variantId: loadState.offer.variantId,
    };
  }

  return {
    badgeLabel: 'Worker ready',
    canStartCheckout: true,
    detail: `Checkout eligibility confirmed for ${loadState.variants.length} variant${loadState.variants.length === 1 ? '' : 's'}.`,
    isReady: true,
    statusLabel: loadState.offer.availability.label,
    tone: 'ready',
    variantId: loadState.offer.variantId,
  };
}

export type EmbeddedCheckoutStartState =
  | {
      kind: 'mounted';
      mount: EmbeddedCheckoutMount;
    }
  | {
      kind: 'error';
      message: string;
    };

export type EmbeddedCheckoutStartInput = {
  api: PublicCheckoutApi;
  checkoutAdapter: EmbeddedCheckoutAdapter;
  mountTarget: HTMLElement;
  storeItemSlug: string;
  variantId: string;
};

export async function startEmbeddedCheckout({
  api,
  checkoutAdapter,
  mountTarget,
  storeItemSlug,
  variantId,
}: EmbeddedCheckoutStartInput): Promise<EmbeddedCheckoutStartState> {
  const configurationError = checkoutAdapter.getConfigurationError();

  if (configurationError) {
    return {
      kind: 'error',
      message: configurationError,
    };
  }

  try {
    const { clientSecret } = await api.startCheckout({
      storeItemSlug,
      variantId,
    });
    const mount = await checkoutAdapter.mountEmbeddedCheckout({
      clientSecret,
      mountTarget,
    });

    return {
      kind: 'mounted',
      mount,
    };
  } catch (error) {
    return {
      kind: 'error',
      message: readCheckoutErrorMessage(error),
    };
  }
}

export function readCheckoutErrorMessage(error: unknown): string {
  if (error instanceof PublicCheckoutApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Could not load Worker checkout state.';
}
