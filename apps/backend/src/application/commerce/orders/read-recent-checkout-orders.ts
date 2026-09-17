import type { CheckoutOrderRecord, OrderStateRepository, OrderStatus } from '../../../domain/commerce/repositories/spi';

export type ReadRecentCheckoutOrdersQuery = {
  limit: number;
  status?: OrderStatus | null;
  q?: string;
  cursor?: { createdAt: Date; id: string };
  notification?: 'pending' | 'needs_review';
};

export function readRecentCheckoutOrders(
  orders: OrderStateRepository,
  query: ReadRecentCheckoutOrdersQuery,
): Promise<CheckoutOrderRecord[]> {
  return orders.listRecent({
    ...query,
    limit: query.limit,
    status: query.status ?? null,
  });
}
