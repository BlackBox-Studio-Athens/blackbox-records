import {
  readCheckoutOrder,
  readRecentCheckoutOrders,
  type PaidOrderDeliverySummary,
} from '../../../application/commerce/orders';
import type { CheckoutOrderRecord, OrderStatus } from '../../../domain/commerce/repositories/spi';
import type { AppBindings } from '../../../env';
import { D1PaidOrderDeliveryRepository } from '../../../infrastructure/persistence/d1-paid-order-delivery-repository';
import { createPrismaClient, PrismaOrderStateRepository } from '../../../infrastructure/persistence/prisma';

export type InternalOrderRead = {
  deliveries: PaidOrderDeliverySummary[];
  order: CheckoutOrderRecord;
};

export function createInternalOrderServices(bindings: AppBindings) {
  const prisma = createPrismaClient(bindings);
  const orders = new PrismaOrderStateRepository(prisma);
  const deliveries = new D1PaidOrderDeliveryRepository(bindings.COMMERCE_DB);

  return {
    disconnect: async () => prisma.$disconnect(),
    readCheckoutOrder: async (checkoutSessionId: string): Promise<InternalOrderRead | null> => {
      const order = await readCheckoutOrder(orders, checkoutSessionId);
      if (!order) return null;

      return {
        deliveries: await deliveries.listSummaries([order.id]),
        order,
      };
    },
    readRecentCheckoutOrders: async (query: {
      limit: number;
      status?: OrderStatus | null;
    }): Promise<InternalOrderRead[]> => {
      const recentOrders = await readRecentCheckoutOrders(orders, query);
      const deliverySummaries = await deliveries.listSummaries(recentOrders.map(({ id }) => id));

      return recentOrders.map((order) => ({
        deliveries: deliverySummaries.filter((delivery) => delivery.orderId === order.id),
        order,
      }));
    },
  };
}
