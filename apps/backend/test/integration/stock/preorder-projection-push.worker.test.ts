import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPrismaClient } from '../../../src/infrastructure/persistence/prisma';
import { createHttpApp } from '../../../src/interfaces/http/app';
import { pushPreorderProjection } from '../../../src/interfaces/http/routes/preorder-projection-push';
import { openPreorderIdentity, type OpenPreorderProjection } from '../../../src/application/commerce/checkout/readers';
import { publicPreorderIdentity, publicPreorderProjectionSchema } from '../../../src/cms/public-preorder-projection';

const date = new Date('2020-01-01T00:00:00Z');

async function seedStockedPreorder(suffix: string) {
  const prisma = createPrismaClient({ COMMERCE_DB: env.COMMERCE_DB });
  const variantId = `variant_projection_${suffix}`;
  const storeItemSlug = `projection-${suffix}`;
  await prisma.storeItemOption.create({
    data: { variantId, storeItemSlug, sourceId: storeItemSlug, sourceKind: 'release' },
  });
  await prisma.storeOfferSnapshot.create({
    data: {
      storeItemSlug,
      variantId,
      amountMinor: 2800,
      currencyCode: 'EUR',
      priceActive: true,
      productActive: true,
      stripeLookupKey: `projection-${suffix}`,
      stripePriceId: `price_projection_${suffix}`,
      freshUntil: date,
      syncedAt: date,
    },
  });
  await prisma.stock.create({
    data: {
      variantId,
      quantity: 2,
      onlineQuantity: 2,
      zeroStockState: 'sold_out',
      preorderStartedAt: '2026-09-01T10:00:00.000Z',
      preorderShipDate: '2099-12-04',
    },
  });
  await prisma.itemAvailability.create({ data: { variantId, status: 'available', canBuy: true } });
  return {
    variantId,
    storeItemSlug,
    cleanup: async () => {
      await prisma.itemAvailability.deleteMany({ where: { variantId } });
      await prisma.stock.deleteMany({ where: { variantId } });
      await prisma.storeOfferSnapshot.deleteMany({ where: { variantId } });
      await prisma.storeItemOption.deleteMany({ where: { variantId } });
      await prisma.$disconnect();
    },
  };
}

afterEach(() => vi.restoreAllMocks());

