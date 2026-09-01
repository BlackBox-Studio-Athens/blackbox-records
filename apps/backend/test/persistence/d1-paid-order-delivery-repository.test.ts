import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';

import { D1PaidOrderDeliveryRepository } from '../../src/infrastructure/persistence/d1-paid-order-delivery-repository';

describe('D1PaidOrderDeliveryRepository', () => {
  it('lets one concurrent claimant own the provider request', async () => {
    const deliveryId = await seedPendingDelivery();
    const repository = new D1PaidOrderDeliveryRepository(env.COMMERCE_DB);
    const claimedAt = new Date('2026-09-01T10:00:00.000Z');
    const providerRequest = vi.fn();

    const results = await Promise.all([
      repository.claimDue({ claimedAt, deliveryId }),
      repository.claimDue({ claimedAt, deliveryId }),
    ]);

    for (const result of results) {
      if (result.kind === 'claimed') providerRequest(result.delivery.id);
    }

    expect(results.map((result) => result.kind).sort()).toEqual(['claimed', 'not_claimed']);
    expect(providerRequest).toHaveBeenCalledTimes(1);
    expect(results.find((result) => result.kind === 'claimed')).toMatchObject({
      delivery: {
        attemptCount: 1,
        id: deliveryId,
        status: 'pending',
      },
      kind: 'claimed',
    });
  });

  it('rejects an unexpired lease and reclaims it after expiry through the same path', async () => {
    const deliveryId = await seedPendingDelivery();
    const repository = new D1PaidOrderDeliveryRepository(env.COMMERCE_DB);
    const firstClaim = await repository.claimDue({
      claimedAt: new Date('2026-09-01T10:00:00.000Z'),
      deliveryId,
    });

    expect(firstClaim.kind).toBe('claimed');
    await expect(repository.claimDue({ claimedAt: new Date('2026-09-01T10:09:59.999Z'), deliveryId })).resolves.toEqual(
      { kind: 'not_claimed' },
    );
    await expect(
      repository.claimDue({ claimedAt: new Date('2026-09-01T10:10:00.001Z'), deliveryId }),
    ).resolves.toMatchObject({
      delivery: { attemptCount: 2, id: deliveryId },
      kind: 'claimed',
    });
  });

  it('uses the same claim path to select the oldest due scheduled row', async () => {
    const olderId = await seedPendingDelivery({ nextAttemptAt: '2026-09-01T09:45:00.000Z' });
    await seedPendingDelivery({ nextAttemptAt: '2026-09-01T09:50:00.000Z' });
    const repository = new D1PaidOrderDeliveryRepository(env.COMMERCE_DB);

    await expect(
      repository.claimDue({ claimedAt: new Date('2026-09-01T10:00:00.000Z'), deliveryId: null }),
    ).resolves.toMatchObject({
      delivery: { id: olderId },
      kind: 'claimed',
    });
  });

  it('lets only the active lease reschedule and terminalize a delivery', async () => {
    const deliveryId = await seedPendingDelivery();
    const repository = new D1PaidOrderDeliveryRepository(env.COMMERCE_DB);
    const firstClaim = await repository.claimDue({
      claimedAt: new Date('2026-09-01T10:00:00.000Z'),
      deliveryId,
    });

    expect(firstClaim.kind).toBe('claimed');
    if (firstClaim.kind !== 'claimed') return;

    await expect(
      repository.markDelivered({
        deliveredAt: new Date('2026-09-01T10:01:00.000Z'),
        delivery: { ...firstClaim.delivery, leaseUntil: new Date('2026-09-01T10:10:00.001Z') },
        providerMessageId: null,
      }),
    ).resolves.toBe(false);
    await expect(
      repository.reschedule({
        delivery: firstClaim.delivery,
        nextAttemptAt: new Date('2026-09-01T10:15:00.000Z'),
        safeReason: 'rate_limited',
        updatedAt: new Date('2026-09-01T10:01:00.000Z'),
      }),
    ).resolves.toBe(true);
    await expect(readDelivery(deliveryId)).resolves.toMatchObject({
      leaseUntil: null,
      nextAttemptAt: '2026-09-01T10:15:00.000Z',
      safeReason: 'rate_limited',
      status: 'pending',
    });

    const secondClaim = await repository.claimDue({
      claimedAt: new Date('2026-09-01T10:15:00.000Z'),
      deliveryId,
    });
    expect(secondClaim.kind).toBe('claimed');
    if (secondClaim.kind !== 'claimed') return;

    await expect(
      repository.markNeedsReview({
        delivery: secondClaim.delivery,
        needsReviewAt: new Date('2026-09-01T10:16:00.000Z'),
        safeReason: 'provider_unavailable',
      }),
    ).resolves.toBe(true);
    await expect(readDelivery(deliveryId)).resolves.toMatchObject({
      leaseUntil: null,
      needsReviewAt: '2026-09-01T10:16:00.000Z',
      nextAttemptAt: null,
      safeReason: 'provider_unavailable',
      status: 'needs_review',
    });
  });

  it('marks a claimed delivery delivered once', async () => {
    const deliveryId = await seedPendingDelivery();
    const repository = new D1PaidOrderDeliveryRepository(env.COMMERCE_DB);
    const claim = await repository.claimDue({ claimedAt: new Date('2026-09-01T10:00:00.000Z'), deliveryId });

    expect(claim.kind).toBe('claimed');
    if (claim.kind !== 'claimed') return;

    await expect(
      repository.markDelivered({
        deliveredAt: new Date('2026-09-01T10:01:00.000Z'),
        delivery: claim.delivery,
        providerMessageId: null,
      }),
    ).resolves.toBe(true);
    await expect(
      repository.markDelivered({
        deliveredAt: new Date('2026-09-01T10:02:00.000Z'),
        delivery: claim.delivery,
        providerMessageId: null,
      }),
    ).resolves.toBe(false);
    await expect(readDelivery(deliveryId)).resolves.toMatchObject({
      deliveredAt: '2026-09-01T10:01:00.000Z',
      leaseUntil: null,
      nextAttemptAt: null,
      status: 'delivered',
    });

    const summaries = await repository.listSummaries([await readDeliveryOrderId(deliveryId)]);
    expect(summaries).toEqual([
      expect.objectContaining({
        attemptCount: 1,
        deliveredAt: new Date('2026-09-01T10:01:00.000Z'),
        id: deliveryId,
        kind: 'shopper_confirmation',
        status: 'delivered',
      }),
    ]);
    expect(summaries[0]).not.toHaveProperty('leaseUntil');
    expect(summaries[0]).not.toHaveProperty('providerMessageId');
  });
});

