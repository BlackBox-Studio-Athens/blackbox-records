import { createStockChangeDelta, createStockQuantity, parseVariantId } from '../../../domain/commerce';
import type {
  CatalogOperation,
  OperatorStockRepository,
  RecordStockChangeInput,
  RecordStockCountInput,
  StockChangeRecord,
  StockCountRecord,
  StockRecord,
} from '../../../domain/commerce/repositories/spi';
import {
  RequestIdentityConflictError,
  type RequestIdentity,
} from '../../../domain/commerce/repositories/request-identity';

type StockRow = {
  variantId: string;
  quantity: number;
  onlineQuantity: number;
  restockPlanned: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

type StockChangeRow = {
  id: string;
  variantId: string;
  quantityDelta: number;
  reason: string;
  notes: string | null;
  actorEmail: string;
  recordedAt: string;
  idempotencyFingerprint: string | null;
};

type StockCountRow = {
  id: string;
  variantId: string;
  countedQuantity: number;
  onlineQuantity: number;
  notes: string | null;
  actorEmail: string;
  recordedAt: string;
  idempotencyFingerprint: string | null;
};

export class D1OperatorStockRepository implements OperatorStockRepository {
  public constructor(private readonly db: D1Database) {}

  public async setRestockPlanned(input: {
    expectedRevision: number | null;
    restockPlanned: boolean;
    variantId: StockRecord['variantId'];
  }): Promise<StockRecord | null> {
    const timestamp = new Date().toISOString();
    const row = await this.db
      .prepare(
        [
          `INSERT INTO "Stock" ("id", "variantId", "quantity", "onlineQuantity", "restockPlanned", "revision", "createdAt", "updatedAt")`,
          `SELECT ?, ?, 0, 0, ?, 0, ?, ? WHERE ? IS NULL OR EXISTS (SELECT 1 FROM "Stock" WHERE "variantId" = ?)`,
          `ON CONFLICT ("variantId") DO UPDATE SET "restockPlanned" = excluded."restockPlanned", "revision" = "Stock"."revision" + 1, "updatedAt" = excluded."updatedAt"`,
          `WHERE "Stock"."revision" = ? RETURNING *`,
        ].join('\n'),
      )
      .bind(
        crypto.randomUUID(),
        input.variantId,
        input.restockPlanned ? 1 : 0,
        timestamp,
        timestamp,
        input.expectedRevision,
        input.variantId,
        input.expectedRevision,
      )
      .first<StockRow>();

    return row ? mapStock(row) : null;
  }

  public async initializeOpeningStock(
    operation: CatalogOperation,
    quantity: ReturnType<typeof createStockQuantity>,
    restockPlanned = false,
    now = new Date(),
  ): Promise<boolean> {
    const opening = createStockQuantity(quantity);
    if (operation.kind !== 'item_setup' || operation.step !== 'price_bound' || !operation.claimToken) return false;
    const changeId = crypto.randomUUID();
    const timestamp = now.toISOString();
    const results = await this.db.batch([
      this.db
        .prepare(
          [
            `UPDATE "CatalogOperation"
             SET step = 'stock_initialized',
                 results = CASE WHEN ? > 0 THEN json_set(results, '$.stockChangeId', ?) ELSE results END,
                 updatedAt = ?`,
            `WHERE id = ? AND kind = 'item_setup' AND status = 'pending' AND step = 'price_bound' AND variantId = ? AND claimToken = ? AND leaseUntil > ?`,
            `AND expectedRevision = ? AND actorEmail = ? AND json_extract(results, '$.stockChangeId') IS NULL`,
            `AND EXISTS (SELECT 1 FROM "StoreItemOption" s WHERE s.variantId = "CatalogOperation".variantId AND s.cmsSourceId = json_extract("CatalogOperation".results, '$.cmsSourceId'))`,
            `AND EXISTS (SELECT 1 FROM "VariantStripeMapping" m WHERE m.variantId = "CatalogOperation".variantId AND m.stripeProductId = json_extract("CatalogOperation".results, '$.stripeProductId') AND m.stripePriceId = json_extract("CatalogOperation".results, '$.stripePriceId'))`,
            `AND NOT EXISTS (SELECT 1 FROM "Stock" WHERE variantId = "CatalogOperation".variantId)`,
            `AND NOT EXISTS (SELECT 1 FROM "StockChange" WHERE variantId = "CatalogOperation".variantId)`,
            `AND NOT EXISTS (SELECT 1 FROM "StockCount" WHERE variantId = "CatalogOperation".variantId)`,
          ].join('\n'),
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
          `INSERT INTO "Stock" (id, variantId, quantity, onlineQuantity, restockPlanned, revision, createdAt, updatedAt)
           SELECT ?, ?, ?, ?, ?, 0, ?, ? WHERE changes() = 1`,
        )
        .bind(crypto.randomUUID(), operation.variantId, opening, opening, restockPlanned ? 1 : 0, timestamp, timestamp),
      this.db
        .prepare(
          `INSERT INTO "StockChange" (id, variantId, quantityDelta, reason, notes, actorEmail, recordedAt)
           SELECT ?, ?, ?, 'Opening stock', NULL, actorEmail, ?
           FROM "CatalogOperation"
           WHERE id = ?
             AND changes() = 1
             AND ? > 0`,
        )
        .bind(changeId, operation.variantId, opening, timestamp, operation.id, opening),
    ]);
    return results[0].meta.changes === 1;
  }

  public async recordChange(input: RecordStockChangeInput) {
    const id = crypto.randomUUID();
    const recordedAt = input.recordedAt ?? new Date();
    const timestamp = recordedAt.toISOString();
    const identity = input.requestIdentity ?? null;

    try {
      const results = await this.db.batch<StockRow>([
        this.db
          .prepare(
            [
              `INSERT INTO "Stock" ("id", "variantId", "quantity", "onlineQuantity", "revision", "createdAt",
                                    "updatedAt")`,
              `SELECT ?, ?, COALESCE(s."quantity", 0) + ?, MIN(COALESCE(s."quantity", 0) + ?, MAX(0, COALESCE(s."onlineQuantity", 0) + ?)), 0, ?, ?`,
              `FROM (SELECT 1) LEFT JOIN "Stock" s ON s."variantId" = ?`,
              `WHERE COALESCE(s."quantity", 0) + ? >= 0`,
              `AND (? IS NULL OR NOT EXISTS (SELECT 1 FROM "StockChange" c WHERE c."idempotencyEnvironment" = ? AND c."idempotencyKeyDigest" = ? AND c."actorEmail" = ?))`,
              `ON CONFLICT ("variantId") DO UPDATE SET "quantity" = excluded."quantity", "onlineQuantity" = excluded."onlineQuantity", "revision" = "Stock"."revision" + 1, "updatedAt" = excluded."updatedAt"`,
              `RETURNING *`,
            ].join('\n'),
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
            identity?.keyDigest ?? null,
            identity?.productEnvironment ?? null,
            identity?.keyDigest ?? null,
            input.actorEmail,
          ),
        this.db
          .prepare(
            [
              `INSERT INTO "StockChange" ("id", "variantId", "quantityDelta", "reason", "notes", "actorEmail",
                                          "recordedAt", "idempotencyKeyDigest", "idempotencyFingerprint",
                                          "idempotencyEnvironment")`,
              `SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE changes() = 1`,
            ].join('\n'),
          )
          .bind(
            id,
            input.variantId,
            input.quantityDelta,
            input.reason,
            input.notes,
            input.actorEmail,
            timestamp,
            identity?.keyDigest ?? null,
            identity?.requestFingerprint ?? null,
            identity?.productEnvironment ?? null,
          ),
      ]);
      const row = results[0]?.results[0];
      if (row) {
        return {
          stock: mapStock(row),
          entry: createChangeRecord(input, id, recordedAt),
        };
      }
    } catch (error) {
      if (identity) {
        const replay = await this.replayChange(input, identity);
        if (replay) return replay;
      }
      throw error;
    }

    if (identity) return this.replayChange(input, identity);
    return null;
  }

  public async recordCount(input: RecordStockCountInput & { expectedRevision: number | null }) {
    const id = crypto.randomUUID();
    const recordedAt = input.recordedAt ?? new Date();
    const timestamp = recordedAt.toISOString();
    const identity = input.requestIdentity ?? null;
    const mutation =
      input.expectedRevision === null
        ? this.db
            .prepare(
              [
                `INSERT INTO "Stock" ("id", "variantId", "quantity", "onlineQuantity", "revision", "createdAt",
                                    "updatedAt")`,
                `SELECT ?, ?, ?, ?, 0, ?, ?`,
                `WHERE (? IS NULL OR NOT EXISTS (SELECT 1 FROM "StockCount" c WHERE c."idempotencyEnvironment" = ? AND c."idempotencyKeyDigest" = ? AND c."actorEmail" = ?))`,
                `ON CONFLICT ("variantId") DO NOTHING RETURNING *`,
              ].join('\n'),
            )
            .bind(
              crypto.randomUUID(),
              input.variantId,
              input.countedQuantity,
              input.onlineQuantity,
              timestamp,
              timestamp,
              identity?.keyDigest ?? null,
              identity?.productEnvironment ?? null,
              identity?.keyDigest ?? null,
              input.actorEmail,
            )
        : this.db
            .prepare(
              [
                `UPDATE "Stock"
               SET "quantity" = ?,
                   "onlineQuantity" = ?,
                   "revision" = "revision" + 1,
                   "updatedAt" = ?`,
                `WHERE "variantId" = ? AND "revision" = ?`,
                `AND (? IS NULL OR NOT EXISTS (SELECT 1 FROM "StockCount" c WHERE c."idempotencyEnvironment" = ? AND c."idempotencyKeyDigest" = ? AND c."actorEmail" = ?))`,
                `RETURNING *`,
              ].join('\n'),
            )
            .bind(
              input.countedQuantity,
              input.onlineQuantity,
              timestamp,
              input.variantId,
              input.expectedRevision,
              identity?.keyDigest ?? null,
              identity?.productEnvironment ?? null,
              identity?.keyDigest ?? null,
              input.actorEmail,
            );

    try {
      const results = await this.db.batch<StockRow>([
        mutation,
        this.db
          .prepare(
            [
              `INSERT INTO "StockCount" ("id", "variantId", "countedQuantity", "onlineQuantity", "notes", "actorEmail",
                                         "recordedAt", "idempotencyKeyDigest", "idempotencyFingerprint",
                                         "idempotencyEnvironment")`,
              `SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE changes() = 1`,
            ].join('\n'),
          )
          .bind(
            id,
            input.variantId,
            input.countedQuantity,
            input.onlineQuantity,
            input.notes,
            input.actorEmail,
            timestamp,
            identity?.keyDigest ?? null,
            identity?.requestFingerprint ?? null,
            identity?.productEnvironment ?? null,
          ),
      ]);
      const row = results[0]?.results[0];
      if (row) {
        return {
          stock: mapStock(row),
          entry: createCountRecord(input, id, recordedAt),
        };
      }
    } catch (error) {
      if (identity) {
        const replay = await this.replayCount(input, identity);
        if (replay) return replay;
      }
      throw error;
    }

    if (identity) return this.replayCount(input, identity);
    return null;
  }

  private async replayChange(
    input: RecordStockChangeInput,
    identity: RequestIdentity,
  ): Promise<{ stock: StockRecord; entry: StockChangeRecord } | null> {
    const row = await this.findChange(identity, input.actorEmail);
    if (!row) return null;
    if (row.idempotencyFingerprint !== identity.requestFingerprint) {
      throw new RequestIdentityConflictError();
    }
    const stock = await this.readStock(input.variantId);
    return stock ? { stock, entry: mapChange(row) } : null;
  }

  private async replayCount(
    input: RecordStockCountInput,
    identity: RequestIdentity,
  ): Promise<{ stock: StockRecord; entry: StockCountRecord } | null> {
    const row = await this.findCount(identity, input.actorEmail);
    if (!row) return null;
    if (row.idempotencyFingerprint !== identity.requestFingerprint) {
      throw new RequestIdentityConflictError();
    }
    const stock = await this.readStock(input.variantId);
    return stock ? { stock, entry: mapCount(row) } : null;
  }

  private async findChange(identity: RequestIdentity, actorEmail: string): Promise<StockChangeRow | null> {
    const row = await this.db
      .prepare(
        `SELECT "id",
                "variantId",
                "quantityDelta",
                "reason",
                "notes",
                "actorEmail",
                "recordedAt",
                "idempotencyFingerprint"
         FROM "StockChange"
         WHERE "idempotencyEnvironment" = ?
           AND "idempotencyKeyDigest" = ?
           AND "actorEmail" = ? LIMIT 1`,
      )
      .bind(identity.productEnvironment, identity.keyDigest, actorEmail)
      .first<StockChangeRow>();
    return row;
  }

  private async findCount(identity: RequestIdentity, actorEmail: string): Promise<StockCountRow | null> {
    const row = await this.db
      .prepare(
        `SELECT "id",
                "variantId",
                "countedQuantity",
                "onlineQuantity",
                "notes",
                "actorEmail",
                "recordedAt",
                "idempotencyFingerprint"
         FROM "StockCount"
         WHERE "idempotencyEnvironment" = ?
           AND "idempotencyKeyDigest" = ?
           AND "actorEmail" = ? LIMIT 1`,
      )
      .bind(identity.productEnvironment, identity.keyDigest, actorEmail)
      .first<StockCountRow>();
    return row;
  }

  private async readStock(variantId: string): Promise<StockRecord | null> {
    const row = await this.db
      .prepare(
        `SELECT "variantId", "quantity", "onlineQuantity", "revision", "createdAt", "updatedAt"
         FROM "Stock"
         WHERE "variantId" = ?`,
      )
      .bind(variantId)
      .first<StockRow>();
    return row ? mapStock(row) : null;
  }
}

function createChangeRecord(input: RecordStockChangeInput, id: string, recordedAt: Date): StockChangeRecord {
  return {
    actorEmail: input.actorEmail,
    id,
    notes: input.notes,
    quantityDelta: input.quantityDelta,
    reason: input.reason,
    recordedAt,
    variantId: input.variantId,
  };
}

function createCountRecord(input: RecordStockCountInput, id: string, recordedAt: Date): StockCountRecord {
  return {
    actorEmail: input.actorEmail,
    countedQuantity: input.countedQuantity,
    id,
    notes: input.notes,
    onlineQuantity: input.onlineQuantity,
    recordedAt,
    variantId: input.variantId,
  };
}

function mapChange(row: StockChangeRow): StockChangeRecord {
  return {
    actorEmail: row.actorEmail,
    id: row.id,
    notes: row.notes,
    quantityDelta: createStockChangeDelta(row.quantityDelta),
    reason: row.reason,
    recordedAt: new Date(row.recordedAt),
    variantId: parseVariantId(row.variantId),
  };
}

function mapCount(row: StockCountRow): StockCountRecord {
  return {
    actorEmail: row.actorEmail,
    countedQuantity: createStockQuantity(row.countedQuantity),
    id: row.id,
    notes: row.notes,
    onlineQuantity: createStockQuantity(row.onlineQuantity),
    recordedAt: new Date(row.recordedAt),
    variantId: parseVariantId(row.variantId),
  };
}

function mapStock(row: StockRow): StockRecord {
  return {
    variantId: parseVariantId(row.variantId),
    quantity: createStockQuantity(row.quantity),
    onlineQuantity: createStockQuantity(row.onlineQuantity),
    restockPlanned: row.restockPlanned === 1,
    revision: row.revision,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}
