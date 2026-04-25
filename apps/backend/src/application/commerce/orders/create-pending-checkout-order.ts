import type {
  CheckoutOrderRecord,
  OrderStateRepository,
  StoreItemSlug,
  VariantId,
} from '../../../domain/commerce/repositories';

export type CreatePendingCheckoutOrderCommand = {
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  checkoutSessionId: string;
  stripePaymentIntentId?: string | null;
  createdAt?: Date;
};

export function createPendingCheckoutOrder(
  orders: OrderStateRepository,
  command: CreatePendingCheckoutOrderCommand,
): Promise<CheckoutOrderRecord> {
  return orders.createPending(command);
}
