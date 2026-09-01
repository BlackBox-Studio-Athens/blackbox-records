import type {
  ClaimedPaidOrderDelivery,
  PaidOrderDeliveryKind,
  PaidOrderDeliveryRepository,
  PaidOrderDeliverySummary,
} from '../../domain/commerce/repositories/spi';

type PaidOrderDeliveryRow = {
  attemptCount: number;
  createdAt: string;
  deliveredAt?: string | null;
  id: string;
  kind: PaidOrderDeliveryKind;
  leaseUntil: string | null;
  needsReviewAt?: string | null;
  nextAttemptAt: string | null;
  orderId: string;
  safeReason?: string | null;
  status: 'delivered' | 'needs_review' | 'pending';
  updatedAt: string;
};

const PAID_ORDER_DELIVERY_LEASE_MS = 10 * 60 * 1000;

const deliverySelectSql = [
  'SELECT "id", "orderId", "kind", "status", "attemptCount", "nextAttemptAt", "leaseUntil", "createdAt", "updatedAt"',
  'FROM "PaidOrderDelivery"',
  'WHERE "status" = ? AND "nextAttemptAt" IS NOT NULL AND "nextAttemptAt" <= ?',
  '  AND ("leaseUntil" IS NULL OR "leaseUntil" <= ?)',
  '  AND (? IS NULL OR "id" = ?)',
  '  AND "attemptCount" < 5',
  'ORDER BY "nextAttemptAt" ASC, "createdAt" ASC, "id" ASC',
  'LIMIT 1',
].join('\n');

export class D1PaidOrderDeliveryRepository implements PaidOrderDeliveryRepository {
  public constructor(private readonly db: D1Database) {}

  public async claimDue(input: { claimedAt: Date; deliveryId: string | null }) {
    const claimedAt = input.claimedAt.toISOString();
    const candidate = await this.db
      .prepare(deliverySelectSql)
      .bind('pending', claimedAt, claimedAt, input.deliveryId, input.deliveryId)
      .first<PaidOrderDeliveryRow>();

    if (!candidate) return { kind: 'not_claimed' } as const;

    const leaseUntil = new Date(input.claimedAt.getTime() + PAID_ORDER_DELIVERY_LEASE_MS).toISOString();
    const result = await this.db
      .prepare(
        [
          'UPDATE "PaidOrderDelivery"',
          'SET "attemptCount" = "attemptCount" + 1, "leaseUntil" = ?, "updatedAt" = ?',
          'WHERE "id" = ? AND "status" = ? AND "attemptCount" = ?',
          '  AND "nextAttemptAt" IS NOT NULL AND "nextAttemptAt" <= ?',
          '  AND ("leaseUntil" IS NULL OR "leaseUntil" <= ?)',
        ].join('\n'),
      )
      .bind(leaseUntil, claimedAt, candidate.id, 'pending', candidate.attemptCount, claimedAt, claimedAt)
      .run();

    if (Number(result.meta.changes ?? 0) !== 1) return { kind: 'not_claimed' } as const;

    const claimed = await this.db
      .prepare(
        [
          'SELECT "id", "orderId", "kind", "status", "attemptCount", "nextAttemptAt", "leaseUntil", "createdAt", "updatedAt"',
          'FROM "PaidOrderDelivery"',
          'WHERE "id" = ?',
        ].join('\n'),
      )
      .bind(candidate.id)
      .first<PaidOrderDeliveryRow>();

    if (!claimed || claimed.status !== 'pending' || claimed.leaseUntil !== leaseUntil || !claimed.nextAttemptAt) {
      throw new Error('Claimed paid-order delivery could not be read back.');
    }

    return { delivery: mapClaimedDelivery(claimed), kind: 'claimed' } as const;
  }

  public async listSummaries(orderIds: string[]): Promise<PaidOrderDeliverySummary[]> {
    if (orderIds.length === 0) return [];

    const placeholders = orderIds.map(() => '?').join(', ');
    const result = await this.db
      .prepare(
        [
          'SELECT "id", "orderId", "kind", "status", "attemptCount", "nextAttemptAt", "safeReason",',
          '       "deliveredAt", "needsReviewAt", "createdAt", "updatedAt"',
          'FROM "PaidOrderDelivery"',
          `WHERE "orderId" IN (${placeholders})`,
          'ORDER BY "createdAt" ASC, "id" ASC',
        ].join('\n'),
      )
      .bind(...orderIds)
      .all<PaidOrderDeliveryRow>();

    return result.results.map(mapDeliverySummary);
  }

