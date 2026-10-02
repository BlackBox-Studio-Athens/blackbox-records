import {
  readCheckoutOrder,
  readRecentCheckoutOrders,
  type PaidOrderDeliverySummary,
  type ReadRecentCheckoutOrdersQuery,
} from './';
import type { CheckoutOrderRecord } from '../../../domain/commerce/repositories/spi';
import type { AppBindings } from '../../../platform/env';
import { D1PaidOrderDeliveryRepository } from '../../../infrastructure/persistence/d1-paid-order-delivery-repository';
import {
  createPrismaClient,
  PrismaOrderStateRepository,
  PrismaStockRepository,
} from '../../../infrastructure/persistence/prisma';
import { isAwaitingStock } from './read-checkout-order';

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
