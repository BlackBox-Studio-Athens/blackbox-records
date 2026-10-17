import {
  createPaidOrderDeliveryId,
  type OrderDispatch,
  type OrderDispatchRepository,
} from '../../domain/commerce/repositories/spi';

export class D1OrderDispatchRepository implements OrderDispatchRepository {
  public constructor(private readonly db: D1Database) {}

  public async listByOrderIds(orderIds: string[]): Promise<OrderDispatch[]> {
    if (!orderIds.length) return [];
    const { results } = await this.db
      .prepare(
        `SELECT "orderId", "shippedAt", "updatedAt", "updatedBy" FROM "OrderDispatch"
      WHERE "orderId" IN (${orderIds.map(() => '?').join(',')})`,
      )
      .bind(...orderIds)
      .all<OrderDispatch>();
    return results;
  }

  public async set(input: Parameters<OrderDispatchRepository['set']>[0]): Promise<'updated' | 'conflict'> {
    const at = input.at.toISOString();
    // A missing row counts as not shipped; the same transaction queues only a successful first mark.
    const mark = this.db
      .prepare(
        `INSERT INTO "OrderDispatch" ("orderId", "shippedAt", "updatedAt", "updatedBy")
      SELECT ?, ?, ?, ? WHERE ? = 0 OR EXISTS (SELECT 1 FROM "OrderDispatch" WHERE "orderId" = ?)
      ON CONFLICT ("orderId") DO UPDATE SET
        "shippedAt" = excluded."shippedAt", "updatedAt" = excluded."updatedAt", "updatedBy" = excluded."updatedBy"
      WHERE ("OrderDispatch"."shippedAt" IS NOT NULL) = ?`,
      )
      .bind(
        input.orderId,
        input.shipped ? at : null,
        at,
        input.operatorEmail,
        input.expectedShipped ? 1 : 0,
        input.orderId,
        input.expectedShipped ? 1 : 0,
      );
    const statements = [mark];
    if (input.shipped && !input.expectedShipped) {
      statements.push(
        this.db
          .prepare(
            `INSERT INTO "PaidOrderDelivery" ("id", "orderId", "kind", "status", "nextAttemptAt", "createdAt", "updatedAt")
           SELECT ?, ?, 'shopper_shipping', 'pending', ?, ?, ? WHERE changes() = 1
           ON CONFLICT ("orderId", "kind") DO NOTHING`,
          )
          .bind(createPaidOrderDeliveryId(input.orderId, 'shopper_shipping'), input.orderId, at, at, at),
      );
    }
    const [result] = await this.db.batch(statements);
    return result!.meta.changes === 1 ? 'updated' : 'conflict';
  }
}
