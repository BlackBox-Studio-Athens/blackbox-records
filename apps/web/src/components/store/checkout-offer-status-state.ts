import {
  PublicCheckoutApiError,
  type PublicCheckoutApi,
  type PublicStoreOffer,
  type StoreCapabilities,
} from '../../lib/backend/public-checkout-api';
import type { CartLine } from '../../lib/store-cart';

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
      capabilities: StoreCapabilities;
      offer: PublicStoreOffer;
      variants: PublicStoreOffer[];
    }
  | {
      kind: 'error';
      message: string;
    };

export async function loadCheckoutOfferState(
  api: PublicCheckoutApi,
  storeItemSlug: string,
): Promise<CheckoutOfferLoadState> {
  try {
    const [capabilities, offer, variants] = await Promise.all([
      api.readStoreCapabilities(),
      api.readStoreOffer(storeItemSlug),
      api.readStoreOfferVariants(storeItemSlug),
    ]);

    return {
      kind: 'ready',
      capabilities,
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

export function createInitialCheckoutOfferView(
  initialAvailability: CheckoutOfferInitialAvailability,
): CheckoutOfferStatusView {
  return {
    badgeLabel: 'Checking availability',
    canStartCheckout: false,
    detail: initialAvailability.canBuy
      ? 'Confirming price and availability before payment opens.'
      : 'This item is not currently buyable.',
    isReady: false,
    statusLabel: initialAvailability.label,
    tone: 'loading',
    variantId: null,
  };
}

export function createCheckoutOfferView(loadState: CheckoutOfferLoadState): CheckoutOfferStatusView {
  if (loadState.kind === 'error') {
    return {
      badgeLabel: 'Checkout unavailable',
      canStartCheckout: false,
      detail: loadState.message,
      isReady: false,
      statusLabel: 'Checkout unavailable',
      tone: 'error',
      variantId: null,
    };
  }

  if (!loadState.offer.canCheckout) {
    return {
      badgeLabel: 'Not available',
      canStartCheckout: false,
      detail: 'This item is not eligible for checkout right now.',
      isReady: false,
      statusLabel: loadState.offer.availability.label,
      tone: 'unavailable',
      variantId: loadState.offer.variantId,
    };
  }

  if (!loadState.offer.variantId.trim()) {
    return {
      badgeLabel: 'Checkout unavailable',
      canStartCheckout: false,
      detail: 'Checkout is not ready for this item yet.',
      isReady: false,
      statusLabel: loadState.offer.availability.label,
      tone: 'error',
      variantId: null,
    };
  }

  if (!loadState.capabilities.nativeCheckout.enabled) {
    return {
      badgeLabel: 'Checkout paused',
      canStartCheckout: false,
      detail: loadState.capabilities.nativeCheckout.unavailableReason ?? 'Checkout is temporarily unavailable.',
      isReady: false,
      statusLabel: loadState.offer.availability.label,
      tone: 'unavailable',
      variantId: loadState.offer.variantId,
    };
  }

  return {
    badgeLabel: 'Checkout ready',
    canStartCheckout: true,
    detail: 'You will finish payment on Stripe.',
    isReady: true,
    statusLabel: loadState.offer.availability.label,
    tone: 'ready',
    variantId: loadState.offer.variantId,
  };
}

export type HostedCheckoutStartState =
  | {
      checkoutUrl: string;
      kind: 'redirect';
    }
  | {
      kind: 'error';
      message: string;
    };

export type HostedCheckoutStartInput = {
  api: PublicCheckoutApi;
  lines?: CartLine[];
  newsletterOptIn?: boolean;
  storeItemSlug: string;
  variantId: string;
};

export async function startHostedCheckout({
  api,
  lines,
  newsletterOptIn = false,
  storeItemSlug,
  variantId,
}: HostedCheckoutStartInput): Promise<HostedCheckoutStartState> {
  try {
    const checkoutLines =
      lines && lines.length > 0
        ? lines.map((line) => ({
            quantity: line.quantity,
            storeItemSlug: line.storeItemSlug,
            variantId: line.variantId,
          }))
        : [];
    const shouldSendMultiLineContract =
      checkoutLines.length > 1 ||
      (checkoutLines.length === 1 &&
        (checkoutLines[0]!.quantity !== 1 ||
          checkoutLines[0]!.storeItemSlug !== storeItemSlug ||
          checkoutLines[0]!.variantId !== variantId));
    const { checkoutUrl } = await api.startCheckout({
      ...(shouldSendMultiLineContract ? { lines: checkoutLines } : {}),
      ...(newsletterOptIn ? { newsletterOptIn: true } : {}),
      storeItemSlug,
      variantId,
    });

    if (typeof checkoutUrl !== 'string' || !checkoutUrl.trim()) {
      return {
        kind: 'error',
        message: 'Stripe checkout could not be opened. Please retry shortly.',
      };
    }

    return {
      checkoutUrl,
      kind: 'redirect',
    };
  } catch (error) {
    return {
      kind: 'error',
      message: readCheckoutErrorMessage(error),
    };
  }
}

function readCheckoutErrorMessage(error: unknown): string {
  if (error instanceof PublicCheckoutApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Could not load checkout status.';
}
