import type { StoreItemSlug, VariantId } from '../ids';
import type { ItemAvailabilityRecord } from './item-availability-repository';
import type { StockRecord } from './stock-repository';

export type AvailabilityAlertRequest = {
  variantId: VariantId;
  /** Already normalized: trimmed and lower-cased. */
  email: string;
  consentCopyVersion: string;
  consentedAt: Date;
};

export type ClaimedAvailabilityAlert = {
  id: string;
  variantId: VariantId;
  email: string;
  attemptCount: number;
  leaseUntil: Date;
  createdAt: Date;
};

/** A claimed alert with the current Store Item facts its email needs. */
export type AvailabilityAlertDelivery = {
  alert: ClaimedAvailabilityAlert;
  /** Null only when the Store Item disappeared after the claim. */
  storeItemSlug: StoreItemSlug | null;
  /** The Store Item's physical format, such as Vinyl. */
  itemFormat: string | null;
  availability: Pick<ItemAvailabilityRecord, 'status' | 'canBuy'> | null;
  /** Stock with onlineQuantity already reduced by pending checkout holds. */
  stock: Pick<StockRecord, 'onlineQuantity' | 'zeroStockState' | 'preorder'> | null;
};

export interface AvailabilityAlertRepository {
  /** Inserts or keeps one alert per variant and address; refuses a new address once the variant is at its cap. */
  request(input: AvailabilityAlertRequest, pendingCap: number): Promise<'accepted' | 'cap_reached'>;
  /** Shoppers still waiting for the variant, including an alert being sent. */
  countWaiting(variantId: VariantId): Promise<number>;
  /** Deletes alerts requested before the cutoff and alerts whose final lease lapsed; returns how many. */
  deleteExpired(input: { now: Date; requestedBefore: Date }): Promise<number>;
  /** Counts one send against the Athens day, or returns false once the budget is spent. */
  reserveSend(day: string, budget: number): Promise<boolean>;
  /** Leases the oldest alert whose variant can be bought now. */
  claimDue(input: { claimedAt: Date; leaseUntil: Date }): Promise<AvailabilityAlertDelivery | null>;
  /** Returns a leased alert to pending; refundAttempt undoes the claim's attempt when nothing was sent. */
  reschedule(input: {
    alert: ClaimedAvailabilityAlert;
    nextAttemptAt: Date;
    updatedAt: Date;
    refundAttempt: boolean;
  }): Promise<boolean>;
  /** Deletes a leased alert after delivery or its final failure. */
  delete(alert: ClaimedAvailabilityAlert): Promise<boolean>;
}
