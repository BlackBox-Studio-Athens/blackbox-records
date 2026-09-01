import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import type { FinalizePaidCheckoutCommand } from '../../../src/application/commerce/orders';
import {
  createCartQuantity,
  parseCheckoutSessionId,
  parsePaymentIntentId,
  parseStoreItemSlug,
  parseStripePriceId,
  parseVariantId,
} from '../../../src/domain/commerce';
import { readPaidCheckoutFulfillment } from '../../../src/domain/commerce/repositories/spi';
import { D1PaidCheckoutFinalizationRepository } from '../../../src/interfaces/http/routes/d1-paid-checkout-finalization-repository';

describe('D1PaidCheckoutFinalizationRepository', () => {
  it('atomically commits paid facts, line snapshots, stock, and all consented deliveries', async () => {
    const seeded = await seedPendingCheckout();
    const repository = new D1PaidCheckoutFinalizationRepository(env.COMMERCE_DB);

    const result = await repository.finalizePaidCheckout(finalizationCommand(seeded));

    expect(result.kind).toBe('transitioned');
    if (result.kind !== 'transitioned') return;

    expect(readPaidCheckoutFulfillment(result.order).kind).toBe('current');
    expect(result.order).toMatchObject({
      amountTotalMinor: 3700,
      currencyCode: 'EUR',
      newsletterConsentCopyVersion: 'blackbox-newsletter-v1',
      newsletterOptIn: true,
      recipientName: 'Buyer Name',
      shippingAddressCountryCode: 'GR',
      shopperEmail: 'buyer@example.com',
      status: 'paid',
    });
    expect(result.order.lines).toEqual([
      expect.objectContaining({
        displayName: 'Disintegration Black Vinyl LP',
        lineAmountMinor: 3700,
        quantity: 1,
        unitAmountMinor: 3700,
      }),
    ]);
    await expect(readDeliveryKinds(seeded.orderId)).resolves.toEqual([
      'newsletter_registration',
      'ops_fulfillment',
      'shopper_confirmation',
    ]);
    await expect(readStock(seeded.variantId)).resolves.toMatchObject({ onlineQuantity: 4, quantity: 4 });
    await expect(readStockChangeCount(seeded.checkoutSessionId)).resolves.toBe(1);
  });

  it('creates only shopper and ops deliveries without newsletter consent', async () => {
    const seeded = await seedPendingCheckout();
    const repository = new D1PaidCheckoutFinalizationRepository(env.COMMERCE_DB);

    await repository.finalizePaidCheckout(
      finalizationCommand(seeded, {
        newsletterConsentAt: null,
        newsletterConsentCopyVersion: null,
        newsletterOptIn: false,
      }),
    );

    await expect(readDeliveryKinds(seeded.orderId)).resolves.toEqual(['ops_fulfillment', 'shopper_confirmation']);
  });

  it('preserves original paid facts and unique effects on replay', async () => {
    const seeded = await seedPendingCheckout();
    const repository = new D1PaidCheckoutFinalizationRepository(env.COMMERCE_DB);
    const firstResult = await repository.finalizePaidCheckout(finalizationCommand(seeded));

    const replayResult = await repository.finalizePaidCheckout(
      finalizationCommand(seeded, {
        amountTotalMinor: 9900,
        lineItems: [
          {
            lineAmountMinor: 9900,
            quantity: createCartQuantity(1),
            unitAmountMinor: 9900,
            variantId: seeded.variantId,
          },
        ],
        recipientName: 'Changed Name',
        shippingAddressLine1: 'Changed Street 99',
      }),
    );

    expect(firstResult.kind).toBe('transitioned');
    expect(replayResult).toMatchObject({
      kind: 'replay',
      order: {
        amountTotalMinor: 3700,
        recipientName: 'Buyer Name',
        shippingAddressLine1: 'Long Street 1',
      },
      paidFulfillment: {
        kind: 'current',
      },
    });
    await expect(readLineAmount(seeded.orderId)).resolves.toBe(3700);
    await expect(readDeliveryKinds(seeded.orderId)).resolves.toEqual([
      'newsletter_registration',
      'ops_fulfillment',
      'shopper_confirmation',
    ]);
    await expect(readStock(seeded.variantId)).resolves.toMatchObject({ onlineQuantity: 4, quantity: 4 });
    await expect(readStockChangeCount(seeded.checkoutSessionId)).resolves.toBe(1);
  });

  it('returns stock_unavailable without mutating paid state', async () => {
    const seeded = await seedPendingCheckout({ stockQuantity: 0 });
    const repository = new D1PaidCheckoutFinalizationRepository(env.COMMERCE_DB);

    await expect(repository.finalizePaidCheckout(finalizationCommand(seeded))).resolves.toMatchObject({
      kind: 'stock_unavailable',
      reason: 'Paid checkout cannot decrement unavailable stock.',
    });
    await expect(readOrderStatus(seeded.checkoutSessionId)).resolves.toBe('pending_payment');
    await expect(readDeliveryKinds(seeded.orderId)).resolves.toEqual([]);
    await expect(readStockChangeCount(seeded.checkoutSessionId)).resolves.toBe(0);
  });

  it('rolls back every earlier statement when the paid-order update violates a constraint', async () => {
    const seeded = await seedPendingCheckout();
    const repository = new D1PaidCheckoutFinalizationRepository(env.COMMERCE_DB);
    const invalidCommand = {
      ...finalizationCommand(seeded),
      lineItems: [
        {
          lineAmountMinor: 4100,
          quantity: createCartQuantity(1),
          unitAmountMinor: 4100,
          variantId: seeded.variantId,
        },
      ],
      shippingAddressCountryCode: 'US',
    } as unknown as FinalizePaidCheckoutCommand;

    await expect(repository.finalizePaidCheckout(invalidCommand)).rejects.toThrow();

    await expect(readOrderStatus(seeded.checkoutSessionId)).resolves.toBe('pending_payment');
    await expect(readLineAmount(seeded.orderId)).resolves.toBe(2500);
    await expect(readDeliveryKinds(seeded.orderId)).resolves.toEqual([]);
    await expect(readStock(seeded.variantId)).resolves.toMatchObject({ onlineQuantity: 5, quantity: 5 });
    await expect(readStockChangeCount(seeded.checkoutSessionId)).resolves.toBe(0);
  });
});

