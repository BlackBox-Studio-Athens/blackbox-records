import type {
  ClaimedPaidOrderDelivery,
  PaidOrderDeliveryKind,
  PaidOrderDeliveryRepository,
} from '../../application/commerce/orders';

type PaidOrderDeliveryRow = {
  attemptCount: number;
  createdAt: string;
  id: string;
  kind: PaidOrderDeliveryKind;
  leaseUntil: string | null;
  nextAttemptAt: string | null;
  orderId: string;
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
}

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
