export type CheckoutShippingGateView = {
  badgeLabel: string;
  canContinueToPayment: boolean;
  detail: string;
  fulfillmentDetail: string;
  shippingDetail: string;
  title: string;
  tone: 'blocked' | 'empty' | 'ready';
};

export const CHECKOUT_SHIPPING_COPY = {
  fulfillmentDetail: 'The label creates the BOX NOW shipment manually after the Stripe payment is confirmed.',
  readyBadge: 'Manual BOX NOW',
  readyDetail: 'Stripe collects the Greek shipping address and contact details before payment.',
  shippingDetail: 'Greece only',
  stepSupport: 'Available for Greece orders only',
  stepTitle: 'Shipping Collected In Checkout',
} as const;

export function createCheckoutShippingGateView(checkoutClientMode: string | undefined): CheckoutShippingGateView {
  void checkoutClientMode;

  return {
    badgeLabel: CHECKOUT_SHIPPING_COPY.readyBadge,
    canContinueToPayment: true,
    detail: CHECKOUT_SHIPPING_COPY.readyDetail,
    fulfillmentDetail: CHECKOUT_SHIPPING_COPY.fulfillmentDetail,
    shippingDetail: CHECKOUT_SHIPPING_COPY.shippingDetail,
    title: CHECKOUT_SHIPPING_COPY.stepTitle,
    tone: 'ready',
  };
}
