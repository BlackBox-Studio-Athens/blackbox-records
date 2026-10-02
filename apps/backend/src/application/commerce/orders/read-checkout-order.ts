import type { CheckoutOrderRecord, OrderStateRepository, StockRecord } from '../../../domain/commerce/repositories/spi';
import { parseCheckoutSessionId } from '../../../domain/commerce';

export function readCheckoutOrder(
  orders: OrderStateRepository,
  checkoutSessionId: unknown,
): Promise<CheckoutOrderRecord | null> {
  return orders.findByCheckoutSessionId(parseCheckoutSessionId(checkoutSessionId));
}

export function isAwaitingStock(order: CheckoutOrderRecord, openPreorders: StockRecord[]): boolean {
  return (
    order.status === 'paid' &&
    (order.lines?.some(
      (line) =>
        line.preorder &&
        openPreorders.some(
          (stock) => stock.variantId === line.variantId && stock.preorder?.startedAt === line.preorder!.startedAt,
        ),
    ) ??
      false)
  );
}
