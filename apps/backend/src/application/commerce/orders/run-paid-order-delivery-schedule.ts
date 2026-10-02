import {
  drainDuePaidOrderDeliveries,
  drainDuePreorderEstimateNotices,
  SCHEDULED_DELIVERY_LIMIT,
  type ProcessPaidOrderDeliveryResult,
} from './';
import type { AppBindings } from '../../../platform/env';
import { createBindingLogger, normalizeUnknownError } from '../../../platform/observability';
import { D1PaidOrderDeliveryRepository } from '../../../infrastructure/persistence/d1-paid-order-delivery-repository';
import { D1PreorderEstimateDeliveryRepository } from '../../../infrastructure/persistence/d1-preorder-estimate-delivery-repository';
import { createPrismaClient, PrismaOrderStateRepository } from '../../../infrastructure/persistence/prisma';
import { createEmailRuntimeServices } from '../../../infrastructure/resend';

export async function runPaidOrderDeliverySchedule(
  bindings: AppBindings,
  scheduledAt: Date,
): Promise<ProcessPaidOrderDeliveryResult[]> {
  const logger = createBindingLogger(bindings);
  const prisma = createPrismaClient(bindings);
  let event = 'paid_order_delivery_schedule_outcome';

  try {
    const emailRuntime = createEmailRuntimeServices(bindings);
    const orders = new PrismaOrderStateRepository(prisma);
    const results = await drainDuePaidOrderDeliveries({
      attemptedAt: scheduledAt,
      config: emailRuntime.config,
      logger,
      orders,
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

    event = 'preorder_estimate_notice_schedule_outcome';
    const notices = await drainDuePreorderEstimateNotices({
      attemptedAt: scheduledAt,
      config: emailRuntime.config,
      limit: SCHEDULED_DELIVERY_LIMIT - results.length,
      orders,
      provider: emailRuntime.provider,
      repository: new D1PreorderEstimateDeliveryRepository(bindings.COMMERCE_DB),
    });
    logger.info({
      deliveredCount: countResults(notices, 'delivered'),
      event,
      leaseLostCount: countResults(notices, 'lease_lost'),
      needsReviewCount: countResults(notices, 'needs_review'),
      processedCount: notices.length,
      rescheduledCount: countResults(notices, 'rescheduled'),
      status: 'completed',
    });

    return results;
  } catch (error) {
    logger.error({
      ...normalizeUnknownError(error),
      event,
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
