import type { ShippingLockerSnapshot } from '../../../domain/commerce/repositories/spi';
import type {
  CartQuantity,
  CheckoutSessionId,
  PaymentIntentId,
  StoreItemSlug,
  StripePriceId,
  VariantId,
} from '../../../domain/commerce';

export type StoreOfferAvailability = {
  status: 'available' | 'sold_out';
  label: string;
};

export type StoreOfferCatalogStatus = 'catalog_drift' | 'ready' | 'sold_out';

export type StoreOfferPrice = {
  amountMinor: number;
  currencyCode: string;
  display: string;
};

export type StoreOffer = {
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  availability: StoreOfferAvailability;
  canCheckout: boolean;
  catalogStatus: StoreOfferCatalogStatus;
  price: StoreOfferPrice | null;
};

export type HostedCheckoutSessionRequest = {
  cancelUrl: string;
  lineItems?: CheckoutSessionLineItem[];
  newsletterOptIn?: boolean;
  successUrl: string;
  storeItemSlug?: StoreItemSlug;
  stripePriceId?: StripePriceId;
  variantId?: VariantId;
};

export type CheckoutSessionLineItem = {
  quantity: CartQuantity;
  storeItemSlug: StoreItemSlug;
  stripePriceId: StripePriceId;
  variantId: VariantId;
};

export type FinalizedCheckoutSessionLineItem = {
  quantity: CartQuantity;
  stripePriceId: StripePriceId;
};

export type HostedCheckoutSession = {
  checkoutSessionId: CheckoutSessionId;
  checkoutUrl: string;
};

export type StripeCheckoutSessionStatus = 'open' | 'complete' | 'expired' | null;

export type StripeCheckoutPaymentStatus = 'paid' | 'unpaid' | 'no_payment_required';

export type StripeCheckoutCustomerSnapshot = {
  email: string | null;
  name: string | null;
  phone: string | null;
};

export type StripeCheckoutAddressSnapshot = {
  city: string | null;
  country: string | null;
  line1: string | null;
  line2: string | null;
  postalCode: string | null;
  state: string | null;
};

export type StripeCheckoutSessionState = {
  amountTotalMinor: number | null;
  checkoutSessionId: CheckoutSessionId;
  currencyCode: string | null;
  customer: StripeCheckoutCustomerSnapshot;
  newsletterOptIn: boolean;
  paymentStatus: StripeCheckoutPaymentStatus;
  shippingAddress: StripeCheckoutAddressSnapshot | null;
  stripePaymentIntentId?: PaymentIntentId | null;
  status: StripeCheckoutSessionStatus;
};

export type CheckoutState = {
  checkoutSessionId: CheckoutSessionId;
  paymentStatus: StripeCheckoutPaymentStatus;
  shippingLocker: ShippingLockerSnapshot | null;
  state: 'open' | 'paid' | 'processing' | 'expired' | 'unknown';
  status: StripeCheckoutSessionStatus;
};

export interface CheckoutGateway {
  createHostedCheckoutSession(request: HostedCheckoutSessionRequest): Promise<HostedCheckoutSession>;
  readCheckoutSessionLineItems(checkoutSessionId: CheckoutSessionId): Promise<FinalizedCheckoutSessionLineItem[]>;
  readCheckoutSession(checkoutSessionId: CheckoutSessionId): Promise<StripeCheckoutSessionState>;
}
