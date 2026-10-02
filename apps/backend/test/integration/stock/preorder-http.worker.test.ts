import { env } from 'cloudflare:workers';
import { expect, it, vi } from 'vitest';

import { createPrismaClient } from '../../../src/infrastructure/persistence/prisma';
import { createHttpApp } from '../../../src/interfaces/http/app';

it('runs the protected pre-order lifecycle through HTTP and D1 with no quantity or history writes', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-02T10:00:00Z'));
  const prisma = createPrismaClient({ COMMERCE_DB: env.COMMERCE_DB });
  const variantId = `variant_preorder_http_${crypto.randomUUID()}`;
  const app = createHttpApp();
  const bindings = {
    COMMERCE_DB: env.COMMERCE_DB,
    PRODUCT_ENVIRONMENT: 'LOCAL' as const,
    LOCAL_OPERATOR_EMAIL: 'operator@example.com',
  };
  const url = `http://127.0.0.1/api/internal/variants/${variantId}/stock`;
  const write = (expectedRevision: number | null, shipEstimate: unknown) =>
    app.request(
      `${url}/preorder`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ expectedRevision, shipEstimate }),
      },
      bindings,
    );
  try {
    await prisma.storeItemOption.create({
      data: {
        id: variantId,
        variantId,
        storeItemSlug: variantId.replaceAll('_', '-'),
        sourceId: variantId,
        sourceKind: 'distro',
      },
    });
    const month = { kind: 'month', month: '2026-10', part: null };
    const response = await write(null, month);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const start = (await response.json()) as { stock: { revision: number; preorder: { startedAt: string } } };
    expect(start).toMatchObject({
      stock: {
        revision: 0,
        quantity: 0,
        onlineQuantity: 0,
        preorder: { shipEstimate: month, startedAt: '2026-10-02T10:00:00.000Z', open: true },
      },
    });
    expect((await write(0, month)).status).toBe(200);
    expect((await prisma.stock.findUnique({ where: { variantId } }))?.revision).toBe(0);
    expect((await write(null, month)).status).toBe(409);
    for (const estimate of [
      { kind: 'month', month: '2026-09', part: null },
      { kind: 'date', date: '2026-10-02' },
      { kind: 'date', date: '2026-02-30' },
      {},
    ])
      expect((await write(0, estimate)).status).toBe(400);
    expect((await write(0, { kind: 'date', date: '2026-10-20' })).status).toBe(200);
    expect((await prisma.stock.findUnique({ where: { variantId } }))?.preorderStartedAt).toBe(
      start.stock.preorder.startedAt,
    );
    vi.setSystemTime(new Date('2026-10-19T21:30:00Z')); // 20 October in Athens.
    const closed = await app.request(url, undefined, bindings);
    expect(await closed.json()).toMatchObject({ stock: { preorder: { open: false } } });
    const restart = await write(1, { kind: 'month', month: '2026-11', part: 'late' });
    expect(restart.status).toBe(200);
    expect(await restart.json()).toMatchObject({
      stock: {
        revision: 2,
        preorder: { startedAt: '2026-10-19T21:30:00.000Z', open: true },
      },
    });
    expect((await write(2, null)).status).toBe(200);
    expect((await write(3, null)).status).toBe(200);
    expect(await prisma.stock.findUnique({ where: { variantId } })).toMatchObject({
      revision: 3,
      quantity: 0,
      onlineQuantity: 0,
      preorderStartedAt: null,
      preorderShipMonth: null,
      preorderShipPart: null,
      preorderShipDate: null,
    });
    expect(await prisma.stockChange.count({ where: { variantId } })).toBe(0);
    expect(await prisma.stockCount.count({ where: { variantId } })).toBe(0);
    const denied = await app.request(
      `${url}/preorder`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ expectedRevision: 3, shipEstimate: month }),
      },
      {
        ...bindings,
        PRODUCT_ENVIRONMENT: 'UAT',
        LOCAL_OPERATOR_EMAIL: undefined,
        CF_ACCESS_POLICY_AUD: 'operator-audience',
        CF_ACCESS_TEAM_DOMAIN: 'https://blackbox.cloudflareaccess.com',
      },
    );
    expect(denied.status).toBe(401);
  } finally {
    await prisma.stock.deleteMany({ where: { variantId } });
    await prisma.storeItemOption.deleteMany({ where: { variantId } });
    await prisma.$disconnect();
    vi.useRealTimers();
  }
});
