import { drainDuePaidOrderDeliveries, type ProcessPaidOrderDeliveryResult } from '../../application/commerce/orders';
import type { AppBindings } from '../../env';
import { createBindingLogger, normalizeUnknownError } from '../../observability';
import { D1PaidOrderDeliveryRepository } from '../../infrastructure/persistence/d1-paid-order-delivery-repository';
import { createPrismaClient, PrismaOrderStateRepository } from '../../infrastructure/persistence/prisma';
import { createEmailRuntimeServices } from '../../infrastructure/resend';

export async function runPaidOrderDeliverySchedule(
  bindings: AppBindings,
  scheduledAt: Date,
): Promise<ProcessPaidOrderDeliveryResult[]> {
  const logger = createBindingLogger(bindings);
  const prisma = createPrismaClient(bindings);

  try {
    const emailRuntime = createEmailRuntimeServices(bindings);
    const results = await drainDuePaidOrderDeliveries({
      attemptedAt: scheduledAt,
      config: emailRuntime.config,
      logger,
      orders: new PrismaOrderStateRepository(prisma),
      provider: emailRuntime.provider,
      repository: new D1PaidOrderDeliveryRepository(bindings.COMMERCE_DB),
    });

    logger.info({
      deliveredCount: countResults(results, 'delivered'),
      event: 'paid_order_delivery_schedule_outcome',
      leaseLostCount: countResults(results, 'lease_lost'),
      needsReviewCount: countResults(results, 'needs_review'),
      processedCount: results.length,
      rescheduledCount: countResults(results, 'rescheduled'),
      status: 'completed',
    });

    return results;
  } catch (error) {
    logger.error({
      ...normalizeUnknownError(error),
      event: 'paid_order_delivery_schedule_outcome',
      status: 'failed',
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function countResults(results: ProcessPaidOrderDeliveryResult[], kind: ProcessPaidOrderDeliveryResult['kind']): number {
  return results.filter((result) => result.kind === kind).length;
}
