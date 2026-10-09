import type {
  OrderWithdrawal,
  OrderWithdrawalRepository,
  WithdrawalDelivery,
} from '../../domain/commerce/repositories/spi';

const columns = '"id", "fingerprint", "name", "contract", "email", "submittedAt"';

export class D1OrderWithdrawalRepository implements OrderWithdrawalRepository {
  public constructor(private readonly db: D1Database) {}

  public async record(
    input: OrderWithdrawal & { requesterHash: string },
  ): ReturnType<OrderWithdrawalRepository['record']> {
    const hourAgo = new Date(new Date(input.submittedAt).getTime() - 60 * 60 * 1000).toISOString();
    // D1 batch is transactional. Caps and the notice/outbox insertion share that transaction.
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO "OrderWithdrawal" (${columns}, "requesterHash")
        SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE (SELECT COUNT(*) FROM "OrderWithdrawal" WHERE "email" = ? AND "submittedAt" >= ?) < 5
          AND (SELECT COUNT(*) FROM "OrderWithdrawal" WHERE "requesterHash" = ? AND "submittedAt" >= ?) < 20
        ON CONFLICT ("id") DO NOTHING`,
        )
        .bind(
          input.id,
          input.fingerprint,
          input.name,
          input.contract,
          input.email,
          input.submittedAt,
          input.requesterHash,
          input.email,
          hourAgo,
          input.requesterHash,
          hourAgo,
        ),
      ...(['acknowledgement', 'support'] as const).map((kind) =>
        this.db
          .prepare(
            `INSERT INTO "OrderWithdrawalDelivery"
        ("id", "withdrawalId", "kind", "nextAttemptAt")
        SELECT ?, "id", ?, "submittedAt" FROM "OrderWithdrawal" WHERE "id" = ? AND "fingerprint" = ?
        ON CONFLICT ("withdrawalId", "kind") DO NOTHING`,
          )
          .bind(`${input.id}:${kind}`, kind, input.id, input.fingerprint),
      ),
    ]);
    const withdrawal = await this.db
      .prepare(`SELECT ${columns} FROM "OrderWithdrawal" WHERE "id" = ?`)
      .bind(input.id)
      .first<OrderWithdrawal>();
    if (!withdrawal) return { kind: 'limited' };
    if (withdrawal.fingerprint !== input.fingerprint) return { kind: 'conflict' };
    return { kind: 'recorded', withdrawal };
  }

  public async claim(now: Date, id?: string): Promise<WithdrawalDelivery | null> {
    const timestamp = now.toISOString();
    const row = await this.db
      .prepare(
        `UPDATE "OrderWithdrawalDelivery"
      SET "leaseUntil" = ?, "attemptCount" = "attemptCount" + 1
      WHERE "id" = (SELECT "id" FROM "OrderWithdrawalDelivery"
        WHERE "status" = 'pending' AND "nextAttemptAt" <= ? AND ("leaseUntil" IS NULL OR "leaseUntil" <= ?)
          AND (? IS NULL OR "withdrawalId" = ?) AND "attemptCount" < 5
        ORDER BY "nextAttemptAt", "kind" LIMIT 1)
      RETURNING "id" AS "deliveryId", "withdrawalId", "kind", "attemptCount", "leaseUntil"`,
      )
      .bind(new Date(now.getTime() + 5 * 60 * 1000).toISOString(), timestamp, timestamp, id ?? null, id ?? null)
      .first<Omit<WithdrawalDelivery, keyof OrderWithdrawal> & { withdrawalId: string }>();
    // A crashed final attempt must remain visible for manual recovery, never disappear.
    await this.db
      .prepare(
        `UPDATE "OrderWithdrawalDelivery" SET "status" = 'needs_review', "safeReason" = 'delivery_window_expired',
      "nextAttemptAt" = NULL, "leaseUntil" = NULL WHERE "status" = 'pending' AND "attemptCount" >= 5 AND "leaseUntil" <= ?`,
      )
      .bind(timestamp)
      .run();
    if (!row) return null;
    const withdrawal = await this.db
      .prepare(`SELECT ${columns} FROM "OrderWithdrawal" WHERE "id" = ?`)
      .bind(row.withdrawalId)
      .first<OrderWithdrawal>();
    if (!withdrawal) throw new Error('Withdrawal delivery record is missing.');
    return { ...withdrawal, ...row };
  }

  public async finish(
    delivery: WithdrawalDelivery,
    input: Parameters<OrderWithdrawalRepository['finish']>[1],
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE "OrderWithdrawalDelivery"
      SET "status" = ?, "nextAttemptAt" = ?, "leaseUntil" = NULL, "safeReason" = ?
      WHERE "id" = ? AND "status" = 'pending' AND "attemptCount" = ? AND "leaseUntil" = ?`,
      )
      .bind(
        input.status,
        input.nextAttemptAt,
        input.safeReason,
        delivery.deliveryId,
        delivery.attemptCount,
        delivery.leaseUntil,
      )
      .run();
    return result.meta.changes === 1;
  }

  public async listRecent(): ReturnType<OrderWithdrawalRepository['listRecent']> {
    const { results } = await this.db
      .prepare(`SELECT ${columns} FROM "OrderWithdrawal" ORDER BY "submittedAt" DESC LIMIT 50`)
      .all<OrderWithdrawal>();
    if (!results.length) return [];
    const { results: deliveries } = await this.db
      .prepare(
        `SELECT "withdrawalId", "kind", "status", "attemptCount", "safeReason"
      FROM "OrderWithdrawalDelivery" WHERE "withdrawalId" IN (${results.map(() => '?').join(',')})`,
      )
      .bind(...results.map((row) => row.id))
      .all<{ withdrawalId: string; kind: string; status: string; attemptCount: number; safeReason: string | null }>();
    return results.map((row) => ({
      ...row,
      deliveries: deliveries.filter((delivery) => delivery.withdrawalId === row.id),
    }));
  }
}
