import { expect, test } from 'vitest';
import type { PluginContext } from 'emdash/plugin';
import plugin from './editorial-plugin';
import { priceDraftRoute, readPriceDrafts } from './price-drafts';

function memoryKv() {
  const store = new Map<string, { value: unknown; revision: string }>();
  let sequence = 0;
  return {
    store,
    async get(key: string) {
      return store.get(key)?.value ?? null;
    },
    async getVersioned(key: string) {
      return store.get(key) ?? null;
    },
    async compareAndSet(key: string, expected: string | null, value: unknown) {
      if ((store.get(key)?.revision ?? null) !== expected) return { applied: false as const };
      const revision = `r${++sequence}`;
      store.set(key, { value, revision });
      return { applied: true as const, revision };
    },
    async compareAndDelete(key: string, expected: string) {
      if (store.get(key)?.revision !== expected) return { applied: false };
      store.delete(key);
      return { applied: true };
    },
    async set(key: string, value: unknown) {
      store.set(key, { value, revision: `r${++sequence}` });
    },
    async delete(key: string) {
      return store.delete(key);
    },
    async list(prefix = '') {
      return [...store].filter(([key]) => key.startsWith(prefix)).map(([key, entry]) => ({ key, value: entry.value }));
    },
  };
}

const route = plugin.routes[priceDraftRoute] as {
  handler: (routeCtx: unknown, ctx: PluginContext) => Promise<unknown>;
};
const draft = {
  collection: 'releases',
  recordId: 'low-tide',
  price: { kind: 'fixed', currencyCode: 'EUR', amountMinor: 2400 },
  liveAmountWhenStaged: 2200,
  attempt: null,
};
const call = (ctx: PluginContext, method: string, input: unknown) =>
  route.handler(
    { input, request: { url: 'https://staff.invalid', method, headers: {} }, user: { email: 'member@example.com' } },
    ctx,
  );

test('price drafts save, list, conflict and delete through plugin KV', async () => {
  const kv = memoryKv();
  const ctx = { kv } as unknown as PluginContext;
  const saved = (await call(ctx, 'PUT', { draft, revision: null })) as {
    item: { revision: string; updatedBy: string };
  };
  expect(saved.item).toMatchObject({ ...draft, updatedBy: 'member@example.com' });
  await expect(call(ctx, 'PUT', { draft, revision: null })).rejects.toMatchObject({ status: 409 });
  const one = (await call(ctx, 'GET', { collection: 'releases', id: 'low-tide' })) as {
    items: { revision: string }[];
  };
  expect(one.items[0]?.revision).toBe(saved.item.revision);
  const listed = (await call(ctx, 'GET', {})) as { items: { revision: string }[] };
  expect(listed.items).toHaveLength(1);
  expect(listed.items[0]?.revision, 'Listed drafts carry revisions so editors can save over them').toBe(
    saved.item.revision,
  );
  await expect(
    call(ctx, 'DELETE', { collection: 'releases', recordId: 'low-tide', revision: 'stale' }),
  ).rejects.toMatchObject({ status: 409 });
  await call(ctx, 'DELETE', { collection: 'releases', recordId: 'low-tide', revision: saved.item.revision });
  expect(kv.store.size).toBe(0);
});

test('price drafts reject invalid shapes, provider fields and inverted pay-what-you-want ranges', async () => {
  const ctx = { kv: memoryKv() } as unknown as PluginContext;
  for (const invalid of [
    { ...draft, collection: 'news' },
    { ...draft, price: { ...draft.price, currencyCode: 'USD' } },
    { ...draft, price: { ...draft.price, amountMinor: 24.5 } },
    { ...draft, stripePriceId: 'price_123' },
    { ...draft, attempt: { command: 'change', operationId: 'not-a-uuid', expectedRevision: 3 } },
    {
      ...draft,
      attempt: { command: 'initialize', operationId: '6f9f3a8e-1c4b-4b4e-9a53-3a0f7f1b2c3d', expectedRevision: 3 },
    },
    {
      ...draft,
      price: {
        kind: 'pay_what_you_want',
        currencyCode: 'EUR',
        minimumAmountMinor: 900,
        presetAmountMinor: 500,
        maximumAmountMinor: 2000,
      },
    },
  ])
    await expect(call(ctx, 'PUT', { draft: invalid, revision: null })).rejects.toMatchObject({ status: 400 });
  await expect(call(ctx, 'GET', { collection: 'releases' })).rejects.toMatchObject({ status: 400 });
});

test('deleting a record removes its price draft', async () => {
  const kv = memoryKv();
  const ctx = { kv } as unknown as PluginContext;
  await call(ctx, 'PUT', { draft, revision: null });
  await plugin.hooks['content:afterDelete']({ collection: 'releases', id: 'low-tide', permanent: false }, ctx);
  expect(kv.store.size).toBe(0);
});

test('workspace discovery reads drafts through the plugin route', async () => {
  const kv = memoryKv();
  const ctx = { kv } as unknown as PluginContext;
  await call(ctx, 'PUT', { draft, revision: null });
  const runtime = {
    handlePluginApiRoute: async (pluginId: string, method: string, path: string, request: Request) => {
      expect([pluginId, method, path, new URL(request.url).pathname]).toEqual([
        'blackbox-editorial',
        'GET',
        'price-drafts',
        '/_emdash/api/plugins/blackbox-editorial/price-drafts',
      ]);
      return { success: true, data: await call(ctx, 'GET', {}) };
    },
  };
  expect(await readPriceDrafts(runtime as never, 'https://staff.invalid')).toMatchObject([draft]);
});
