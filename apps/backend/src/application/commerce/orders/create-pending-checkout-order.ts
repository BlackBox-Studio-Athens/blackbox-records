import type {
  CheckoutOrderRecord,
  OrderStateRepository,
  ShippingLockerSnapshot,
} from '../../../domain/commerce/repositories/spi';
import type {
  CartQuantity,
  CheckoutSessionId,
  PaymentIntentId,
  StoreItemSlug,
  StripePriceId,
  VariantId,
} from '../../../domain/commerce';

export type CreatePendingCheckoutOrderCommand = {
  lines?: CreatePendingCheckoutOrderLineCommand[];
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  checkoutSessionId: CheckoutSessionId;
  shippingLocker: ShippingLockerSnapshot | null;
  stripePaymentIntentId?: PaymentIntentId | null;
  createdAt?: Date;
};

export type CreatePendingCheckoutOrderLineCommand = {
  quantity: CartQuantity;
  stripePriceId?: StripePriceId | null;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
};

export function createPendingCheckoutOrder(
  orders: OrderStateRepository,
  command: CreatePendingCheckoutOrderCommand,
): Promise<CheckoutOrderRecord> {
  return orders.createPending(command);
}
