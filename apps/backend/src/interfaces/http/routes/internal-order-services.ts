import { readCheckoutOrder, readRecentCheckoutOrders } from '../../../application/commerce/orders';
import type { OrderStatus } from '../../../domain/commerce/repositories';
import type { AppBindings } from '../../../env';
import { createPrismaClient, PrismaOrderStateRepository } from '../../../infrastructure/persistence/prisma';

export function createInternalOrderServices(bindings: AppBindings) {
  const prisma = createPrismaClient(bindings);
  const orders = new PrismaOrderStateRepository(prisma);

  return {
    disconnect: async () => prisma.$disconnect(),
    readCheckoutOrder: async (checkoutSessionId: string) => readCheckoutOrder(orders, checkoutSessionId),
    readRecentCheckoutOrders: async (query: { limit: number; status?: OrderStatus | null }) =>
      readRecentCheckoutOrders(orders, query),
  };
}
