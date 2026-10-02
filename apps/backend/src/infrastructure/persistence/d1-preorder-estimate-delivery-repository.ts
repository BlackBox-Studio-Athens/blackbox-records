import { parsePreorderShipEstimate } from '../../domain/commerce';
import type {
  ClaimedPreorderEstimateDelivery,
  ClaimDuePreorderEstimateDeliveryResult,
  PreorderEstimateDeliveryRecord,
  PreorderEstimateDeliveryRepository,
} from '../../domain/commerce/repositories/spi';

type DeliveryRow = Omit<
  PreorderEstimateDeliveryRecord,
  'shipEstimate' | 'nextAttemptAt' | 'leaseUntil' | 'deliveredAt' | 'needsReviewAt' | 'createdAt' | 'updatedAt'
> & {
  shipMonth: string | null;
  shipPart: string | null;
  shipDate: string | null;
  nextAttemptAt: string | null;
  leaseUntil: string | null;
  deliveredAt: string | null;
  needsReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const claimedLeaseWhereSql =
  'WHERE "id" = ? AND "sequence" = ? AND "status" = \'pending\' AND "attemptCount" = ? AND "leaseUntil" = ?';
const LEASE_MS = 10 * 60 * 1000;

export class D1PreorderEstimateDeliveryRepository implements PreorderEstimateDeliveryRepository {
  public constructor(private readonly db: D1Database) {}

  public async findById(deliveryId: string): Promise<PreorderEstimateDeliveryRecord | null> {
    const row = await this.db
      .prepare('SELECT * FROM "PreorderEstimateDelivery" WHERE "id" = ?')
      .bind(deliveryId)
      .first<DeliveryRow>();
    return row ? mapDelivery(row) : null;
  }

  public async claimDue(input: {
    claimedAt: Date;
    deliveryId: string | null;
  }): Promise<ClaimDuePreorderEstimateDeliveryResult> {
    const timestamp = input.claimedAt.toISOString();
    const leaseUntil = new Date(input.claimedAt.getTime() + LEASE_MS).toISOString();
    // Recover the current exhausted sequence atomically; never take a sixth provider lease.
    await this.db
      .prepare(
        `
      UPDATE "PreorderEstimateDelivery"
      SET "status" = 'needs_review', "nextAttemptAt" = NULL, "leaseUntil" = NULL,
          "safeReason" = 'provider_outcome_unknown', "needsReviewAt" = ?, "updatedAt" = ?
      WHERE "status" = 'pending' AND "attemptCount" = 5
        AND "nextAttemptAt" IS NOT NULL AND "nextAttemptAt" <= ?
        AND ("leaseUntil" IS NULL OR "leaseUntil" <= ?) AND (? IS NULL OR "id" = ?)`,
      )
      .bind(timestamp, timestamp, timestamp, timestamp, input.deliveryId, input.deliveryId)
      .run();
    const row = await this.db
      .prepare(
        `
      UPDATE "PreorderEstimateDelivery"
      SET "attemptCount" = "attemptCount" + 1, "leaseUntil" = ?, "updatedAt" = ?
      WHERE "id" = (
        SELECT "id" FROM "PreorderEstimateDelivery"
        WHERE "status" = 'pending' AND "nextAttemptAt" IS NOT NULL AND "nextAttemptAt" <= ?
          AND ("leaseUntil" IS NULL OR "leaseUntil" <= ?) AND "attemptCount" < 5
          AND (? IS NULL OR "id" = ?)
        ORDER BY "nextAttemptAt" ASC, "createdAt" ASC, "id" ASC LIMIT 1
      ) RETURNING *`,
      )
      .bind(leaseUntil, timestamp, timestamp, timestamp, input.deliveryId, input.deliveryId)
      .first<DeliveryRow>();
    if (!row) return { kind: 'not_claimed' };
    return {
      kind: 'claimed',
      delivery: {
        ...mapDelivery(row),
        status: 'pending',
        leaseUntil: new Date(leaseUntil),
        nextAttemptAt: new Date(row.nextAttemptAt!),
      },
    };
  }

  public async markDelivered(
    input: Parameters<PreorderEstimateDeliveryRepository['markDelivered']>[0],
  ): Promise<boolean> {
    const timestamp = input.deliveredAt.toISOString();
    const result = await this.db
      .prepare(
        `
      UPDATE "PreorderEstimateDelivery"
      SET "status" = 'delivered', "nextAttemptAt" = NULL, "leaseUntil" = NULL, "providerMessageId" = ?,
          "safeReason" = NULL, "deliveredAt" = ?, "needsReviewAt" = NULL, "updatedAt" = ?
      ${claimedLeaseWhereSql}`,
      )
      .bind(input.providerMessageId, timestamp, timestamp, ...leaseParameters(input.delivery))
      .run();
    return result.meta.changes === 1;
  }

  public async reschedule(input: Parameters<PreorderEstimateDeliveryRepository['reschedule']>[0]): Promise<boolean> {
    const result = await this.db
      .prepare(
        `
      UPDATE "PreorderEstimateDelivery"
      SET "nextAttemptAt" = ?, "leaseUntil" = NULL, "safeReason" = ?, "updatedAt" = ?
      ${claimedLeaseWhereSql}`,
      )
      .bind(
        input.nextAttemptAt.toISOString(),
        input.safeReason,
        input.updatedAt.toISOString(),
        ...leaseParameters(input.delivery),
      )
      .run();
    return result.meta.changes === 1;
  }

  public async markNeedsReview(
    input: Parameters<PreorderEstimateDeliveryRepository['markNeedsReview']>[0],
  ): Promise<boolean> {
    const timestamp = input.needsReviewAt.toISOString();
    const result = await this.db
      .prepare(
        `
      UPDATE "PreorderEstimateDelivery"
      SET "status" = 'needs_review', "nextAttemptAt" = NULL, "leaseUntil" = NULL, "safeReason" = ?,
          "deliveredAt" = NULL, "needsReviewAt" = ?, "updatedAt" = ?
      ${claimedLeaseWhereSql}`,
      )
      .bind(input.safeReason, timestamp, timestamp, ...leaseParameters(input.delivery))
      .run();
    return result.meta.changes === 1;
  }
}

function leaseParameters(delivery: ClaimedPreorderEstimateDelivery) {
  return [delivery.id, delivery.sequence, delivery.attemptCount, delivery.leaseUntil.toISOString()];
}

function mapDelivery(row: DeliveryRow): PreorderEstimateDeliveryRecord {
  const { shipMonth, shipPart, shipDate, ...delivery } = row;
  return {
    ...delivery,
    shipEstimate: parsePreorderShipEstimate(
      shipDate === null ? { kind: 'month', month: shipMonth, part: shipPart } : { kind: 'date', date: shipDate },
    ),
    nextAttemptAt: row.nextAttemptAt ? new Date(row.nextAttemptAt) : null,
    leaseUntil: row.leaseUntil ? new Date(row.leaseUntil) : null,
    deliveredAt: row.deliveredAt ? new Date(row.deliveredAt) : null,
    needsReviewAt: row.needsReviewAt ? new Date(row.needsReviewAt) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}
