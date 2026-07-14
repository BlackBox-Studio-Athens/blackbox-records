import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { afterEach, describe, expect, it } from 'vitest';

const databases: DatabaseSync[] = [];

afterEach(() => {
  databases.splice(0).forEach((database) => database.close());
});

describe('Caregivers canonical ownership migration', () => {
  it('is idempotent and preserves historical evidence while retiring duplicate readiness', async () => {
    const database = new DatabaseSync(':memory:');
    databases.push(database);
    createSchema(database);
    seedDuplicateCaregiversState(database);

    const migration = await readFile(
      path.resolve(process.cwd(), 'prisma/migrations/0012_canonicalize_caregivers_store_item_ownership.sql'),
      'utf8',
    );
    database.exec(migration);
    database.exec(migration);

    expect(database.prepare('SELECT * FROM "StoreItemOption" ORDER BY "storeItemSlug"').all()).toEqual([
      expect.objectContaining({
        sourceId: 'chronoboros-caregivers-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'caregivers-vinyl',
        variantId: 'variant_caregivers-vinyl_standard',
      }),
    ]);
    expect(countRows(database, 'ItemAvailability')).toBe(1);
    expect(countRows(database, 'Stock')).toBe(1);
    expect(countRows(database, 'StoreOfferSnapshot')).toBe(1);
    expect(countRows(database, 'VariantStripeMapping')).toBe(1);
    expect(countRows(database, 'CheckoutOrder')).toBe(1);
    expect(countRows(database, 'CheckoutOrderLine')).toBe(1);
    expect(countRows(database, 'StockChange')).toBe(1);
    expect(countRows(database, 'StockCount')).toBe(1);
    expect(countRows(database, 'StripeCatalogWebhookEvent')).toBe(1);
  });
});

function createSchema(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE "StoreItemOption" (
      "id" TEXT PRIMARY KEY,
      "storeItemSlug" TEXT UNIQUE NOT NULL,
      "sourceKind" TEXT NOT NULL,
      "sourceId" TEXT NOT NULL,
      "variantId" TEXT UNIQUE NOT NULL,
      "updatedAt" TEXT NOT NULL,
      UNIQUE ("sourceKind", "sourceId")
    );
    CREATE TABLE "VariantStripeMapping" ("variantId" TEXT PRIMARY KEY);
    CREATE TABLE "ItemAvailability" ("variantId" TEXT PRIMARY KEY);
    CREATE TABLE "Stock" ("variantId" TEXT PRIMARY KEY);
    CREATE TABLE "StoreOfferSnapshot" ("storeItemSlug" TEXT UNIQUE, "variantId" TEXT UNIQUE);
    CREATE TABLE "CheckoutOrder" ("variantId" TEXT);
    CREATE TABLE "CheckoutOrderLine" ("variantId" TEXT);
    CREATE TABLE "StockChange" ("variantId" TEXT);
    CREATE TABLE "StockCount" ("variantId" TEXT);
    CREATE TABLE "StripeCatalogWebhookEvent" ("variantId" TEXT);
  `);
}

function seedDuplicateCaregiversState(database: DatabaseSync): void {
  const canonicalVariant = 'variant_caregivers-vinyl_standard';
  const duplicateVariant = 'variant_chronoboros-caregivers-vinyl_standard';
  database.exec(`
    INSERT INTO "StoreItemOption" VALUES
      ('canonical', 'caregivers-vinyl', 'release', 'caregivers', '${canonicalVariant}', CURRENT_TIMESTAMP),
      ('duplicate', 'chronoboros-caregivers-vinyl', 'distro', 'chronoboros-caregivers-vinyl', '${duplicateVariant}', CURRENT_TIMESTAMP);
    INSERT INTO "VariantStripeMapping" VALUES ('${canonicalVariant}'), ('${duplicateVariant}');
    INSERT INTO "ItemAvailability" VALUES ('${canonicalVariant}'), ('${duplicateVariant}');
    INSERT INTO "Stock" VALUES ('${canonicalVariant}'), ('${duplicateVariant}');
    INSERT INTO "StoreOfferSnapshot" VALUES
      ('caregivers-vinyl', '${canonicalVariant}'),
      ('chronoboros-caregivers-vinyl', '${duplicateVariant}');
    INSERT INTO "CheckoutOrder" VALUES ('${duplicateVariant}');
    INSERT INTO "CheckoutOrderLine" VALUES ('${duplicateVariant}');
    INSERT INTO "StockChange" VALUES ('${duplicateVariant}');
    INSERT INTO "StockCount" VALUES ('${duplicateVariant}');
    INSERT INTO "StripeCatalogWebhookEvent" VALUES ('${duplicateVariant}');
  `);
}

function countRows(database: DatabaseSync, table: string): number {
  return Number((database.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get() as { count: number }).count);
}
