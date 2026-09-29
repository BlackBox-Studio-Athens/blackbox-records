export type CheckoutShippingGateView = {
  badgeLabel: string;
  canContinueToPayment: boolean;
  detail: string;
  title: string;
  tone: 'blocked' | 'empty' | 'ready';
};

const CHECKOUT_SHIPPING_COPY = {
  readyBadge: 'Greece only',
  readyDetail: 'Stripe collects the shipping address. The label arranges BOX NOW after payment.',
  stepTitle: 'Delivery details',
} as const;

export function createCheckoutShippingGateView(checkoutClientMode: string | undefined): CheckoutShippingGateView {
  void checkoutClientMode;

  return {
    badgeLabel: CHECKOUT_SHIPPING_COPY.readyBadge,
    canContinueToPayment: true,
    detail: CHECKOUT_SHIPPING_COPY.readyDetail,
    title: CHECKOUT_SHIPPING_COPY.stepTitle,
    tone: 'ready',
  };
}
