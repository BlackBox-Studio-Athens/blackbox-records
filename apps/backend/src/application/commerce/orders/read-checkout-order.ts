import type { CheckoutOrderRecord, OrderStateRepository } from '../../../domain/commerce/repositories/spi';

export function readCheckoutOrder(
  orders: OrderStateRepository,
  checkoutSessionId: string,
): Promise<CheckoutOrderRecord | null> {
  return orders.findByCheckoutSessionId(checkoutSessionId);
}
