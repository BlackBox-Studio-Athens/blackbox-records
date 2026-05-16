import type {
  CheckoutOrderRecord,
  OrderStateRepository,
  ShippingLockerSnapshot,
} from '../../../domain/commerce/repositories/spi';
import type { StoreItemSlug, VariantId } from '../../../domain/commerce';

export type CreatePendingCheckoutOrderCommand = {
  lines?: CreatePendingCheckoutOrderLineCommand[];
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  checkoutSessionId: string;
  shippingLocker: ShippingLockerSnapshot | null;
  stripePaymentIntentId?: string | null;
  createdAt?: Date;
};

export type CreatePendingCheckoutOrderLineCommand = {
  quantity: number;
  stripePriceId?: string | null;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
};

export function createPendingCheckoutOrder(
  orders: OrderStateRepository,
  command: CreatePendingCheckoutOrderCommand,
): Promise<CheckoutOrderRecord> {
  return orders.createPending(command);
}
