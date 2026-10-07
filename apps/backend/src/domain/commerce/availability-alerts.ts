import type { ItemAvailabilityRecord } from './repositories/item-availability-repository';
import type { StockRecord } from './repositories/stock-repository';
import { classifyStoreStockAvailability, type StoreStockAvailability } from './stock-availability';

/** Alert emails per Europe/Athens day; leaves room for order email on the shared provider quota. */
export const AVAILABILITY_ALERT_DAILY_BUDGET = 40;
/** Pending alerts one variant may hold; bounds abuse without Turnstile. */
export const AVAILABILITY_ALERT_PENDING_CAP = 2_000;
export const AVAILABILITY_ALERT_MAX_ATTEMPTS = 5;
export const AVAILABILITY_ALERT_LEASE_MS = 10 * 60 * 1000;
export const AVAILABILITY_ALERT_RETENTION_MONTHS = 12;

export const AVAILABILITY_ALERT_CONSENT_COPY = 'Email me once when this can be bought or pre-ordered.';
export const AVAILABILITY_ALERT_CONSENT_COPY_VERSION = 'blackbox-availability-alert-v1';

// Delay before attempt 2, 3, 4 and 5.
const retryDelaysMs = [15 * 60 * 1000, 60 * 60 * 1000, 6 * 60 * 60 * 1000, 24 * 60 * 60 * 1000];

/** Shoppers may ask to be told only while the variant reads Coming Soon or Repressing. */
export function isAvailabilityAlertEligible(state: StoreStockAvailability): boolean {
  return state === 'coming_soon' || state === 'repressing';
}

/** An alert is due once its variant can be bought, as an ordinary item or an open stocked pre-order. */
export function isAvailabilityAlertDue(
  availability: Pick<ItemAvailabilityRecord, 'status' | 'canBuy'> | null,
  stock: Pick<StockRecord, 'onlineQuantity' | 'zeroStockState'> | null,
): boolean {
  return classifyStoreStockAvailability(availability, stock) === 'stocked';
}

export function normalizeAvailabilityAlertEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Alerts requested before this instant have expired. */
export function availabilityAlertExpiryCutoff(now: Date): Date {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - AVAILABILITY_ALERT_RETENTION_MONTHS);
  return cutoff;
}

/** When a failed attempt is retried, or null once the attempts are spent. */
export function availabilityAlertRetryAt(attemptCount: number, failedAt: Date): Date | null {
  const delay = retryDelaysMs[attemptCount - 1];
  return attemptCount >= AVAILABILITY_ALERT_MAX_ATTEMPTS || delay === undefined
    ? null
    : new Date(failedAt.getTime() + delay);
}
