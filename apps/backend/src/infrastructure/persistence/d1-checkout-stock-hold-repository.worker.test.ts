import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import {
  createCartQuantity,
  parseCheckoutSessionId,
  parseStoreItemSlug,
  parseStripePriceId,
  parseVariantId,
} from '../../domain/commerce';
import { D1CheckoutStockHoldRepository } from './d1-checkout-stock-hold-repository';
import { createPrismaClient, PrismaOrderStateRepository } from './prisma';

describe('D1CheckoutStockHoldRepository', () => {
  it.each([null, { kind: 'month', month: '2026-11', part: 'late' }, { kind: 'date', date: '2026-11-20' }] as const)(
    'persists and rereads the immutable pre-order snapshot (%j)',
    async (shipEstimate) => {
      const variantId = parseVariantId(`variant_preorder_hold_${crypto.randomUUID()}`);
      await seedStock(variantId, 3);
      const repository = new D1CheckoutStockHoldRepository(env.COMMERCE_DB);
      const preorder = { startedAt: '2026-09-01T10:00:00.000Z', shipEstimate };
      const requestIdentity = {
        keyDigest: crypto.randomUUID().replaceAll('-', '').repeat(2),
        productEnvironment: 'LOCAL',
        requestFingerprint: crypto.randomUUID().replaceAll('-', '').repeat(2),
      };
      const result = await repository.createPendingHold({
        orderId: crypto.randomUUID(),
        createdAt: new Date('2026-10-02T10:00:00Z'),
        checkoutExpiresAt: new Date('2026-10-02T10:30:00Z'),
        requestIdentity,
        lines: [
          {
            displayName: 'Pre-order record',
            lineAmountMinor: 2500,
            optionLabel: null,
            quantity: createCartQuantity(1),
            storeItemSlug: parseStoreItemSlug('preorder-record'),
            stripePriceId: parseStripePriceId('price_preorder_record'),
            unitAmountMinor: 2500,
            variantId,
            preorder,
          },
        ],
      });
      expect(result.kind).toBe('created');
      if (result.kind !== 'created') throw new Error('Expected a checkout hold');
      expect(result.hold.lines[0]?.preorder).toEqual(preorder);
      expect((await repository.findByRequestIdentity(requestIdentity))?.lines[0]?.preorder).toEqual(preorder);
      const columns = await env.COMMERCE_DB.prepare(
        'SELECT "preorderStartedAt", "preorderShipMonth", "preorderShipPart", "preorderShipDate" FROM "CheckoutOrderLine" WHERE "orderId" = ?',
      )
        .bind(result.hold.id)
        .first();
      expect(columns).toEqual({
        preorderStartedAt: preorder.startedAt,
        preorderShipMonth: shipEstimate?.kind === 'month' ? shipEstimate.month : null,
        preorderShipPart: shipEstimate?.kind === 'month' ? shipEstimate.part : null,
        preorderShipDate: shipEstimate?.kind === 'date' ? shipEstimate.date : null,
      });
      const prisma = createPrismaClient({ COMMERCE_DB: env.COMMERCE_DB });
      const orders = new PrismaOrderStateRepository(prisma);
      try {
        await env.COMMERCE_DB.prepare(
          'UPDATE "Stock" SET "preorderStartedAt" = ?, "preorderShipMonth" = ? WHERE "variantId" = ?',
        )
          .bind('2026-10-01T10:00:00.000Z', '2026-12', variantId)
          .run();
        expect((await orders.findById(result.hold.id))?.lines?.[0]?.preorder).toEqual(preorder);
        expect(
          (await orders.listRecent({ limit: 100 })).find((order) => order.id === result.hold.id)?.lines?.[0]?.preorder,
        ).toEqual(preorder);
        expect((await repository.findByRequestIdentity(requestIdentity))?.lines[0]?.preorder).toEqual(preorder);
        const sessionId = parseCheckoutSessionId(`cs_preorder_${crypto.randomUUID()}`);
        const created = await orders.createPending({
          checkoutSessionId: sessionId,
          createdAt: result.hold.createdAt,
          shippingLocker: null,
          storeItemSlug: result.hold.storeItemSlug,
          variantId,
          lines: result.hold.lines,
        });
        expect(created.lines?.[0]?.preorder).toEqual(preorder);
        expect((await orders.findByCheckoutSessionId(sessionId))?.lines?.[0]?.preorder).toEqual(preorder);
      } finally {
        await prisma.$disconnect();
      }
    },
  );
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
            displayName: 'Hold race item',
            lineAmountMinor: 2500,
            optionLabel: null,
            quantity: createCartQuantity(1),
            storeItemSlug: parseStoreItemSlug('hold-race-item'),
            stripePriceId: parseStripePriceId('price_test_hold_race'),
            unitAmountMinor: 2500,
            variantId,
          },
        ],
        orderId,
      });

    const results = await Promise.all([createHold(crypto.randomUUID()), createHold(crypto.randomUUID())]);

    expect(results.map((result) => result.kind).sort()).toEqual(['created', 'unavailable']);
    expect(await repository.findEffectiveAvailability(variantId)).toBe(0);
    await expect(
      env.COMMERCE_DB.prepare(
        'SELECT "displayName", "optionLabel", "unitAmountMinor", "lineAmountMinor" FROM "CheckoutOrderLine" WHERE "variantId" = ?',
      )
        .bind(variantId)
        .first(),
    ).resolves.toEqual({
      displayName: 'Hold race item',
      lineAmountMinor: 2500,
      optionLabel: null,
      unitAmountMinor: 2500,
    });
  });

  it('returns one durable hold for concurrent keyed checkout starts', async () => {
    const variantId = parseVariantId(`variant_hold_idempotency_${crypto.randomUUID()}`);
    const repository = new D1CheckoutStockHoldRepository(env.COMMERCE_DB);
    await seedStock(variantId, 2);
    const requestIdentity = {
      keyDigest: 'a'.repeat(64),
      productEnvironment: 'LOCAL',
      requestFingerprint: 'b'.repeat(64),
    };
    const createHold = (orderId: string) =>
      repository.createPendingHold({
        checkoutCancelUrl: 'https://example.com/checkout',
        checkoutExpiresAt: new Date('2026-08-31T20:30:00.000Z'),
        createdAt: new Date('2026-08-31T20:00:00.000Z'),
        checkoutSuccessUrl: 'https://example.com/return',
        lines: [
          {
            displayName: 'Keyed hold item',
            lineAmountMinor: 2500,
            optionLabel: null,
            quantity: createCartQuantity(1),
            storeItemSlug: parseStoreItemSlug('keyed-hold-item'),
            stripePriceId: parseStripePriceId('price_test_keyed_hold'),
            unitAmountMinor: 2500,
            variantId,
          },
        ],
        monetaryPolicy: {
          acceptedDeliveryAmountMinor: 250,
          acceptedParcelTier: 'small',
          monetaryPolicyReference: 'test-inclusive-v1',
        },
        orderId,
        requestIdentity,
      });

    const results = await Promise.all([createHold(crypto.randomUUID()), createHold(crypto.randomUUID())]);
    const created = results.find((result) => result.kind === 'created');
    const existing = results.find((result) => result.kind === 'existing');

    expect(created?.kind).toBe('created');
    expect(existing?.kind).toBe('existing');
    if (created?.kind !== 'created' || existing?.kind !== 'existing') return;

    expect(existing.attempt.id).toBe(created.hold.id);
    await expect(
      env.COMMERCE_DB.prepare(
        'SELECT "idempotencyEnvironment", "idempotencyFingerprint", "checkoutCancelUrl", "checkoutSuccessUrl" FROM "CheckoutOrder" WHERE "id" = ?',
      )
        .bind(created.hold.id)
        .first(),
    ).resolves.toEqual({
      checkoutCancelUrl: 'https://example.com/checkout',
      checkoutSuccessUrl: 'https://example.com/return',
      idempotencyEnvironment: 'LOCAL',
      idempotencyFingerprint: 'b'.repeat(64),
    });
  });

  it('persists complete newsletter consent on an opted-in pending hold', async () => {
    const variantId = parseVariantId(`variant_hold_newsletter_${crypto.randomUUID()}`);
    const repository = new D1CheckoutStockHoldRepository(env.COMMERCE_DB);
    const createdAt = new Date('2026-08-31T20:00:00.000Z');
    await seedStock(variantId, 1);

    const created = await repository.createPendingHold({
      checkoutExpiresAt: new Date('2026-08-31T20:30:00.000Z'),
      createdAt,
      lines: [
        {
          displayName: 'Newsletter hold item',
          lineAmountMinor: 2500,
          optionLabel: null,
          quantity: createCartQuantity(1),
          storeItemSlug: parseStoreItemSlug('newsletter-hold-item'),
          stripePriceId: parseStripePriceId('price_test_newsletter_hold'),
          unitAmountMinor: 2500,
          variantId,
        },
      ],
      newsletterConsentAt: createdAt,
      newsletterConsentCopyVersion: 'blackbox-newsletter-v1',
      newsletterOptIn: true,
      orderId: crypto.randomUUID(),
    });

    expect(created.kind).toBe('created');
    if (created.kind !== 'created') return;

    await expect(
      env.COMMERCE_DB.prepare(
        'SELECT "newsletterOptIn", "newsletterConsentAt", "newsletterConsentCopyVersion" FROM "CheckoutOrder" WHERE "id" = ?',
      )
        .bind(created.hold.id)
        .first(),
    ).resolves.toEqual({
      newsletterConsentAt: createdAt.toISOString(),
      newsletterConsentCopyVersion: 'blackbox-newsletter-v1',
      newsletterOptIn: 1,
    });
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
            displayName: 'Available item',
            lineAmountMinor: 2500,
            optionLabel: null,
            quantity: createCartQuantity(1),
            storeItemSlug: parseStoreItemSlug('hold-available-item'),
            stripePriceId: parseStripePriceId('price_test_hold_available'),
            unitAmountMinor: 2500,
            variantId: availableVariantId,
          },
          {
            displayName: 'Unavailable item',
            lineAmountMinor: 2500,
            optionLabel: null,
            quantity: createCartQuantity(1),
            storeItemSlug: parseStoreItemSlug('hold-unavailable-item'),
            stripePriceId: parseStripePriceId('price_test_hold_unavailable'),
            unitAmountMinor: 2500,
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
          displayName: 'Binding item',
          lineAmountMinor: 2500,
          optionLabel: null,
          quantity: createCartQuantity(1),
          storeItemSlug: parseStoreItemSlug('hold-binding-item'),
          stripePriceId: parseStripePriceId('price_test_hold_binding'),
          unitAmountMinor: 2500,
          variantId,
        },
      ],
      orderId: crypto.randomUUID(),
    });

    expect(created.kind).toBe('created');
    if (created.kind !== 'created') return;

    const boundAt = new Date('2026-08-31T22:01:00.000Z');
    const acceptedExpiry = new Date('2026-08-31T22:36:02.000Z');
    const bound = await repository.bindCheckoutSession(
      created.hold,
      parseCheckoutSessionId('cs_test_hold_binding'),
      boundAt,
      acceptedExpiry,
    );

    expect(bound).toMatchObject({ checkoutSessionId: 'cs_test_hold_binding', status: 'pending_payment' });
    expect(bound?.checkoutExpiresAt).toEqual(acceptedExpiry);
    expect(
      await env.COMMERCE_DB.prepare('SELECT "checkoutExpiresAt" FROM "CheckoutOrder" WHERE "id" = ?')
        .bind(created.hold.id)
        .first(),
    ).toEqual({ checkoutExpiresAt: acceptedExpiry.toISOString() });
    await env.COMMERCE_DB.prepare('UPDATE "CheckoutOrder" SET "checkoutSessionId" = NULL WHERE "id" = ?')
      .bind(created.hold.id)
      .run();
    await expect(
      repository.recoverCheckoutSession(
        created.hold.id,
        parseCheckoutSessionId('cs_test_hold_binding'),
        boundAt,
        acceptedExpiry,
      ),
    ).resolves.toBe(true);
    expect(
      await env.COMMERCE_DB.prepare('SELECT "checkoutExpiresAt" FROM "CheckoutOrder" WHERE "id" = ?')
        .bind(created.hold.id)
        .first(),
    ).toEqual({ checkoutExpiresAt: acceptedExpiry.toISOString() });
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
            displayName: 'Cleanup item',
            lineAmountMinor: 2500,
            optionLabel: null,
            quantity: createCartQuantity(1),
            storeItemSlug: parseStoreItemSlug('hold-cleanup-item'),
            stripePriceId: parseStripePriceId(`price_test_hold_cleanup_${index}`),
            unitAmountMinor: 2500,
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
