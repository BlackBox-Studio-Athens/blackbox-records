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
  kicker: string;
  nextStep: string;
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
      detail: 'We are confirming the latest payment status before showing your order result.',
      isFinal: false,
      kicker: 'Payment Status',
      nextStep: 'This usually takes a moment. Keep this tab open.',
      shippingLocker,
      title: 'Confirming Payment',
      tone: 'loading',
    };
  }

  if (state.kind === 'missing_session') {
    return {
      badgeLabel: 'Needs Retry',
      detail: 'This return link is incomplete, so we cannot confirm a payment from it.',
      isFinal: false,
      kicker: 'Return Link',
      nextStep: 'Go back to the item and start checkout again.',
      shippingLocker,
      title: 'Return Link Incomplete',
      tone: 'attention',
    };
  }

  if (state.kind === 'error') {
    return {
      badgeLabel: 'Needs Retry',
      detail: state.message,
      isFinal: false,
      kicker: 'Status Unavailable',
      nextStep: 'If you saw a payment complete in Stripe, contact the label before trying again.',
      shippingLocker,
      title: 'We Could Not Confirm Payment',
      tone: 'error',
    };
  }

  if (state.checkoutState.state === 'paid') {
    return {
      badgeLabel: 'Confirmed',
      detail: 'Payment is confirmed and your order is recorded.',
      isFinal: true,
      kicker: 'Order Complete',
      nextStep: 'The label will prepare the shipment manually through BOX NOW.',
      shippingLocker,
      title: 'Order Confirmed',
      tone: 'success',
    };
  }

  if (state.checkoutState.state === 'processing') {
    return {
      badgeLabel: 'Processing',
      detail: 'Stripe is still processing the payment.',
      isFinal: false,
      kicker: 'Payment Pending',
      nextStep: 'Wait a short while before retrying, so you do not start a duplicate payment.',
      shippingLocker,
      title: 'Payment Processing',
      tone: 'attention',
    };
  }

  if (state.checkoutState.state === 'expired') {
    return {
      badgeLabel: 'Expired',
      detail: 'The payment session expired before a payment was confirmed.',
      isFinal: false,
      kicker: 'Session Expired',
      nextStep: 'You can safely start checkout again from the item page.',
      shippingLocker,
      title: 'Checkout Expired',
      tone: 'attention',
    };
  }

  if (state.checkoutState.state === 'open') {
    return {
      badgeLabel: 'Open',
      detail: 'The payment session has not finished yet.',
      isFinal: false,
      kicker: 'Payment Not Finished',
      nextStep: 'Return to checkout if you still want to complete the order.',
      shippingLocker,
      title: 'Payment Not Finished',
      tone: 'attention',
    };
  }

  return {
    badgeLabel: 'Unknown',
    detail: 'The payment status is not clear yet.',
    isFinal: false,
    kicker: 'Status Unclear',
    nextStep: 'If Stripe showed a completed payment, contact the label before retrying.',
    shippingLocker,
    title: 'We Could Not Confirm Payment',
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
      detail: 'Shipping details were collected in Stripe. The label will arrange BOX NOW manually.',
      kind: 'manual',
      label: 'BOX NOW arranged by the label',
    };
  }

  return {
    detail: `Locker ID ${locker.locker_id} · Greece-only BOX NOW`,
    kind: 'selected',
    label: locker.locker_name_or_label,
  };
}
