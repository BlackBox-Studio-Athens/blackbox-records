import type { ShippingLockerSnapshot } from '../../../domain/commerce/repositories/spi';
import type {
  CartQuantity,
  CheckoutSessionId,
  PaymentIntentId,
  StoreItemSlug,
  StripePriceId,
  VariantId,
} from '../../../domain/commerce';
import type { OrderStatus } from '../../../domain/commerce/repositories/spi';
import type { StoreOfferPrice } from '../catalog-sync';

export type StoreOfferCatalogStatus = 'catalog_drift' | 'ready' | 'sold_out';

type StoreOfferIdentity = {
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
};

export type StoreOffer = StoreOfferIdentity &
  (
    | {
        availability: { label: string; status: 'available' };
        canCheckout: true;
        catalogStatus: 'ready';
        price: StoreOfferPrice;
      }
    | {
        availability: { label: string; status: 'sold_out' };
        canCheckout: false;
        catalogStatus: 'sold_out';
        price: null;
      }
    | {
        availability: { label: string; status: 'unavailable' };
        canCheckout: false;
        catalogStatus: 'catalog_drift';
        price: null;
      }
  );

export type StoreOfferAvailability = StoreOffer['availability'];

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
  orderStatus: OrderStatus | null;
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
