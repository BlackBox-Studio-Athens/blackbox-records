import type { CheckoutState, PublicCheckoutApi } from '@/lib/backend/public-checkout-api';

export type CheckoutReturnLoadState =
  | { kind: 'loading' }
  | { kind: 'missing_session' }
  | { kind: 'ready'; checkoutState: CheckoutState }
  | { kind: 'error'; message: string };

export type CheckoutReturnStatusView = {
  badgeLabel: string;
  detail: string;
  isFinal: boolean;
  shippingLocker: CheckoutReturnShippingLockerView;
  title: string;
  tone: 'loading' | 'success' | 'attention' | 'error';
};

export type CheckoutReturnShippingLockerView =
  | { kind: 'hidden' }
  | { detail: string; kind: 'selected'; label: string }
  | { detail: string; kind: 'manual'; label: string };

export function readCheckoutSessionIdFromSearch(search: string): string | null {
  const sessionId = new URLSearchParams(search).get('session_id')?.trim();
  return sessionId || null;
}

export async function loadCheckoutReturnState(
  api: Pick<PublicCheckoutApi, 'readCheckoutState'>,
  checkoutSessionId: string | null,
): Promise<CheckoutReturnLoadState> {
  if (!checkoutSessionId) {
    return { kind: 'missing_session' };
  }

  try {
    return {
      checkoutState: await api.readCheckoutState(checkoutSessionId),
      kind: 'ready',
    };
  } catch (error) {
    return {
      kind: 'error',
      message: error instanceof Error ? error.message : 'Could not load checkout status.',
    };
  }
}

export function createCheckoutReturnStatusView(state: CheckoutReturnLoadState): CheckoutReturnStatusView {
  const shippingLocker = createCheckoutReturnShippingLockerView(state);

  if (state.kind === 'loading') {
    return {
      badgeLabel: 'Checking',
      detail: 'Checking checkout status with the payment server.',
      isFinal: false,
      shippingLocker,
      title: 'Checking Checkout',
      tone: 'loading',
    };
  }

  if (state.kind === 'missing_session') {
    return {
      badgeLabel: 'Needs Retry',
      detail: 'This return link is missing a checkout session. You can retry checkout from the item page.',
      isFinal: false,
      shippingLocker,
      title: 'Checkout Link Incomplete',
      tone: 'attention',
    };
  }

  if (state.kind === 'error') {
    return {
      badgeLabel: 'Needs Retry',
      detail: state.message,
      isFinal: false,
      shippingLocker,
      title: 'Checkout State Unavailable',
      tone: 'error',
    };
  }

  if (state.checkoutState.state === 'paid') {
    return {
      badgeLabel: 'Paid',
      detail: 'Payment is confirmed. Final order handling is completed by the secure backend flow.',
      isFinal: true,
      shippingLocker,
      title: 'Payment Confirmed',
      tone: 'success',
    };
  }

  if (state.checkoutState.state === 'processing') {
    return {
      badgeLabel: 'Processing',
      detail: 'Payment is still processing. Check again shortly before retrying checkout.',
      isFinal: false,
      shippingLocker,
      title: 'Payment Processing',
      tone: 'attention',
    };
  }

  if (state.checkoutState.state === 'expired') {
    return {
      badgeLabel: 'Expired',
      detail: 'The checkout session expired before payment finished. You can retry checkout safely.',
      isFinal: false,
      shippingLocker,
      title: 'Checkout Expired',
      tone: 'attention',
    };
  }

  if (state.checkoutState.state === 'open') {
    return {
      badgeLabel: 'Open',
      detail: 'Checkout is still open. Continue or retry checkout when you are ready.',
      isFinal: false,
      shippingLocker,
      title: 'Checkout Still Open',
      tone: 'attention',
    };
  }

  return {
    badgeLabel: 'Unknown',
    detail: 'Checkout state is not clear yet. Retry checkout or contact the label if payment completed.',
    isFinal: false,
    shippingLocker,
    title: 'Checkout State Unknown',
    tone: 'error',
  };
}

function createCheckoutReturnShippingLockerView(state: CheckoutReturnLoadState): CheckoutReturnShippingLockerView {
  if (state.kind !== 'ready') {
    return { kind: 'hidden' };
  }

  const locker = state.checkoutState.shippingLocker;

  if (!locker) {
    return {
      detail: 'Stripe collected the shipping details. The label will create the BOX NOW shipment manually.',
      kind: 'manual',
      label: 'Manual BOX NOW Fulfillment',
    };
  }

  return {
    detail: `Locker ID ${locker.locker_id} · Greece-only BOX NOW`,
    kind: 'selected',
    label: locker.locker_name_or_label,
  };
}
