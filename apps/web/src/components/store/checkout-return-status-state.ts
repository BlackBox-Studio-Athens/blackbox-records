import type { CheckoutState, PublicCheckoutApi } from '@/lib/backend/public-checkout-api';

export type CheckoutReturnLoadState =
  | { kind: 'loading' }
  | { kind: 'missing_session' }
  | { kind: 'ready'; checkoutState: CheckoutState; refreshStopped?: boolean }
  | { kind: 'error'; message: string };

export type CheckoutReturnStatusView = {
  autoRefresh?: boolean;
  supportOnly?: boolean;
  badgeLabel: string;
  detail: string;
  isFinal: boolean;
  kicker: string;
  nextStep: string;
  nextSteps: CheckoutReturnNextStepsView | null;
  shippingLocker: CheckoutReturnShippingLockerView;
  title: string;
  tone: 'loading' | 'success' | 'attention' | 'error';
};

export type CheckoutReturnNextStepsView = {
  heading: string;
  items: CheckoutReturnNextStepView[];
};

export type CheckoutReturnNextStepView = {
  icon: 'receipt' | 'fulfillment' | 'delivery';
  label: string;
  value: string;
};

export type CheckoutReturnShippingLockerView = { kind: 'hidden' } | { detail: string; kind: 'selected'; label: string };

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
      nextSteps: null,
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
      nextSteps: null,
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
      nextSteps: null,
      shippingLocker,
      title: 'We Could Not Confirm Payment',
      tone: 'error',
    };
  }

  const { checkoutState } = state;
  const paymentReceived = checkoutState.paymentStatus === 'paid';
  if (
    checkoutState.orderStatus === 'needs_review' ||
    (checkoutState.orderStatus === 'not_paid' && (paymentReceived || checkoutState.state === 'processing')) ||
    (checkoutState.orderStatus === 'paid' && !paymentReceived)
  ) {
    return {
      badgeLabel: 'Needs Review',
      detail: paymentReceived
        ? 'Payment was received, but your order needs our attention.'
        : 'Your order status needs our attention.',
      isFinal: false,
      kicker: 'Order Review',
      nextStep: 'Contact the label for help. Do not pay again.',
      nextSteps: null,
      shippingLocker,
      supportOnly: true,
      title: 'Contact the label',
      tone: 'attention',
    };
  }

  if (paymentReceived && checkoutState.orderStatus === 'paid') {
    return {
      badgeLabel: 'Confirmed',
      detail: 'Payment is confirmed and your order is recorded.',
      isFinal: true,
      kicker: 'Order Complete',
      nextStep: '',
      nextSteps: createCheckoutReturnNextStepsView(),
      shippingLocker,
      title: 'Thanks for the order',
      tone: 'success',
    };
  }

  if (paymentReceived) {
    return {
      autoRefresh: !state.refreshStopped,
      badgeLabel: 'Payment Received',
      detail: 'Payment was received. We are waiting for your order confirmation.',
      isFinal: false,
      kicker: 'Order Pending',
      nextStep: state.refreshStopped
        ? 'Refresh the status or contact the label. Do not pay again.'
        : 'We will check again automatically. Do not pay again.',
      nextSteps: null,
      shippingLocker,
      supportOnly: true,
      title: 'Confirming your order',
      tone: 'attention',
    };
  }

  if (state.checkoutState.state === 'processing') {
    return {
      autoRefresh: !state.refreshStopped,
      supportOnly: true,
      badgeLabel: 'Processing',
      detail: 'Stripe is still processing the payment.',
      isFinal: false,
      kicker: 'Payment Pending',
      nextStep: state.refreshStopped
        ? 'Refresh the status or contact the label before trying again.'
        : 'We will check again automatically. Do not start another payment.',
      nextSteps: null,
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
      nextSteps: null,
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
      nextSteps: null,
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
    nextSteps: null,
    shippingLocker,
    title: 'We Could Not Confirm Payment',
    tone: 'error',
  };
}

function createCheckoutReturnNextStepsView(): CheckoutReturnNextStepsView {
  return {
    heading: 'What happens next',
    items: [
      {
        icon: 'receipt',
        label: 'Receipt',
        value: 'Check the email used at checkout for the Stripe payment receipt.',
      },
      {
        icon: 'fulfillment',
        label: 'Fulfillment',
        value: 'BlackBox will prepare the shipment manually.',
      },
      {
        icon: 'delivery',
        label: 'Delivery',
        value: 'BOX NOW details will follow once the shipment is arranged.',
      },
    ],
  };
}

function createCheckoutReturnShippingLockerView(state: CheckoutReturnLoadState): CheckoutReturnShippingLockerView {
  if (state.kind !== 'ready') {
    return { kind: 'hidden' };
  }

  const locker = state.checkoutState.shippingLocker;

  if (!locker) {
    return { kind: 'hidden' };
  }

  return {
    detail: `Locker ID ${locker.locker_id} · Greece-only BOX NOW`,
    kind: 'selected',
    label: locker.locker_name_or_label,
  };
}
