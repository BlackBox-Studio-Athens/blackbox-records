import type { CheckoutOrderRecord, OrderStateRepository, OrderStatus } from '../../../domain/commerce/repositories';

export type ReadRecentCheckoutOrdersQuery = {
  limit: number;
  status?: OrderStatus | null;
};

export function readRecentCheckoutOrders(
  orders: OrderStateRepository,
  query: ReadRecentCheckoutOrdersQuery,
): Promise<CheckoutOrderRecord[]> {
  return orders.listRecent({
    limit: query.limit,
    status: query.status ?? null,
  });
}