type SeededCheckout = {
  checkoutSessionId: ReturnType<typeof parseCheckoutSessionId>;
  orderId: string;
  variantId: ReturnType<typeof parseVariantId>;
};

async function seedPendingCheckout(input: { stockQuantity?: number } = {}): Promise<SeededCheckout> {
  const suffix = crypto.randomUUID();
  const checkoutSessionId = parseCheckoutSessionId(`cs_test_paid_${suffix}`);
  const orderId = `order_paid_${suffix}`;
  const variantId = parseVariantId(`variant_paid_${suffix}`);
  const createdAt = '2026-09-01T08:00:00.000Z';
  const stockQuantity = input.stockQuantity ?? 5;

  await env.COMMERCE_DB.batch([
    env.COMMERCE_DB.prepare(
      [
        'INSERT INTO "CheckoutOrder"',
        '  ("id", "storeItemSlug", "variantId", "checkoutSessionId", "checkoutExpiresAt", "status",',
        '   "statusUpdatedAt", "createdAt", "updatedAt")',
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ].join('\n'),
    ).bind(
      orderId,
      parseStoreItemSlug(`paid-item-${suffix}`),
      variantId,
      checkoutSessionId,
      '2026-09-01T08:30:00.000Z',
      'pending_payment',
      createdAt,
      createdAt,
      createdAt,
    ),
    env.COMMERCE_DB.prepare(
      [
        'INSERT INTO "CheckoutOrderLine"',
        '  ("id", "orderId", "storeItemSlug", "variantId", "stripePriceId", "quantity", "displayName",',
        '   "optionLabel", "unitAmountMinor", "lineAmountMinor", "createdAt")',
        'VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)',
      ].join('\n'),
    ).bind(
      `line_paid_${suffix}`,
      orderId,
      parseStoreItemSlug(`paid-item-${suffix}`),
      variantId,
      parseStripePriceId(`price_paid_${suffix}`),
      1,
      'Disintegration Black Vinyl LP',
      2500,
      2500,
      createdAt,
    ),
    env.COMMERCE_DB.prepare(
      'INSERT INTO "Stock" ("id", "variantId", "quantity", "onlineQuantity", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(`stock_paid_${suffix}`, variantId, stockQuantity, stockQuantity, createdAt, createdAt),
  ]);

  return { checkoutSessionId, orderId, variantId };
}

function finalizationCommand(
  seeded: SeededCheckout,
  overrides: Partial<FinalizePaidCheckoutCommand> = {},
): FinalizePaidCheckoutCommand {
  const transitionedAt = new Date('2026-09-01T09:00:00.000Z');

  return {
    amountTotalMinor: 3700,
    checkoutSessionId: seeded.checkoutSessionId,
    currencyCode: 'EUR',
    lineItems: [
      {
        lineAmountMinor: 3700,
        quantity: createCartQuantity(1),
        unitAmountMinor: 3700,
        variantId: seeded.variantId,
      },
    ],
    newsletterConsentAt: transitionedAt,
    newsletterConsentCopyVersion: 'blackbox-newsletter-v1',
    newsletterOptIn: true,
    recipientName: 'Buyer Name',
    shippingAddressCity: 'Athens',
    shippingAddressCountryCode: 'GR',
    shippingAddressLine1: 'Long Street 1',
    shippingAddressLine2: null,
    shippingAddressPostalCode: '10558',
    shippingAddressState: null,
    shopperEmail: 'buyer@example.com',
    shopperPhone: null,
    stripePaymentIntentId: parsePaymentIntentId(`pi_paid_${seeded.orderId}`),
    transitionedAt,
    ...overrides,
  };
}

async function readDeliveryKinds(orderId: string): Promise<string[]> {
  const result = await env.COMMERCE_DB.prepare(
    'SELECT "kind" FROM "PaidOrderDelivery" WHERE "orderId" = ? ORDER BY "kind" ASC',
  )
    .bind(orderId)
    .all<{ kind: string }>();

  return result.results.map((row) => row.kind);
}

async function readLineAmount(orderId: string): Promise<number | null> {
  return (
    (
      await env.COMMERCE_DB.prepare('SELECT "lineAmountMinor" FROM "CheckoutOrderLine" WHERE "orderId" = ? LIMIT 1')
        .bind(orderId)
        .first<{ lineAmountMinor: number | null }>()
    )?.lineAmountMinor ?? null
  );
}

async function readOrderStatus(checkoutSessionId: string): Promise<string | null> {
  return (
    (
      await env.COMMERCE_DB.prepare('SELECT "status" FROM "CheckoutOrder" WHERE "checkoutSessionId" = ?')
        .bind(checkoutSessionId)
        .first<{ status: string }>()
    )?.status ?? null
  );
}

async function readStock(variantId: string): Promise<{ onlineQuantity: number; quantity: number } | null> {
  return env.COMMERCE_DB.prepare('SELECT "quantity", "onlineQuantity" FROM "Stock" WHERE "variantId" = ?')
    .bind(variantId)
    .first();
}

async function readStockChangeCount(checkoutSessionId: string): Promise<number> {
  return (
    (
      await env.COMMERCE_DB.prepare('SELECT COUNT(*) AS "count" FROM "StockChange" WHERE "notes" = ?')
        .bind(`Checkout session ${checkoutSessionId}`)
        .first<{ count: number }>()
    )?.count ?? 0
  );
}
