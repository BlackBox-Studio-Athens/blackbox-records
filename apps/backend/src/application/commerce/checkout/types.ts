import type { ShippingLockerSnapshot } from '../../../domain/commerce/repositories/spi';
import type { StoreItemSlug, StripePriceId, VariantId } from '../../../domain/commerce';

export type StoreOfferAvailability = {
  status: 'available' | 'sold_out';
  label: string;
};

export type StoreOffer = {
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  availability: StoreOfferAvailability;
  canCheckout: boolean;
};

export type EmbeddedCheckoutSessionRequest = {
  lineItems?: EmbeddedCheckoutSessionLineItem[];
  returnUrl: string;
  storeItemSlug?: StoreItemSlug;
  stripePriceId?: StripePriceId;
  variantId?: VariantId;
};

export type EmbeddedCheckoutSessionLineItem = {
  adjustableQuantityMaximum?: number;
  quantity: number;
  storeItemSlug: StoreItemSlug;
  stripePriceId: StripePriceId;
  variantId: VariantId;
};

export type FinalizedCheckoutSessionLineItem = {
  quantity: number;
  stripePriceId: StripePriceId;
};

export type EmbeddedCheckoutSession = {
  checkoutSessionId: string;
  clientSecret: string;
};

export type StripeCheckoutSessionStatus = 'open' | 'complete' | 'expired' | null;

export type StripeCheckoutPaymentStatus = 'paid' | 'unpaid' | 'no_payment_required';

export type StripeCheckoutSessionState = {
  checkoutSessionId: string;
  paymentStatus: StripeCheckoutPaymentStatus;
  stripePaymentIntentId?: string | null;
  status: StripeCheckoutSessionStatus;
};

export type CheckoutState = {
  checkoutSessionId: string;
  paymentStatus: StripeCheckoutPaymentStatus;
  shippingLocker: ShippingLockerSnapshot | null;
  state: 'open' | 'paid' | 'processing' | 'expired' | 'unknown';
  status: StripeCheckoutSessionStatus;
};

export interface CheckoutGateway {
  createEmbeddedCheckoutSession(request: EmbeddedCheckoutSessionRequest): Promise<EmbeddedCheckoutSession>;
  readCheckoutSessionLineItems(checkoutSessionId: string): Promise<FinalizedCheckoutSessionLineItem[]>;
  readCheckoutSession(checkoutSessionId: string): Promise<StripeCheckoutSessionState>;
}