describe('open pre-order projection push', () => {
  it('pushes a closed pre-order into Home offers, then the last copy selling into sold out', async () => {
    const seeded = await seedStockedPreorder(crypto.randomUUID());
    const projections: OpenPreorderProjection[] = [];
    const fetch = vi.fn(async (request: Request) => {
      projections.push((await request.json()) as OpenPreorderProjection);
      return Response.json({ changed: true });
    });
    const background: Promise<unknown>[] = [];
    const executionContext = {
      waitUntil: (work: Promise<unknown>) => background.push(work),
      passThroughOnException() {},
      props: {},
    } as unknown as ExecutionContext;
    const bindings = {
      ...env,
      PRODUCT_ENVIRONMENT: 'LOCAL' as const,
      LOCAL_OPERATOR_EMAIL: 'operator@example.com',
      PUBLIC_SITE: { fetch } as unknown as Fetcher,
    };
    try {
      await pushPreorderProjection(bindings);
      expect(projections[0]!.items.map((item) => item.storeItemSlug)).toContain(seeded.storeItemSlug);
      const close = await createHttpApp().request(
        `http://127.0.0.1/api/internal/variants/${seeded.variantId}/stock/preorder`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expectedRevision: 0, shipEstimate: null }),
        },
        bindings,
        executionContext,
      );
      expect(close.status).toBe(200);
      await Promise.all(background);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(projections[1]!.items.map((item) => item.storeItemSlug)).not.toContain(seeded.storeItemSlug);
      expect(projections[1]!.homeOffers).toContainEqual({
        storeItemSlug: seeded.storeItemSlug,
        availability: 'stocked',
        displayPrice: '€28.00',
      });
      const sale = await createHttpApp().request(
        `http://127.0.0.1/api/internal/variants/${seeded.variantId}/stock/changes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delta: -2, reason: 'show_sale' }),
        },
        bindings,
        executionContext,
      );
      expect(sale.status).toBe(200);
      await Promise.all(background);
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(projections[2]!.homeOffers).toContainEqual({
        storeItemSlug: seeded.storeItemSlug,
        availability: 'sold_out',
        displayPrice: '€28.00',
      });
      for (const projection of projections) {
        const parsed = publicPreorderProjectionSchema.parse(projection);
        expect(parsed).toEqual(projection);
        expect(await publicPreorderIdentity(parsed)).toBe(await openPreorderIdentity(projection));
      }
    } finally {
      await seeded.cleanup();
    }
  });

  it('posts the buyable pre-orders to the private renderer path', async () => {
    const seeded = await seedStockedPreorder(crypto.randomUUID());
    const fetch = vi.fn(async (_request: Request) => Response.json({ changed: true }));
    try {
      await pushPreorderProjection({ ...env, PRODUCT_ENVIRONMENT: 'LOCAL', PUBLIC_SITE: { fetch } as never });
      expect(fetch).toHaveBeenCalledOnce();
      const request = fetch.mock.calls[0]![0];
      expect(request.method).toBe('POST');
      expect(new URL(request.url).pathname).toBe('/__publication/preorders');
      const body = (await request.json()) as { items: { storeItemSlug: string }[] };
      expect(body.items).toContainEqual({
        storeItemSlug: seeded.storeItemSlug,
        displayPrice: '€28.00',
        shipEstimate: { kind: 'date', date: '2099-12-04' },
      });
    } finally {
      await seeded.cleanup();
    }
  });

  it('resolves and logs a redacted event when the renderer cannot be reached', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetch = vi.fn(async () => {
      throw new Error('connect failed for sk_test_secret buyer@example.com');
    });
    await expect(
      pushPreorderProjection({ ...env, PRODUCT_ENVIRONMENT: 'LOCAL', PUBLIC_SITE: { fetch } as never }),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
    const record = warn.mock.calls[0]![0];
    expect(record).toMatchObject({ event: 'preorder_projection_push', outcome: 'failed', retryable: true });
    expect(JSON.stringify(record)).not.toMatch(/sk_test|buyer@/);
  });

  it.each([
    ['reachable', async () => Response.json({ changed: true })],
    [
      'failing',
      async () => {
        throw new Error('renderer unavailable');
      },
    ],
  ])('pushes once after a staff pre-order write, with the same response when the renderer is %s', async (_c, impl) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const seeded = await seedStockedPreorder(crypto.randomUUID());
    const fetch = vi.fn(impl);
    const background: Promise<unknown>[] = [];
    const executionContext = {
      waitUntil: (work: Promise<unknown>) => background.push(work),
      passThroughOnException: () => {},
      props: {},
    } as unknown as ExecutionContext;
    try {
      const response = await createHttpApp().request(
        `http://127.0.0.1/api/internal/variants/${seeded.variantId}/stock/preorder`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ expectedRevision: 0, shipEstimate: { kind: 'month', month: '2099-11', part: null } }),
        },
        {
          COMMERCE_DB: env.COMMERCE_DB,
          PRODUCT_ENVIRONMENT: 'LOCAL',
          LOCAL_OPERATOR_EMAIL: 'operator@example.com',
          PUBLIC_SITE: { fetch },
        },
        executionContext,
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        stock: { preorder: { shipEstimate: { kind: 'month', month: '2099-11', part: null }, open: true } },
      });
      await Promise.all(background);
      expect(background).toHaveLength(1);
      expect(fetch).toHaveBeenCalledOnce();

      // A read is not a write and pushes nothing.
      await createHttpApp().request(
        `http://127.0.0.1/api/internal/variants/${seeded.variantId}/stock`,
        undefined,
        { COMMERCE_DB: env.COMMERCE_DB, PRODUCT_ENVIRONMENT: 'LOCAL', LOCAL_OPERATOR_EMAIL: 'operator@example.com' },
        executionContext,
      );
      expect(background).toHaveLength(1);
    } finally {
      await seeded.cleanup();
    }
  });
});
