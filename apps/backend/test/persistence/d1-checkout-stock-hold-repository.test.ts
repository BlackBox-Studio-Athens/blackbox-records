import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import {
  createCartQuantity,
  parseCheckoutSessionId,
  parseStoreItemSlug,
  parseStripePriceId,
  parseVariantId,
} from '../../src/domain/commerce';
import { D1CheckoutStockHoldRepository } from '../../src/infrastructure/persistence/d1-checkout-stock-hold-repository';

describe('D1CheckoutStockHoldRepository', () => {
  it('lets exactly one concurrent checkout hold win the final unit', async () => {
    const variantId = parseVariantId(`variant_hold_race_${crypto.randomUUID()}`);
    const repository = new D1CheckoutStockHoldRepository(env.COMMERCE_DB);
    await seedStock(variantId, 1);
    const createdAt = new Date('2026-08-31T20:00:00.000Z');
    const checkoutExpiresAt = new Date('2026-08-31T20:30:00.000Z');
    const createHold = (orderId: string) =>
      repository.createPendingHold({
        checkoutExpiresAt,
        createdAt,
        lines: [
          {
            quantity: createCartQuantity(1),
            storeItemSlug: parseStoreItemSlug('hold-race-item'),
            stripePriceId: parseStripePriceId('price_test_hold_race'),
            variantId,
          },
        ],
        orderId,
      });

    const results = await Promise.all([createHold(crypto.randomUUID()), createHold(crypto.randomUUID())]);

    expect(results.map((result) => result.kind).sort()).toEqual(['created', 'unavailable']);
    expect(await repository.findEffectiveAvailability(variantId)).toBe(0);
  });

  it('commits no order or line when one cart line is unavailable', async () => {
    const availableVariantId = parseVariantId(`variant_hold_available_${crypto.randomUUID()}`);
    const unavailableVariantId = parseVariantId(`variant_hold_unavailable_${crypto.randomUUID()}`);
    const repository = new D1CheckoutStockHoldRepository(env.COMMERCE_DB);
    await seedStock(availableVariantId, 2);
    await seedStock(unavailableVariantId, 0);
    const orderId = crypto.randomUUID();

    await expect(
      repository.createPendingHold({
        checkoutExpiresAt: new Date('2026-08-31T21:30:00.000Z'),
        createdAt: new Date('2026-08-31T21:00:00.000Z'),
        lines: [
          {
            quantity: createCartQuantity(1),
            storeItemSlug: parseStoreItemSlug('hold-available-item'),
            stripePriceId: parseStripePriceId('price_test_hold_available'),
            variantId: availableVariantId,
          },
          {
            quantity: createCartQuantity(1),
            storeItemSlug: parseStoreItemSlug('hold-unavailable-item'),
            stripePriceId: parseStripePriceId('price_test_hold_unavailable'),
            variantId: unavailableVariantId,
          },
        ],
        orderId,
      }),
    ).resolves.toEqual({ kind: 'unavailable' });

    expect(
      await env.COMMERCE_DB.prepare('SELECT COUNT(*) AS "count" FROM "CheckoutOrder" WHERE "id" = ?')
        .bind(orderId)
        .first<{ count: number }>(),
    ).toEqual({ count: 0 });
    expect(
      await env.COMMERCE_DB.prepare('SELECT COUNT(*) AS "count" FROM "CheckoutOrderLine" WHERE "orderId" = ?')
        .bind(orderId)
        .first<{ count: number }>(),
    ).toEqual({ count: 0 });
  });

  it('binds one provider session and releases only a sessionless hold', async () => {
    const variantId = parseVariantId(`variant_hold_binding_${crypto.randomUUID()}`);
    const repository = new D1CheckoutStockHoldRepository(env.COMMERCE_DB);
    await seedStock(variantId, 2);
    const created = await repository.createPendingHold({
      checkoutExpiresAt: new Date('2026-08-31T22:30:00.000Z'),
      createdAt: new Date('2026-08-31T22:00:00.000Z'),
      lines: [
        {
          quantity: createCartQuantity(1),
          storeItemSlug: parseStoreItemSlug('hold-binding-item'),
          stripePriceId: parseStripePriceId('price_test_hold_binding'),
          variantId,
        },
      ],
      orderId: crypto.randomUUID(),
    });

    expect(created.kind).toBe('created');
    if (created.kind !== 'created') return;

    const boundAt = new Date('2026-08-31T22:01:00.000Z');
    const bound = await repository.bindCheckoutSession(
      created.hold,
      parseCheckoutSessionId('cs_test_hold_binding'),
      boundAt,
    );

    expect(bound).toMatchObject({ checkoutSessionId: 'cs_test_hold_binding', status: 'pending_payment' });
    await expect(repository.releaseSessionlessHold(created.hold, boundAt)).resolves.toBeNull();
  });

  it('lists only the five oldest expired bound holds and releases one with compare-and-set', async () => {
    const variantId = parseVariantId(`variant_hold_cleanup_${crypto.randomUUID()}`);
    const repository = new D1CheckoutStockHoldRepository(env.COMMERCE_DB);
    const now = new Date('2026-09-01T00:00:00.000Z');
    const expectedOrderIds: string[] = [];
    await seedStock(variantId, 6);

    for (let index = 0; index < 6; index += 1) {
      const createdAt = new Date(now.getTime() - (70 - index) * 60 * 1000);
      const orderId = crypto.randomUUID();
      const created = await repository.createPendingHold({
        checkoutExpiresAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
        createdAt,
        lines: [
          {
            quantity: createCartQuantity(1),
            storeItemSlug: parseStoreItemSlug('hold-cleanup-item'),
            stripePriceId: parseStripePriceId(`price_test_hold_cleanup_${index}`),
            variantId,
          },
        ],
        orderId,
      });
      expect(created.kind).toBe('created');
      if (created.kind !== 'created') continue;

      expectedOrderIds.push(orderId);
      await repository.bindCheckoutSession(
        created.hold,
        parseCheckoutSessionId(`cs_test_hold_cleanup_${index}`),
        createdAt,
      );
    }

    const candidates = await repository.listOldestExpiredSessionBoundHolds([variantId], now);

    expect(candidates.map((candidate) => candidate.id)).toEqual(expectedOrderIds.slice(0, 5));
    await expect(repository.releaseSessionBoundHold(candidates[0]!, now)).resolves.toBe(true);
    await expect(repository.releaseSessionBoundHold(candidates[0]!, now)).resolves.toBe(false);
    await expect(repository.findEffectiveAvailability(variantId)).resolves.toBe(1);
  });
});

async function seedStock(variantId: string, quantity: number): Promise<void> {
  const now = new Date('2026-08-31T19:00:00.000Z').toISOString();
  await env.COMMERCE_DB.prepare(
    'INSERT INTO "Stock" ("id", "variantId", "quantity", "onlineQuantity", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(crypto.randomUUID(), variantId, quantity, quantity, now, now)
    .run();
}
