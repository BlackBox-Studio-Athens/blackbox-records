import {
  drainDueAvailabilityAlerts,
  drainDuePaidOrderDeliveries,
  drainDuePreorderEstimateNotices,
  SCHEDULED_DELIVERY_LIMIT,
  type ProcessPaidOrderDeliveryResult,
  type StoreItemNameReader,
} from './';
import { createFeatureFlagReader, parseBooleanOverride } from '../checkout/feature-flags';
import type { AppBindings } from '../../../platform/env';
import { createBindingLogger, normalizeUnknownError } from '../../../platform/observability';
import { D1AvailabilityAlertRepository } from '../../../infrastructure/persistence/d1-availability-alert-repository';
import { D1PaidOrderDeliveryRepository } from '../../../infrastructure/persistence/d1-paid-order-delivery-repository';
import { D1OrderWithdrawalRepository } from '../../../infrastructure/persistence/d1-order-withdrawal-repository';
import { drainWithdrawalDeliveries } from './order-withdrawal';
import { D1PreorderEstimateDeliveryRepository } from '../../../infrastructure/persistence/d1-preorder-estimate-delivery-repository';
import { createPrismaClient, PrismaOrderStateRepository } from '../../../infrastructure/persistence/prisma';
import { createEmailRuntimeServices } from '../../../infrastructure/resend';

export async function runPaidOrderDeliverySchedule(
  bindings: AppBindings,
  scheduledAt: Date,
  options: { itemNames?: StoreItemNameReader } = {},
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

    event = 'withdrawal_delivery_schedule_outcome';
    const withdrawals = await drainWithdrawalDeliveries({
      ...emailRuntime,
      repository: new D1OrderWithdrawalRepository(bindings.COMMERCE_DB),
      now: scheduledAt,
      limit: Math.max(0, SCHEDULED_DELIVERY_LIMIT - results.length - notices.length),
      logger,
    });
    logger.info({ event, processedCount: withdrawals, status: 'completed' });

    // Alerts run last and only in the rows order email left, so they never delay it.
    event = 'availability_alert_schedule_outcome';
    const availabilityAlertsEnabled =
      emailRuntime.config.productEnvironmentProfile.productEnvironment !== 'PRD' ||
      (parseBooleanOverride(bindings.PRD_AVAILABILITY_ALERTS_APPROVED) === true &&
        (await createFeatureFlagReader(bindings, logger).isNativeCheckoutEnabled()));
    const alerts = await drainDueAvailabilityAlerts({
      attemptedAt: scheduledAt,
      config: emailRuntime.config,
      ...(options.itemNames ? { itemNames: options.itemNames } : {}),
      // A zero limit still expires old requests without claiming alerts or consuming send budget.
      limit: availabilityAlertsEnabled ? SCHEDULED_DELIVERY_LIMIT - results.length - notices.length - withdrawals : 0,
      logger,
      provider: emailRuntime.provider,
      repository: new D1AvailabilityAlertRepository(bindings.COMMERCE_DB),
    });
    logger.info({ ...alerts, event, status: 'completed' });

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
