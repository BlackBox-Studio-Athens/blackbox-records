import type { CheckoutOrderRecord, OrderStateRepository } from '../../../domain/commerce/repositories/spi';
import { parseCheckoutSessionId } from '../../../domain/commerce';

export function readCheckoutOrder(
  orders: OrderStateRepository,
  checkoutSessionId: unknown,
): Promise<CheckoutOrderRecord | null> {
  return orders.findByCheckoutSessionId(parseCheckoutSessionId(checkoutSessionId));
}
