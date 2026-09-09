import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';

it('adds revision zero to existing stock without rewriting quantities or audit history', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(
      readFileSync(new URL('../../prisma/migrations/0002_add_internal_stock_ledger.sql', import.meta.url), 'utf8'),
    );
    db.exec(`INSERT INTO Stock (id, variantId, quantity, onlineQuantity, updatedAt)
      VALUES ('stock_old', 'variant_old', 5, 3, '2026-09-01');
      INSERT INTO StockChange (id, variantId, quantityDelta, reason, actorEmail)
      VALUES ('change_old', 'variant_old', 5, 'delivery', 'operator@example.com');`);
    db.exec(readFileSync(new URL('../../prisma/migrations/0016_stock_revision.sql', import.meta.url), 'utf8'));
    expect(db.prepare('SELECT quantity, onlineQuantity, revision FROM Stock').get()).toEqual({
      quantity: 5,
      onlineQuantity: 3,
      revision: 0,
    });
    expect(db.prepare('SELECT id FROM StockChange').get()).toEqual({ id: 'change_old' });
    expect(() => db.exec('UPDATE Stock SET revision = -1')).toThrow();
    expect(() => db.exec('UPDATE Stock SET onlineQuantity = 6')).toThrow();
    expect(() =>
      db.exec(`INSERT INTO Stock (id, variantId, quantity, onlineQuantity, updatedAt)
      VALUES ('bad', 'variant_bad', -1, 0, '2026-09-01')`),
    ).toThrow();
  } finally {
    db.close();
  }
});
