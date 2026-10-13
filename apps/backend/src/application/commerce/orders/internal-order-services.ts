import { readCheckoutOrder, isAwaitingStock } from './read-checkout-order';
import { readRecentCheckoutOrders, type ReadRecentCheckoutOrdersQuery } from './read-recent-checkout-orders';
import type { PaidOrderDeliverySummary } from './paid-order-delivery';
import type { CheckoutOrderRecord } from '../../../domain/commerce/repositories/spi';
import type { AppBindings } from '../../../platform/env';
import { D1PaidOrderDeliveryRepository } from '../../../infrastructure/persistence/d1-paid-order-delivery-repository';
import {
  createPrismaClient,
  PrismaOrderStateRepository,
  PrismaStockRepository,
} from '../../../infrastructure/persistence/prisma';

export type InternalOrderRead = {
  awaitingStock: boolean;
  deliveries: PaidOrderDeliverySummary[];
  order: CheckoutOrderRecord;
};

export function createInternalOrderServices(bindings: AppBindings) {
  const prisma = createPrismaClient(bindings);
  const orders = new PrismaOrderStateRepository(prisma);
  const stock = new PrismaStockRepository(prisma);
  const deliveries = new D1PaidOrderDeliveryRepository(bindings.COMMERCE_DB);

  return {
    disconnect: async () => prisma.$disconnect(),
    readStoreFigures: (start: Date, end: Date) => orders.readStoreFigures(start, end),
    readCheckoutOrder: async (checkoutSessionId: string): Promise<InternalOrderRead | null> => {
      const order = await readCheckoutOrder(orders, checkoutSessionId);
      if (!order) return null;

      return {
        awaitingStock: isAwaitingStock(order, await stock.listOpenPreorders()),
        deliveries: await deliveries.listSummaries([order.id]),
        order,
      };
    },
    readRecentCheckoutOrders: async (query: ReadRecentCheckoutOrdersQuery): Promise<InternalOrderRead[]> => {
      const recentOrders = await readRecentCheckoutOrders(orders, query);
      const deliverySummaries = await deliveries.listSummaries(recentOrders.map(({ id }) => id));
      const openPreorders = recentOrders.length ? await stock.listOpenPreorders() : [];

      return recentOrders.map((order) => ({
        awaitingStock: isAwaitingStock(order, openPreorders),
        deliveries: deliverySummaries.filter((delivery) => delivery.orderId === order.id),
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
