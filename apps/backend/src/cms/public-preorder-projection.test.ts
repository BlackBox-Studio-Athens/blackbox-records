import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import {
  PublicPreorderStore,
  publicPreorderIdentity,
  publicPreorderProjectionSchema,
} from './public-preorder-projection';
import { acceptPublicPreorderProjection } from './public-publication-cache';
import { readHomeOffers, readOpenPreorders } from './published-preorders';
import { publishedContext } from './published-reader';

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
  homeOffers: [{ storeItemSlug: 'afterwise-vinyl', availability: 'stocked' as const, displayPrice: '€28.00' }],
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
  expect(
    publicPreorderProjectionSchema.safeParse({ items: [], homeOffers: Array(150).fill(projection.homeOffers[0]) })
      .success,
  ).toBe(true);
  expect(
    publicPreorderProjectionSchema.safeParse({ items: [], homeOffers: Array(151).fill(projection.homeOffers[0]) })
      .success,
  ).toBe(false);
  // Stock counts and other private fields are dropped, never stored or rendered.
  expect(
    publicPreorderProjectionSchema.parse({
      items: [{ storeItemSlug: 'a', displayPrice: '€1', shipEstimate: null, onlineQuantity: 3 }],
    }).items[0],
  ).not.toHaveProperty('onlineQuantity');
});

it('reads a legacy stored projection as no Home offers and exposes only the current render context', async () => {
  const { sql } = storage();
  const legacy = { items: projection.items };
  new PublicPreorderStore(sql).write(legacy, await publicPreorderIdentity(legacy));
  const stored = new PublicPreorderStore(sql).read()!;
  expect(publicPreorderProjectionSchema.safeParse(stored.projection).success).toBe(true);
  for (const preorders of [stored.projection, projection]) {
    publishedContext.run({ snapshot: { records: [], media: [] }, mediaBase: '', preorders }, () => {
      expect(readOpenPreorders()).toEqual(projection.items);
      expect(readHomeOffers()).toEqual(preorders.homeOffers ?? []);
    });
  }
  expect(readHomeOffers()).toEqual([]);
});

it('validates Home offers before changing storage', async () => {
  const { sql, writes } = storage();
  const store = new PublicPreorderStore(sql);
  const apply = async (value: typeof projection, identity: string) => [store.write(value, identity)];
  const send = (value: unknown) =>
    acceptPublicPreorderProjection(
      new Request('https://renderer/__publication/preorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      }),
      apply as Parameters<typeof acceptPublicPreorderProjection>[1],
      undefined,
      'local',
    );
  expect((await send(projection)).status).toBe(200);
  expect(await (await send(projection)).json()).toMatchObject({ changed: false });
  for (const offer of [
    { ...projection.homeOffers[0], storeItemSlug: 'Invalid Slug' },
    { ...projection.homeOffers[0], availability: 'coming_soon' },
    { ...projection.homeOffers[0], displayPrice: '' },
    { storeItemSlug: 'missing-price', availability: 'sold_out' },
  ])
    expect((await send({ items: [], homeOffers: [offer] })).status).toBe(400);
  expect(new PublicPreorderStore(sql).read()?.projection).toEqual(projection);
  expect(writes).toHaveLength(1);
  const parsed = publicPreorderProjectionSchema.parse({
    items: [],
    homeOffers: [
      {
        displayPrice: null,
        availability: 'sold_out',
        storeItemSlug: 'sold-out',
        onlineQuantity: 0,
        stripePriceId: 'private',
      },
    ],
  });
  expect(JSON.stringify(parsed)).toBe(
    '{"items":[],"homeOffers":[{"storeItemSlug":"sold-out","availability":"sold_out","displayPrice":null}]}',
  );
});
