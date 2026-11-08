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
        `SELECT "orderId", "shippedAt", "updatedAt", "updatedBy", "shippingEmailSuppressed", "lockerUsedId", "lockerUsedName", "parcelNumbers" FROM "OrderDispatch"
      WHERE "orderId" IN (${orderIds.map(() => '?').join(',')})`,
      )
      .bind(...orderIds)
      .all<
        Omit<OrderDispatch, 'shippingEmailSuppressed' | 'lockerUsed' | 'parcelNumbers'> & {
          shippingEmailSuppressed: number;
          lockerUsedId: string | null;
          lockerUsedName: string | null;
          parcelNumbers: string | null;
        }
      >();
    return results.map(({ lockerUsedId, lockerUsedName, parcelNumbers, ...row }) => ({
      ...row,
      shippingEmailSuppressed: row.shippingEmailSuppressed === 1,
      lockerUsed: lockerUsedId && lockerUsedName ? { lockerId: lockerUsedId, name: lockerUsedName } : null,
      parcelNumbers: parcelNumbers ? (JSON.parse(parcelNumbers) as string[]) : [],
    }));
  }

  public async set(input: Parameters<OrderDispatchRepository['set']>[0]): Promise<'updated' | 'conflict'> {
    const at = input.at.toISOString();
    // A missing row counts as not shipped; the same transaction queues only a successful first mark.
    const mark = this.db
      .prepare(
        `INSERT INTO "OrderDispatch" ("orderId", "shippedAt", "updatedAt", "updatedBy", "shippingEmailSuppressed", "lockerUsedId", "lockerUsedName", "parcelNumbers")
      SELECT ?, ?, ?, ?, ? AND NOT EXISTS (
        SELECT 1 FROM "PaidOrderDelivery" WHERE "orderId" = ? AND "kind" = 'shopper_shipping'
      ), ?, ?, ? WHERE ? = 0 OR EXISTS (SELECT 1 FROM "OrderDispatch" WHERE "orderId" = ?)
      ON CONFLICT ("orderId") DO UPDATE SET
        "shippedAt" = excluded."shippedAt", "updatedAt" = excluded."updatedAt", "updatedBy" = excluded."updatedBy",
        "shippingEmailSuppressed" = MAX("OrderDispatch"."shippingEmailSuppressed", excluded."shippingEmailSuppressed"),
        "lockerUsedId" = CASE WHEN excluded."shippedAt" IS NOT NULL THEN excluded."lockerUsedId" ELSE "OrderDispatch"."lockerUsedId" END,
        "lockerUsedName" = CASE WHEN excluded."shippedAt" IS NOT NULL THEN excluded."lockerUsedName" ELSE "OrderDispatch"."lockerUsedName" END,
        "parcelNumbers" = CASE WHEN excluded."shippedAt" IS NOT NULL THEN excluded."parcelNumbers" ELSE "OrderDispatch"."parcelNumbers" END
      WHERE ("OrderDispatch"."shippedAt" IS NOT NULL) = ?`,
      )
      .bind(
        input.orderId,
        input.shipped ? at : null,
        at,
        input.operatorEmail,
        input.shipped && input.sendShippingEmail === false ? 1 : 0,
        input.orderId,
        input.shipped ? (input.lockerUsed?.lockerId ?? null) : null,
        input.shipped ? (input.lockerUsed?.name ?? null) : null,
        input.shipped ? JSON.stringify(input.parcelNumbers ?? []) : null,
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
             AND EXISTS (SELECT 1 FROM "OrderDispatch" WHERE "orderId" = ? AND "shippingEmailSuppressed" = 0)
           ON CONFLICT ("orderId", "kind") DO NOTHING`,
          )
          .bind(createPaidOrderDeliveryId(input.orderId, 'shopper_shipping'), input.orderId, at, at, at, input.orderId),
      );
    }
    const [result] = await this.db.batch(statements);
    return result!.meta.changes === 1 ? 'updated' : 'conflict';
  }
}