async function readDelivery(deliveryId: string) {
  return env.COMMERCE_DB.prepare(
    'SELECT "status", "nextAttemptAt", "leaseUntil", "safeReason", "deliveredAt", "needsReviewAt" FROM "PaidOrderDelivery" WHERE "id" = ?',
  )
    .bind(deliveryId)
    .first();
}

async function readDeliveryOrderId(deliveryId: string): Promise<string> {
  const row = await env.COMMERCE_DB.prepare('SELECT "orderId" FROM "PaidOrderDelivery" WHERE "id" = ?')
    .bind(deliveryId)
    .first<{ orderId: string }>();

  return row!.orderId;
}

async function seedPendingDelivery(input: { nextAttemptAt?: string } = {}): Promise<string> {
  const suffix = crypto.randomUUID();
  const orderId = `order_delivery_claim_${suffix}`;
  const deliveryId = `delivery_claim_${suffix}`;
  const createdAt = '2026-09-01T09:30:00.000Z';

  await env.COMMERCE_DB.batch([
    env.COMMERCE_DB.prepare(
      [
        'INSERT INTO "CheckoutOrder"',
        '  ("id", "storeItemSlug", "variantId", "checkoutSessionId", "checkoutExpiresAt", "status",',
        '   "statusUpdatedAt", "paidAt", "amountTotalMinor", "currencyCode", "recipientName", "shopperEmail",',
        '   "shippingAddressLine1", "shippingAddressCity", "shippingAddressPostalCode",',
        '   "shippingAddressCountryCode", "newsletterOptIn", "createdAt", "updatedAt")',
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ].join('\n'),
    ).bind(
      orderId,
      `delivery-item-${suffix}`,
      `variant_delivery_${suffix}`,
      `cs_delivery_${suffix}`,
      '2026-09-01T09:00:00.000Z',
      'paid',
      createdAt,
      createdAt,
      2500,
      'EUR',
      'Buyer Name',
      'buyer@example.com',
      'Long Street 1',
      'Athens',
      '10558',
      'GR',
      0,
      createdAt,
      createdAt,
    ),
    env.COMMERCE_DB.prepare(
      [
        'INSERT INTO "PaidOrderDelivery"',
        '  ("id", "orderId", "kind", "status", "attemptCount", "nextAttemptAt", "createdAt", "updatedAt")',
        'VALUES (?, ?, ?, ?, 0, ?, ?, ?)',
      ].join('\n'),
    ).bind(
      deliveryId,
      orderId,
      'shopper_confirmation',
      'pending',
      input.nextAttemptAt ?? '2026-09-01T09:45:00.000Z',
      createdAt,
      createdAt,
    ),
  ]);

  return deliveryId;
}
