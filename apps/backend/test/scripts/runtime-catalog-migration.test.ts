import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';

it('extends the operation kind without losing historical receipts, claims or the unresolved-variant guard', () => {
  const db = new DatabaseSync(':memory:');
  try {
    const migration = (name: string) =>
      db.exec(readFileSync(new URL(`../../prisma/migrations/${name}`, import.meta.url), 'utf8'));
    migration('0021_catalog_operation.sql');
    migration('0022_item_publication_operation.sql');
    db.exec(`INSERT INTO CatalogOperation (id, kind, inputFingerprint, actorEmail, variantId, expectedRevision, step, status, results)
      VALUES ('receipt', 'price_change', 'shape_old', 'operator@example.com', 'variant_history', 1, 'completed', 'completed', '{"stripePriceId":"price_old"}');
      INSERT INTO CatalogOperation (id, kind, inputFingerprint, actorEmail, variantId, expectedRevision, claimToken, leaseUntil)
      VALUES ('pending', 'item_publish', 'shape_pending', 'operator@example.com', 'variant_pending', 2, 'claim', '2026-09-22');`);
    const original = db.prepare('SELECT * FROM CatalogOperation ORDER BY id').all();
    migration('0024_price_initialization_operation.sql');
    expect(db.prepare('SELECT * FROM CatalogOperation ORDER BY id').all()).toEqual(original);
    const insert =
      db.prepare(`INSERT INTO CatalogOperation (id, kind, inputFingerprint, actorEmail, variantId, expectedRevision)
      VALUES (?, 'price_initialize', 'shape_new', 'operator@example.com', ?, 0)`);
    insert.run('initial', 'variant_initial');
    expect(() => insert.run('competing', 'variant_initial')).toThrow();
    expect(() => insert.run('blocked', 'variant_pending')).toThrow();
  } finally {
    db.close();
  }
});

it('adds catalog fields without rewriting existing identity, provider mapping, or availability', () => {
  const db = new DatabaseSync(':memory:');
  try {
    const migration = (name: string) =>
      db.exec(readFileSync(new URL(`../../prisma/migrations/${name}`, import.meta.url), 'utf8'));
    migration('0001_initial_commerce_state.sql');
    db.exec(`INSERT INTO StoreItemOption (id, storeItemSlug, sourceKind, sourceId, variantId, updatedAt)
      VALUES ('existing', 'existing-item', 'release', 'existing-source', 'existing-variant', '2026-09-01');
      INSERT INTO VariantStripeMapping (id, variantId, stripePriceId, updatedAt)
      VALUES ('mapping', 'existing-variant', 'price_existing', '2026-09-01');
      INSERT INTO ItemAvailability (id, variantId, status, canBuy, updatedAt)
      VALUES ('availability', 'existing-variant', 'available', 0, '2026-09-01');`);
    const original = db.prepare('SELECT * FROM StoreItemOption').get();
    const mapping = db.prepare('SELECT * FROM VariantStripeMapping').get();
    const availability = db.prepare('SELECT * FROM ItemAvailability').get();
    migration('0020_runtime_catalog_fields.sql');
    expect(db.prepare('SELECT * FROM StoreItemOption').get()).toEqual({
      ...original,
      cmsSourceId: null,
      itemType: null,
      priceKind: null,
      productProjection: null,
      catalogAvailability: 'withheld',
      catalogRevision: 0,
    });
    expect(db.prepare('SELECT * FROM VariantStripeMapping').get()).toEqual(mapping);
    expect(db.prepare('SELECT * FROM ItemAvailability').get()).toEqual(availability);
    for (const assignment of [
      "cmsSourceId = ' '",
      "itemType = ''",
      "priceKind = 'unsupported'",
      "productProjection = 'not-json'",
      "productProjection = '[]'",
      "catalogAvailability = 'unknown'",
      'catalogRevision = -1',
      'catalogRevision = 0.5',
    ])
      expect(() => db.exec(`UPDATE StoreItemOption SET ${assignment}`)).toThrow();
  } finally {
    db.close();
  }
});
