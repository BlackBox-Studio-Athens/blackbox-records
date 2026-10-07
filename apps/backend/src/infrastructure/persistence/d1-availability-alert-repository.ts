import {
  createStockQuantity,
  parseStoreItemSlug,
  parseVariantId,
  stockPreorderFromColumns,
  type VariantId,
  type ZeroStockState,
} from '../../domain/commerce';
import type {
  AvailabilityAlertDelivery,
  AvailabilityAlertRepository,
  AvailabilityAlertRequest,
  ClaimedAvailabilityAlert,
} from '../../domain/commerce/repositories/spi';

type AlertRow = {
  id: string;
  variantId: string;
  email: string;
  attemptCount: number;
  leaseUntil: string;
  createdAt: string;
};

type DeliveryRow = {
  storeItemSlug: string;
  itemType: string | null;
  availabilityStatus: 'available' | 'sold_out' | null;
  canBuy: number | null;
  effectiveQuantity: number | null;
  zeroStockState: ZeroStockState | null;
  preorderStartedAt: string | null;
  preorderShipMonth: string | null;
  preorderShipPart: string | null;
  preorderShipDate: string | null;
};

// Same effective-stock rule as the listing reader and checkout holds: min(physical, online) minus pending payments.
const effectiveQuantitySql = `MAX(0, MIN(stock."quantity", stock."onlineQuantity") - COALESCE((
    SELECT SUM(line."quantity") FROM "CheckoutOrderLine" line
    INNER JOIN "CheckoutOrder" checkout ON checkout."id" = line."orderId"
    WHERE checkout."status" = 'pending_payment' AND line."variantId" = stock."variantId"), 0))`;

const leaseGuardSql = `WHERE "id" = ? AND "status" = 'sending' AND "attemptCount" = ? AND "leaseUntil" = ?`;

export class D1AvailabilityAlertRepository implements AvailabilityAlertRepository {
  public constructor(private readonly db: D1Database) {}

  public async request(input: AvailabilityAlertRequest, pendingCap: number): Promise<'accepted' | 'cap_reached'> {
    const timestamp = input.consentedAt.toISOString();
    const inserted = await this.db
      .prepare(
        `INSERT INTO "AvailabilityAlert"
           ("id", "variantId", "email", "consentCopyVersion", "consentedAt", "status", "attemptCount",
            "nextAttemptAt", "leaseUntil", "createdAt", "updatedAt")
         SELECT ?, ?, ?, ?, ?, 'pending', 0, ?, NULL, ?, ?
         WHERE (SELECT COUNT(*) FROM "AvailabilityAlert" WHERE "variantId" = ?) < ?
         ON CONFLICT ("variantId", "email") DO NOTHING`,
      )
      .bind(
        crypto.randomUUID(),
        input.variantId,
        input.email,
        input.consentCopyVersion,
        timestamp,
        timestamp,
        timestamp,
        timestamp,
        input.variantId,
        pendingCap,
      )
      .run();
    if (inserted.meta.changes === 1) return 'accepted';
    const existing = await this.db
      .prepare('SELECT 1 AS "found" FROM "AvailabilityAlert" WHERE "variantId" = ? AND "email" = ?')
      .bind(input.variantId, input.email)
      .first();
    return existing ? 'accepted' : 'cap_reached';
  }

  public async countWaiting(variantId: VariantId): Promise<number> {
    const row = await this.db
      .prepare('SELECT COUNT(*) AS "count" FROM "AvailabilityAlert" WHERE "variantId" = ?')
      .bind(variantId)
      .first<{ count: number }>();
    return row?.count ?? 0;
  }

  public async deleteExpired(input: { now: Date; requestedBefore: Date }): Promise<number> {
    const now = input.now.toISOString();
    const result = await this.db
      .prepare(
        `DELETE FROM "AvailabilityAlert"
         WHERE ("createdAt" < ? AND ("status" = 'pending' OR "leaseUntil" <= ?))
            OR ("status" = 'sending' AND "attemptCount" >= 5 AND "leaseUntil" <= ?)`,
      )
      .bind(input.requestedBefore.toISOString(), now, now)
      .run();
    return result.meta.changes;
  }

  public async reserveSend(day: string, budget: number): Promise<boolean> {
    const row = await this.db
      .prepare(
        `INSERT INTO "AvailabilityAlertSendDay" ("day", "sentCount") SELECT ?, 1 WHERE ? > 0
         ON CONFLICT ("day") DO UPDATE SET "sentCount" = "sentCount" + 1 WHERE "sentCount" < ?
         RETURNING "sentCount"`,
      )
      .bind(day, budget, budget)
      .first();
    return row !== null;
  }

