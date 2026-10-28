import type {
  MerchantCatalogItem,
  MerchantManagedOffer,
  MerchantRunClaim,
  MerchantScope,
  MerchantSyncRepository,
} from '../../application/commerce/merchant-sync';

const INTERVAL_MS = 15 * 60 * 1000;
const LEASE_MS = 10 * 60 * 1000;
const scopeKey = (scope: MerchantScope) => JSON.stringify([scope.environment, scope.accountId, scope.dataSourceId]);
const currentClaim = 'EXISTS (SELECT 1 FROM "MerchantSyncRun" WHERE "scope" = ? AND "token" = ? AND "leaseUntil" > ?)';

export class D1MerchantSyncRepository implements MerchantSyncRepository {
  constructor(private readonly db: D1Database) {}

  async claimRun(scope: MerchantScope, now: Date): Promise<MerchantRunClaim | null> {
    const token = crypto.randomUUID();
    const row = await this.db
      .prepare(
        `INSERT INTO "MerchantSyncRun" ("scope", "token", "leaseUntil", "nextRunAt") VALUES (?, ?, ?, ?)
       ON CONFLICT ("scope") DO UPDATE SET "token" = excluded."token", "leaseUntil" = excluded."leaseUntil",
         "nextRunAt" = excluded."nextRunAt"
       WHERE "MerchantSyncRun"."nextRunAt" <= ?
         AND ("MerchantSyncRun"."leaseUntil" IS NULL OR "MerchantSyncRun"."leaseUntil" <= ?)
       RETURNING "cursor", "quotaBlocked"`,
      )
      .bind(
        scopeKey(scope),
        token,
        new Date(now.getTime() + LEASE_MS).toISOString(),
        // Clock slots keep delivery jitter from skipping the next scheduled pass.
        new Date((Math.floor(now.getTime() / INTERVAL_MS) + 1) * INTERVAL_MS).toISOString(),
        now.toISOString(),
        now.toISOString(),
      )
      .first<{ cursor: string | null; quotaBlocked: number }>();
    return row ? { scope, token, cursor: row.cursor, quotaBlocked: row.quotaBlocked === 1 } : null;
  }

  async listManaged(claim: MerchantRunClaim): Promise<MerchantManagedOffer[]> {
    const rows = await this.db
      .prepare(
        'SELECT "variantId", "storeItemSlug", "inputHash", "submittedAt" FROM "MerchantManagedOffer" WHERE "scope" = ? ORDER BY "variantId" LIMIT 1001',
      )
      .bind(scopeKey(claim.scope))
      .all<MerchantManagedOffer>();
    if (rows.results.length > 1000) throw new Error('Managed Merchant inventory exceeds the scan limit.');
    return rows.results;
  }

  async isClaimCurrent(claim: MerchantRunClaim, now: Date): Promise<boolean> {
    const row = await this.db
      .prepare(`SELECT ${currentClaim} AS "current"`)
      .bind(scopeKey(claim.scope), claim.token, now.toISOString())
      .first<{ current: number }>();
    return row?.current === 1;
  }

  async manageOffer(claim: MerchantRunClaim, item: MerchantCatalogItem, now: Date): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT INTO "MerchantManagedOffer" ("scope", "variantId", "storeItemSlug")
       SELECT ?, ?, ? WHERE ${currentClaim}
       ON CONFLICT ("scope", "variantId") DO UPDATE SET "storeItemSlug" = excluded."storeItemSlug", "inputHash" = NULL`,
      )
      .bind(
        scopeKey(claim.scope),
        item.variantId,
        item.storeItemSlug,
        scopeKey(claim.scope),
        claim.token,
        now.toISOString(),
      )
      .run();
    return result.meta.changes === 1;
  }

  async saveSubmitted(claim: MerchantRunClaim, variantId: string, inputHash: string, now: Date): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE "MerchantManagedOffer" SET "inputHash" = ?, "submittedAt" = ?
       WHERE "scope" = ? AND "variantId" = ? AND ${currentClaim}`,
      )
      .bind(
        inputHash,
        now.toISOString(),
        scopeKey(claim.scope),
        variantId,
        scopeKey(claim.scope),
        claim.token,
        now.toISOString(),
      )
      .run();
    return result.meta.changes === 1;
  }

  async removeManaged(claim: MerchantRunClaim, variantId: string, now: Date): Promise<boolean> {
    const result = await this.db
      .prepare(`DELETE FROM "MerchantManagedOffer" WHERE "scope" = ? AND "variantId" = ? AND ${currentClaim}`)
      .bind(scopeKey(claim.scope), variantId, scopeKey(claim.scope), claim.token, now.toISOString())
      .run();
    return result.meta.changes === 1;
  }

  async finishRun(claim: MerchantRunClaim, cursor: string | null, now: Date): Promise<boolean> {
    const result = await this.db
      .prepare(
        'UPDATE "MerchantSyncRun" SET "cursor" = ?, "leaseUntil" = NULL WHERE "scope" = ? AND "token" = ? AND "leaseUntil" > ?',
      )
      .bind(cursor, scopeKey(claim.scope), claim.token, now.toISOString())
      .run();
    return result.meta.changes === 1;
  }

  async clearQuotaBlock(claim: MerchantRunClaim, now: Date): Promise<boolean> {
    const result = await this.db
      .prepare('UPDATE "MerchantSyncRun" SET "quotaBlocked" = 0 WHERE "scope" = ? AND "token" = ? AND "leaseUntil" > ?')
      .bind(scopeKey(claim.scope), claim.token, now.toISOString())
      .run();
    return result.meta.changes === 1;
  }

  async deferQuota(claim: MerchantRunClaim, nextReset: Date, now: Date): Promise<boolean> {
    const result = await this.db
      .prepare(
        'UPDATE "MerchantSyncRun" SET "quotaBlocked" = 1, "nextRunAt" = MAX("nextRunAt", ?) WHERE "scope" = ? AND "token" = ? AND "leaseUntil" > ?',
      )
      .bind(nextReset.toISOString(), scopeKey(claim.scope), claim.token, now.toISOString())
      .run();
    return result.meta.changes === 1;
  }
}
