import { createStockQuantity, parseVariantId } from '../../../domain/commerce';
import type {
  CatalogOperation,
  OperatorStockRepository,
  RecordStockChangeInput,
  RecordStockCountInput,
  StockRecord,
} from '../../../domain/commerce/repositories/spi';

type StockRow = {
  variantId: string;
  quantity: number;
  onlineQuantity: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export class D1OperatorStockRepository implements OperatorStockRepository {
  public constructor(private readonly db: D1Database) {}

  public async initializeOpeningStock(
    operation: CatalogOperation,
    quantity: ReturnType<typeof createStockQuantity>,
    now = new Date(),
  ): Promise<boolean> {
    const opening = createStockQuantity(quantity);
    if (operation.kind !== 'item_setup' || operation.step !== 'price_bound' || !operation.claimToken) return false;
    const changeId = crypto.randomUUID();
    const timestamp = now.toISOString();
    const results = await this.db.batch([
      this.db
        .prepare(
          `UPDATE "CatalogOperation" SET step = 'stock_initialized', results = CASE WHEN ? > 0 THEN json_set(results, '$.stockChangeId', ?) ELSE results END, updatedAt = ?
        WHERE id = ? AND kind = 'item_setup' AND status = 'pending' AND step = 'price_bound' AND variantId = ? AND claimToken = ? AND leaseUntil > ?
        AND expectedRevision = ? AND actorEmail = ? AND json_extract(results, '$.stockChangeId') IS NULL
        AND EXISTS (SELECT 1 FROM "StoreItemOption" s WHERE s.variantId = "CatalogOperation".variantId AND s.cmsSourceId = json_extract("CatalogOperation".results, '$.cmsSourceId'))
        AND EXISTS (SELECT 1 FROM "VariantStripeMapping" m WHERE m.variantId = "CatalogOperation".variantId AND m.stripeProductId = json_extract("CatalogOperation".results, '$.stripeProductId') AND m.stripePriceId = json_extract("CatalogOperation".results, '$.stripePriceId'))
        AND NOT EXISTS (SELECT 1 FROM "Stock" WHERE variantId = "CatalogOperation".variantId)
        AND NOT EXISTS (SELECT 1 FROM "StockChange" WHERE variantId = "CatalogOperation".variantId)
        AND NOT EXISTS (SELECT 1 FROM "StockCount" WHERE variantId = "CatalogOperation".variantId)`,
        )
        .bind(
          opening,
          changeId,
          timestamp,
          operation.id,
          operation.variantId,
          operation.claimToken,
          timestamp,
          operation.expectedRevision,
          operation.actorEmail,
        ),
      this.db
        .prepare(
          `INSERT INTO "Stock" (id, variantId, quantity, onlineQuantity, revision, createdAt, updatedAt)
        SELECT ?, ?, ?, ?, 0, ?, ? WHERE changes() = 1`,
        )
        .bind(crypto.randomUUID(), operation.variantId, opening, opening, timestamp, timestamp),
      this.db
        .prepare(
          `INSERT INTO "StockChange" (id, variantId, quantityDelta, reason, notes, actorEmail, recordedAt)
        SELECT ?, ?, ?, 'Opening stock', NULL, actorEmail, ? FROM "CatalogOperation" WHERE id = ? AND changes() = 1 AND ? > 0`,
        )
        .bind(changeId, operation.variantId, opening, timestamp, operation.id, opening),
    ]);
    return results[0].meta.changes === 1;
  }

  public async recordChange(input: RecordStockChangeInput) {
    const id = crypto.randomUUID();
    const recordedAt = input.recordedAt ?? new Date();
    const timestamp = recordedAt.toISOString();
    const results = await this.db.batch<StockRow>([
      this.db
        .prepare(
          `
        INSERT INTO "Stock" ("id", "variantId", "quantity", "onlineQuantity", "revision", "createdAt", "updatedAt")
        SELECT ?, ?, COALESCE(s."quantity", 0) + ?,
          MIN(COALESCE(s."quantity", 0) + ?, MAX(0, COALESCE(s."onlineQuantity", 0) + ?)), 0, ?, ?
        FROM (SELECT 1) LEFT JOIN "Stock" s ON s."variantId" = ?
        WHERE COALESCE(s."quantity", 0) + ? >= 0
        ON CONFLICT ("variantId") DO UPDATE SET
          "quantity" = excluded."quantity", "onlineQuantity" = excluded."onlineQuantity",
          "revision" = "Stock"."revision" + 1, "updatedAt" = excluded."updatedAt"
        RETURNING *
      `,
        )
        .bind(
          crypto.randomUUID(),
          input.variantId,
          input.quantityDelta,
          input.quantityDelta,
          input.quantityDelta,
          timestamp,
          timestamp,
          input.variantId,
          input.quantityDelta,
        ),
      this.db
        .prepare(
          `
        INSERT INTO "StockChange" ("id", "variantId", "quantityDelta", "reason", "notes", "actorEmail", "recordedAt")
        SELECT ?, ?, ?, ?, ?, ?, ? WHERE changes() = 1
      `,
        )
        .bind(id, input.variantId, input.quantityDelta, input.reason, input.notes, input.actorEmail, timestamp),
    ]);
    const row = results[0]?.results[0];
    if (!row) return null;
    return { stock: mapStock(row), entry: { ...input, id, recordedAt } };
  }

  public async recordCount(input: RecordStockCountInput & { expectedRevision: number | null }) {
    const id = crypto.randomUUID();
    const recordedAt = input.recordedAt ?? new Date();
    const timestamp = recordedAt.toISOString();
    const mutation =
      input.expectedRevision === null
        ? this.db
            .prepare(
              `
          INSERT INTO "Stock" ("id", "variantId", "quantity", "onlineQuantity", "revision", "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, 0, ?, ?) ON CONFLICT ("variantId") DO NOTHING RETURNING *
        `,
            )
            .bind(
              crypto.randomUUID(),
              input.variantId,
              input.countedQuantity,
              input.onlineQuantity,
              timestamp,
              timestamp,
            )
        : this.db
            .prepare(
              `
          UPDATE "Stock" SET "quantity" = ?, "onlineQuantity" = ?, "revision" = "revision" + 1, "updatedAt" = ?
          WHERE "variantId" = ? AND "revision" = ? RETURNING *
        `,
            )
            .bind(input.countedQuantity, input.onlineQuantity, timestamp, input.variantId, input.expectedRevision);
    const results = await this.db.batch<StockRow>([
      mutation,
      this.db
        .prepare(
          `
        INSERT INTO "StockCount" ("id", "variantId", "countedQuantity", "onlineQuantity", "notes", "actorEmail", "recordedAt")
        SELECT ?, ?, ?, ?, ?, ?, ? WHERE changes() = 1
      `,
        )
        .bind(
          id,
          input.variantId,
          input.countedQuantity,
          input.onlineQuantity,
          input.notes,
          input.actorEmail,
          timestamp,
        ),
    ]);
    const row = results[0]?.results[0];
    if (!row) return null;
    return {
      stock: mapStock(row),
      entry: {
        id,
        recordedAt,
        variantId: input.variantId,
        countedQuantity: input.countedQuantity,
        onlineQuantity: input.onlineQuantity,
        notes: input.notes,
        actorEmail: input.actorEmail,
      },
    };
  }
}

function mapStock(row: StockRow): StockRecord {
  return {
    variantId: parseVariantId(row.variantId),
    quantity: createStockQuantity(row.quantity),
    onlineQuantity: createStockQuantity(row.onlineQuantity),
    revision: row.revision,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}
