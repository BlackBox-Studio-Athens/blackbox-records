import { readCheckoutOrder, isAwaitingStock } from './read-checkout-order';
import { readRecentCheckoutOrders, type ReadRecentCheckoutOrdersQuery } from './read-recent-checkout-orders';
import type { PaidOrderDeliverySummary } from './paid-order-delivery';
import {
  readPaidCheckoutFulfillment,
  type CheckoutOrderRecord,
  type OrderDispatch,
} from '../../../domain/commerce/repositories/spi';
import type { AppBindings } from '../../../platform/env';
import { D1OrderDispatchRepository } from '../../../infrastructure/persistence/d1-order-dispatch-repository';
import { D1PaidOrderDeliveryRepository } from '../../../infrastructure/persistence/d1-paid-order-delivery-repository';
import {
  createPrismaClient,
  PrismaOrderStateRepository,
  PrismaStockRepository,
} from '../../../infrastructure/persistence/prisma';

export type InternalOrderRead = {
  awaitingStock: boolean;
  deliveries: PaidOrderDeliverySummary[];
  dispatch: OrderDispatch | null;
  order: CheckoutOrderRecord;
};

export type SetOrderDispatchResult =
  { kind: 'updated'; read: InternalOrderRead } | { kind: 'not_found' | 'not_ready' | 'conflict' };

export function createInternalOrderServices(bindings: AppBindings) {
  const prisma = createPrismaClient(bindings);
  const orders = new PrismaOrderStateRepository(prisma);
  const stock = new PrismaStockRepository(prisma);
  const deliveries = new D1PaidOrderDeliveryRepository(bindings.COMMERCE_DB);
  const dispatches = new D1OrderDispatchRepository(bindings.COMMERCE_DB);

  const readCheckoutOrderWithFacts = async (checkoutSessionId: string): Promise<InternalOrderRead | null> => {
    const order = await readCheckoutOrder(orders, checkoutSessionId);
    if (!order) return null;

    return {
      awaitingStock: isAwaitingStock(order, await stock.listOpenPreorders()),
      deliveries: await deliveries.listSummaries([order.id]),
      dispatch: (await dispatches.listByOrderIds([order.id]))[0] ?? null,
      order,
    };
  };

  return {
    disconnect: async () => prisma.$disconnect(),
    readStoreFigures: (start: Date, end: Date) => orders.readStoreFigures(start, end),
    readCheckoutOrder: readCheckoutOrderWithFacts,
    setDispatch: async (
      checkoutSessionId: string,
      input: { shipped: boolean; expectedShipped: boolean; operatorEmail: string; at: Date },
    ): Promise<SetOrderDispatchResult> => {
      const current = await readCheckoutOrderWithFacts(checkoutSessionId);
      if (!current) return { kind: 'not_found' };
      // Only complete paid orders can be dispatched; undo stays available for the same orders.
      if (readPaidCheckoutFulfillment(current.order).kind !== 'current') return { kind: 'not_ready' };
      if ((await dispatches.set({ ...input, orderId: current.order.id })) === 'conflict') return { kind: 'conflict' };
      const read = await readCheckoutOrderWithFacts(checkoutSessionId);
      return read ? { kind: 'updated', read } : { kind: 'not_found' };
    },
    readRecentCheckoutOrders: async (query: ReadRecentCheckoutOrdersQuery): Promise<InternalOrderRead[]> => {
      const recentOrders = await readRecentCheckoutOrders(orders, query);
      const deliverySummaries = await deliveries.listSummaries(recentOrders.map(({ id }) => id));
      const dispatchRecords = await dispatches.listByOrderIds(recentOrders.map(({ id }) => id));
      const openPreorders = recentOrders.length ? await stock.listOpenPreorders() : [];

      return recentOrders.map((order) => ({
        awaitingStock: isAwaitingStock(order, openPreorders),
        deliveries: deliverySummaries.filter((delivery) => delivery.orderId === order.id),
        dispatch: dispatchRecords.find((dispatch) => dispatch.orderId === order.id) ?? null,
        order,
      }));
    },
  };
}

export async function readStoreStats(bindings: AppBindings, range: '7d' | '30d', now: Date) {
  const days = range === '7d' ? 7 : 30;
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - days + 1);
  const previousStart = new Date(start);
  previousStart.setUTCDate(previousStart.getUTCDate() - days);
  const services = createInternalOrderServices(bindings);
  try {
    const current = await services.readStoreFigures(start, now);
    const previous = await services.readStoreFigures(previousStart, start);
    return { range, generatedAt: now.toISOString(), currencyCode: 'EUR' as const, current, previous };
  } finally {
    await services.disconnect();
  }
}
