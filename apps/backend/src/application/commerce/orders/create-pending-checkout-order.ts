import type {
  CheckoutOrderRecord,
  OrderStateRepository,
  ShippingLockerSnapshot,
  StoreItemSlug,
  VariantId,
} from '../../../domain/commerce/repositories';

export type CreatePendingCheckoutOrderCommand = {
  lines?: CreatePendingCheckoutOrderLineCommand[];
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  checkoutSessionId: string;
  shippingLocker: ShippingLockerSnapshot;
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
