import { sendAvailabilityAlertEmail, type EmailProviderGateway, type EmailRuntimeConfig } from '../../email';
import type { AvailabilityAlertRepository, ClaimedAvailabilityAlert } from '../../../domain/commerce/repositories/spi';
import {
  athensToday,
  AVAILABILITY_ALERT_DAILY_BUDGET,
  AVAILABILITY_ALERT_LEASE_MS,
  availabilityAlertExpiryCutoff,
  availabilityAlertRetryAt,
  deriveShopperPreorder,
  isAvailabilityAlertDue,
} from '../../../domain/commerce';

export type AvailabilityAlertDrainSummary = {
  budgetExhausted: boolean;
  deliveredCount: number;
  droppedCount: number;
  expiredCount: number;
  leaseLostCount: number;
  rescheduledCount: number;
  /** Due alerts held back because the accepted publication does not name their Store Item yet. */
  unnamedCount: number;
};

/** The shopper-facing title and artist of a published Store Item, or null when it is not published. */
export type StoreItemNameReader = (storeItemSlug: string) => Promise<{ title: string; artist: string | null } | null>;

type Logger = { info(record: Record<string, unknown>): void; warn(record: Record<string, unknown>): void };

/**
 * Sends due Notify me alerts after order email, within the per-run limit and the Athens-day budget.
 * Logs carry counts and provider-safe reasons only: never an address or alert identifier.
 */
export async function drainDueAvailabilityAlerts(input: {
  attemptedAt: Date;
  config: EmailRuntimeConfig;
  /** Absent where the Worker cannot read accepted publications; alerts then wait. */
  itemNames?: StoreItemNameReader;
  limit: number;
  logger: Logger;
  provider: EmailProviderGateway;
  repository: AvailabilityAlertRepository;
}): Promise<AvailabilityAlertDrainSummary> {
  const { attemptedAt, repository } = input;
  const today = athensToday(attemptedAt);
  const summary: AvailabilityAlertDrainSummary = {
    budgetExhausted: false,
    deliveredCount: 0,
    droppedCount: 0,
    expiredCount: await repository.deleteExpired({
      now: attemptedAt,
      requestedBefore: availabilityAlertExpiryCutoff(attemptedAt),
    }),
    leaseLostCount: 0,
    rescheduledCount: 0,
    unnamedCount: 0,
  };
  // Nothing was sent: undo the claim's attempt. The alert keeps its place, which follows the request time.
  const release = (alert: ClaimedAvailabilityAlert, nextAttemptAt: Date) =>
    repository.reschedule({ alert, nextAttemptAt, updatedAt: attemptedAt, refundAttempt: true });

  for (let processed = 0; processed < input.limit; processed += 1) {
    const delivery = await repository.claimDue({
      claimedAt: attemptedAt,
      leaseUntil: new Date(attemptedAt.getTime() + AVAILABILITY_ALERT_LEASE_MS),
    });
    if (!delivery) break;
    const { alert, stock } = delivery;
    // The claim filtered on the same rule; re-check the facts read with it before spending budget.
    const later = new Date(attemptedAt.getTime() + AVAILABILITY_ALERT_LEASE_MS);
    if (!delivery.storeItemSlug || !isAvailabilityAlertDue(delivery.availability, stock)) {
      await release(alert, later);
      continue;
    }
    // Shopper copy names the item from accepted published content, never from the provider product name.
    const name = await input.itemNames?.(delivery.storeItemSlug).catch(() => null);
    if (!name) {
      await release(alert, later);
      summary.unnamedCount += 1;
      input.logger.warn({ event: 'availability_alert_item_unnamed', storeItemSlug: delivery.storeItemSlug });
      continue;
    }
    if (!(await repository.reserveSend(today, AVAILABILITY_ALERT_DAILY_BUDGET))) {
      await release(alert, attemptedAt);
      summary.budgetExhausted = true;
      break;
    }

    const preorder = deriveShopperPreorder(stock?.preorder ?? null, today);
    let sent = false;
    let retryable = true;
    let safeReason = 'provider_outcome_unknown';
    try {
      const attempt = await sendAvailabilityAlertEmail({
        config: input.config,
        provider: input.provider,
        shopperEmail: alert.email,
        idempotencyEntityId: alert.id,
        title: name.title,
        artist: name.artist,
        format: delivery.itemFormat,
        storeItemSlug: delivery.storeItemSlug,
        preorder: preorder ? { shipEstimate: preorder.shipEstimate } : null,
      });
      sent = attempt.status === 'sent';
      retryable = attempt.retryable;
      safeReason = attempt.providerSafeReason ?? 'unknown';
    } catch {
      // An unknown outcome retries under the same idempotency key, so a delivered email is not repeated.
    }

    if (sent) {
      if (await repository.delete(alert)) summary.deliveredCount += 1;
      else summary.leaseLostCount += 1;
      continue;
    }
    const retryAt = retryable ? availabilityAlertRetryAt(alert.attemptCount, attemptedAt) : null;
    const updated = retryAt
      ? await repository.reschedule({ alert, nextAttemptAt: retryAt, updatedAt: attemptedAt, refundAttempt: false })
      : await repository.delete(alert);
    if (!updated) summary.leaseLostCount += 1;
    else if (retryAt) summary.rescheduledCount += 1;
    else summary.droppedCount += 1;
    input.logger.warn({
      attemptCount: alert.attemptCount,
      event: 'availability_alert_delivery_failed',
      outcome: retryAt ? 'rescheduled' : 'deleted',
      safeReason,
    });
  }

  if (summary.budgetExhausted) {
    input.logger.warn({
      budget: AVAILABILITY_ALERT_DAILY_BUDGET,
      day: today,
      event: 'availability_alert_budget_exhausted',
    });
  }
  return summary;
}
