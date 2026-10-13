import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import {
  PublicPreorderStore,
  publicPreorderIdentity,
  publicPreorderProjectionSchema,
} from './public-preorder-projection';

function storage() {
  const database = new DatabaseSync(':memory:');
  const writes: string[] = [];
  const sql = {
    exec(query: string, ...bindings: (string | number)[]) {
      const statement = database.prepare(query);
      if (/^\s*INSERT/i.test(query)) writes.push(query);
      const rows = statement.columns().length ? statement.all(...bindings) : (statement.run(...bindings), []);
      return { toArray: () => rows, one: () => rows[0] };
    },
  } as unknown as SqlStorage;
  return { sql, writes };
}

const projection = {
  items: [
    {
      storeItemSlug: 'lotus-vinyl',
      displayPrice: '€28.00',
      shipEstimate: { kind: 'month' as const, month: '2026-11', part: null },
    },
  ],
};

it('stores a changed projection once, survives a restart and writes nothing for an unchanged identity', async () => {
  const { sql, writes } = storage();
  const identity = await publicPreorderIdentity(projection);
  expect(new PublicPreorderStore(sql).read()).toBeNull();
  expect(new PublicPreorderStore(sql).write(projection, identity)).toBe(true);
  const restarted = new PublicPreorderStore(sql);
  expect(restarted.read()).toEqual({ projection, identity });
  expect(restarted.write(projection, identity)).toBe(false);
  expect(writes).toHaveLength(1);
  const empty = { items: [] };
  expect(restarted.write(empty, await publicPreorderIdentity(empty))).toBe(true);
  expect(new PublicPreorderStore(sql).read()?.projection).toEqual(empty);
});

it('accepts only bounded public projection fields, in the canonical commerce key order', async () => {
  const parsed = publicPreorderProjectionSchema.parse({
    items: [
      { shipEstimate: { part: 'late', month: '2026-11', kind: 'month' }, displayPrice: '€28.00', storeItemSlug: 'a' },
    ],
  });
  expect(JSON.stringify(parsed)).toBe(
    '{"items":[{"storeItemSlug":"a","displayPrice":"€28.00","shipEstimate":{"kind":"month","month":"2026-11","part":"late"}}]}',
  );
  for (const items of [
    [{ storeItemSlug: 'Lotus Vinyl', displayPrice: '€28.00', shipEstimate: null }],
    [{ storeItemSlug: 'a', displayPrice: '', shipEstimate: null }],
    [{ storeItemSlug: 'a', displayPrice: '€1', shipEstimate: { kind: 'date', date: '2026-02-30x' } }],
    Array.from({ length: 501 }, () => ({ storeItemSlug: 'a', displayPrice: '€1', shipEstimate: null })),
  ])
    expect(publicPreorderProjectionSchema.safeParse({ items }).success).toBe(false);
  // Stock counts and other private fields are dropped, never stored or rendered.
  expect(
    publicPreorderProjectionSchema.parse({
      items: [{ storeItemSlug: 'a', displayPrice: '€1', shipEstimate: null, onlineQuantity: 3 }],
    }).items[0],
  ).not.toHaveProperty('onlineQuantity');
});