  public async markDelivered(input: {
    deliveredAt: Date;
    delivery: ClaimedPaidOrderDelivery;
    providerMessageId: string | null;
  }): Promise<boolean> {
    const deliveredAt = input.deliveredAt.toISOString();
    const result = await this.db
      .prepare(
        [
          'UPDATE "PaidOrderDelivery"',
          'SET "status" = ?, "nextAttemptAt" = NULL, "leaseUntil" = NULL, "providerMessageId" = ?,',
          '    "safeReason" = NULL, "deliveredAt" = ?, "needsReviewAt" = NULL, "updatedAt" = ?',
          claimedLeaseWhereSql,
        ].join('\n'),
      )
      .bind(
        'delivered',
        input.providerMessageId,
        deliveredAt,
        deliveredAt,
        input.delivery.id,
        'pending',
        input.delivery.attemptCount,
        input.delivery.leaseUntil.toISOString(),
      )
      .run();

    return Number(result.meta.changes ?? 0) === 1;
  }

  public async markNeedsReview(input: {
    delivery: ClaimedPaidOrderDelivery;
    needsReviewAt: Date;
    safeReason: string;
  }): Promise<boolean> {
    const needsReviewAt = input.needsReviewAt.toISOString();
    const result = await this.db
      .prepare(
        [
          'UPDATE "PaidOrderDelivery"',
          'SET "status" = ?, "nextAttemptAt" = NULL, "leaseUntil" = NULL, "safeReason" = ?,',
          '    "deliveredAt" = NULL, "needsReviewAt" = ?, "updatedAt" = ?',
          claimedLeaseWhereSql,
        ].join('\n'),
      )
      .bind(
        'needs_review',
        input.safeReason,
        needsReviewAt,
        needsReviewAt,
        input.delivery.id,
        'pending',
        input.delivery.attemptCount,
        input.delivery.leaseUntil.toISOString(),
      )
      .run();

    return Number(result.meta.changes ?? 0) === 1;
  }

  public async reschedule(input: {
    delivery: ClaimedPaidOrderDelivery;
    nextAttemptAt: Date;
    safeReason: string;
    updatedAt: Date;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        [
          'UPDATE "PaidOrderDelivery"',
          'SET "nextAttemptAt" = ?, "leaseUntil" = NULL, "safeReason" = ?, "updatedAt" = ?',
          claimedLeaseWhereSql,
        ].join('\n'),
      )
      .bind(
        input.nextAttemptAt.toISOString(),
        input.safeReason,
        input.updatedAt.toISOString(),
        input.delivery.id,
        'pending',
        input.delivery.attemptCount,
        input.delivery.leaseUntil.toISOString(),
      )
      .run();

    return Number(result.meta.changes ?? 0) === 1;
  }
}

const claimedLeaseWhereSql = 'WHERE "id" = ? AND "status" = ? AND "attemptCount" = ? AND "leaseUntil" = ?';

function mapClaimedDelivery(row: PaidOrderDeliveryRow): ClaimedPaidOrderDelivery {
  return {
    attemptCount: row.attemptCount,
    createdAt: new Date(row.createdAt),
    id: row.id,
    kind: row.kind,
    leaseUntil: new Date(row.leaseUntil!),
    nextAttemptAt: new Date(row.nextAttemptAt!),
    orderId: row.orderId,
    status: 'pending',
    updatedAt: new Date(row.updatedAt),
  };
}

function mapDeliverySummary(row: PaidOrderDeliveryRow): PaidOrderDeliverySummary {
  return {
    attemptCount: row.attemptCount,
    createdAt: new Date(row.createdAt),
    deliveredAt: row.deliveredAt ? new Date(row.deliveredAt) : null,
    id: row.id,
    kind: row.kind,
    needsReviewAt: row.needsReviewAt ? new Date(row.needsReviewAt) : null,
    nextAttemptAt: row.nextAttemptAt ? new Date(row.nextAttemptAt) : null,
    orderId: row.orderId,
    safeReason: row.safeReason ?? null,
    status: row.status,
    updatedAt: new Date(row.updatedAt),
  };
}