  public async claimDue(input: { claimedAt: Date; leaseUntil: Date }): Promise<AvailabilityAlertDelivery | null> {
    const now = input.claimedAt.toISOString();
    const alert = await this.db
      .prepare(
        `UPDATE "AvailabilityAlert"
         SET "status" = 'sending', "attemptCount" = "attemptCount" + 1, "leaseUntil" = ?, "updatedAt" = ?
         WHERE "id" = (
           SELECT alert."id" FROM "AvailabilityAlert" alert
           INNER JOIN "StoreItemOption" item ON item."variantId" = alert."variantId"
             AND item."catalogAvailability" = 'published'
           INNER JOIN "ItemAvailability" availability ON availability."variantId" = alert."variantId"
             AND availability."status" = 'available' AND availability."canBuy" = 1
           INNER JOIN "Stock" stock ON stock."variantId" = alert."variantId"
           WHERE alert."attemptCount" < 5 AND alert."nextAttemptAt" <= ?
             AND (alert."status" = 'pending' OR alert."leaseUntil" <= ?)
             AND ${effectiveQuantitySql} > 0
           ORDER BY alert."createdAt" ASC, alert."id" ASC
           LIMIT 1
         )
         RETURNING "id", "variantId", "email", "attemptCount", "leaseUntil", "createdAt"`,
      )
      .bind(input.leaseUntil.toISOString(), now, now, now)
      .first<AlertRow>();
    if (!alert) return null;

    const row = await this.db
      .prepare(
        `SELECT item."storeItemSlug", item."itemType",
           availability."status" AS "availabilityStatus", availability."canBuy",
           CASE WHEN stock."variantId" IS NULL THEN NULL ELSE ${effectiveQuantitySql} END AS "effectiveQuantity",
           stock."zeroStockState", stock."preorderStartedAt", stock."preorderShipMonth", stock."preorderShipPart",
           stock."preorderShipDate"
         FROM "StoreItemOption" item
         LEFT JOIN "ItemAvailability" availability ON availability."variantId" = item."variantId"
         LEFT JOIN "Stock" stock ON stock."variantId" = item."variantId"
         WHERE item."variantId" = ?`,
      )
      .bind(alert.variantId)
      .first<DeliveryRow>();
    const claimed = mapAlert(alert);
    if (!row) return { alert: claimed, storeItemSlug: null, itemFormat: null, availability: null, stock: null };
    return {
      alert: claimed,
      storeItemSlug: parseStoreItemSlug(row.storeItemSlug),
      itemFormat: row.itemType?.trim() || null,
      availability:
        row.availabilityStatus === null ? null : { status: row.availabilityStatus, canBuy: row.canBuy === 1 },
      stock:
        row.effectiveQuantity === null || row.zeroStockState === null
          ? null
          : {
              onlineQuantity: createStockQuantity(row.effectiveQuantity),
              zeroStockState: row.zeroStockState,
              preorder: stockPreorderFromColumns(row),
            },
    };
  }

  public async reschedule(input: Parameters<AvailabilityAlertRepository['reschedule']>[0]): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE "AvailabilityAlert"
         SET "status" = 'pending', "leaseUntil" = NULL, "nextAttemptAt" = ?, "updatedAt" = ?,
             "attemptCount" = "attemptCount" - ?
         ${leaseGuardSql}`,
      )
      .bind(
        input.nextAttemptAt.toISOString(),
        input.updatedAt.toISOString(),
        input.refundAttempt ? 1 : 0,
        ...leaseParameters(input.alert),
      )
      .run();
    return result.meta.changes === 1;
  }

  public async delete(alert: ClaimedAvailabilityAlert): Promise<boolean> {
    const result = await this.db
      .prepare(`DELETE FROM "AvailabilityAlert" ${leaseGuardSql}`)
      .bind(...leaseParameters(alert))
      .run();
    return result.meta.changes === 1;
  }
}

function leaseParameters(alert: ClaimedAvailabilityAlert) {
  return [alert.id, alert.attemptCount, alert.leaseUntil.toISOString()];
}

function mapAlert(row: AlertRow): ClaimedAvailabilityAlert {
  return {
    id: row.id,
    variantId: parseVariantId(row.variantId),
    email: row.email,
    attemptCount: row.attemptCount,
    leaseUntil: new Date(row.leaseUntil),
    createdAt: new Date(row.createdAt),
  };
}
