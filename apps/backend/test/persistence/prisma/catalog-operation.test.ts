import { parseStoreItemSlug, parseStripePriceId, parseVariantId } from '../../../src/domain/commerce/ids';
import { env } from 'cloudflare:workers';
import { expect, it } from 'vitest';
import { D1CatalogOperationRepository, createPrismaClient } from '../../../src/infrastructure/persistence/prisma';
import { createStripeCatalogRequestShapeFingerprint } from '../../../src/application/commerce/catalog-sync';

it('deduplicates input and serializes item work, fences expired claims, and retains completed provider results', async () => {
  const db = createPrismaClient({ COMMERCE_DB: env.COMMERCE_DB });
  const journal = new D1CatalogOperationRepository(env.COMMERCE_DB);
  const input = {
    id: 'price-operation-one',
    kind: 'price_change' as const,
    inputFingerprint: createStripeCatalogRequestShapeFingerprint({ amountMinor: 2500, currency: 'EUR' }),
    actorEmail: 'operator@blackboxrecords.example',
    variantId: 'variant_operation_test',
    expectedRevision: 3,
  };
  try {
    await db.storeItemOption.create({
      data: {
        variantId: input.variantId,
        storeItemSlug: 'operation-test',
        sourceKind: 'release',
        sourceId: 'operation-test',
        catalogRevision: 3,
      },
    });
    await db.variantStripeMapping.create({
      data: { variantId: input.variantId, stripeProductId: 'prod_existing', stripePriceId: 'price_old' },
    });
    const created = await Promise.all([journal.begin(input), journal.begin(input)]);
    expect(created.map((operation) => operation.id)).toEqual([input.id, input.id]);
    expect(await db.catalogOperation.count()).toBe(1);
    for (const conflict of [
      { id: 'second-operation' },
      { expectedRevision: 2 },
      { actorEmail: 'other@example.com' },
      { inputFingerprint: createStripeCatalogRequestShapeFingerprint({ amountMinor: 3000, currency: 'EUR' }) },
    ])
      await expect(journal.begin({ ...input, ...conflict })).rejects.toThrow('conflicts');
    const now = new Date('2026-09-13T12:00:00Z');
    const claims = await Promise.all([journal.claim(input.id, now), journal.claim(input.id, now)]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    const first = claims.find((claim) => claim !== null)!;
    const later = new Date(now.getTime() + 60_001);
    const resumed = (await journal.claim(input.id, later))!;
    expect(resumed.claimToken).not.toBe(first.claimToken);
    expect(await journal.advance(first, 'validated', { stripePriceId: 'price_stale' }, later)).toBeNull();
    const validated = (await journal.advance(
      resumed,
      'validated',
      { stripeProductId: 'prod_existing', previousStripePriceId: 'price_old' },
      later,
    ))!;
    const price = (await journal.advance(
      validated,
      'price_bound',
      { stripeProductId: 'prod_existing', stripePriceId: 'price_new' },
      later,
    ))!;
    expect(await journal.advance(resumed, 'validated', { stripePriceId: 'price_duplicate' }, later)).toBeNull();
    await expect(journal.advance(price, 'completed', {}, later)).rejects.toThrow('Invalid');
    await expect(journal.advance(price, 'default_selected', { stripePriceId: 'price_other' }, later)).rejects.toThrow(
      'cannot be replaced',
    );
    const selected = (await journal.advance(price, 'default_selected', {}, later))!;
    await expect(journal.advance(selected, 'completed', {}, later)).rejects.toThrow('Invalid');
    const snapshot = {
      variantId: parseVariantId(input.variantId),
      storeItemSlug: parseStoreItemSlug('operation-test'),
      stripePriceId: parseStripePriceId('price_new'),
      stripeLookupKey: 'operation-test',
      amountMinor: 2500,
      currencyCode: 'EUR',
      priceActive: true,
      productActive: true,
      syncedAt: later,
      freshUntil: new Date(later.getTime() + 86_400_000),
    };
    expect(await journal.completePriceChange(selected, snapshot, 'fixed', new Date(later.getTime() + 60_001))).toBe(
      false,
    );
    await db.variantStripeMapping.update({
      where: { variantId: input.variantId },
      data: { stripePriceId: 'price_external' },
    });
    expect(await journal.completePriceChange(selected, snapshot, 'fixed', later)).toBe(false);
    expect(await journal.find(input.id)).toMatchObject({ status: 'pending' });
    await db.variantStripeMapping.update({
      where: { variantId: input.variantId },
      data: { stripePriceId: 'price_old' },
    });
    expect(
      await journal.completePriceChange(
        { ...selected, results: { ...selected.results, stripePriceId: 'price_unrecorded' } },
        { ...snapshot, stripePriceId: parseStripePriceId('price_unrecorded') },
        'fixed',
        later,
      ),
    ).toBe(false);
    // A concurrent catalog revision prevents every part of finalization.
    await db.storeItemOption.update({ where: { variantId: input.variantId }, data: { catalogRevision: 4 } });
    expect(await journal.completePriceChange(selected, snapshot, 'fixed', later)).toBe(false);
    expect(await journal.find(input.id)).toMatchObject({ status: 'pending' });
    expect(await db.variantStripeMapping.findUnique({ where: { variantId: input.variantId } })).toMatchObject({
      stripePriceId: 'price_old',
    });
    expect(await db.storeOfferSnapshot.count()).toBe(0);
    await db.storeItemOption.update({ where: { variantId: input.variantId }, data: { catalogRevision: 3 } });
    // A later batch statement failure must roll back the earlier journal/mapping changes.
    await db.storeOfferSnapshot.create({ data: { ...snapshot, variantId: 'variant_conflicting_snapshot' } });
    await expect(journal.completePriceChange(selected, snapshot, 'fixed', later)).rejects.toThrow();
    expect(await journal.find(input.id)).toMatchObject({ status: 'pending', step: 'default_selected' });
    expect(await db.storeItemOption.findUnique({ where: { variantId: input.variantId } })).toMatchObject({
      catalogRevision: 3,
    });
    expect(await db.variantStripeMapping.findUnique({ where: { variantId: input.variantId } })).toMatchObject({
      stripePriceId: 'price_old',
    });
    await db.storeOfferSnapshot.delete({ where: { variantId: 'variant_conflicting_snapshot' } });
    expect(await journal.completePriceChange(selected, snapshot, 'fixed', later)).toBe(true);
    expect(await journal.completePriceChange(selected, snapshot, 'fixed', later)).toBe(false);
    expect(await db.storeOfferSnapshot.findUnique({ where: { variantId: input.variantId } })).toMatchObject(snapshot);
    expect(await db.variantStripeMapping.findUnique({ where: { variantId: input.variantId } })).toMatchObject({
      stripePriceId: 'price_new',
    });
    const completed = (await journal.find(input.id))!;
    expect(completed).toMatchObject({
      status: 'completed',
      claimToken: null,
      results: { stripeProductId: 'prod_existing', stripePriceId: 'price_new' },
    });
    expect(await journal.claim(input.id, later)).toBeNull();
    expect(await journal.begin(input)).toEqual(completed);
    expect(await db.storeItemOption.findUnique({ where: { variantId: input.variantId } })).toMatchObject({
      catalogRevision: 4,
      priceKind: 'fixed',
    });
    expect(await journal.begin({ ...input, expectedRevision: 4, id: 'next-price-operation' })).toMatchObject({
      status: 'pending',
    });
  } finally {
    await db.$disconnect();
  }
});

it('reserves setup identities before a catalog row exists and keeps uncertain work blocked for review', async () => {
  const journal = new D1CatalogOperationRepository(env.COMMERCE_DB);
  const input = {
    id: 'new-item-operation',
    kind: 'item_setup' as const,
    inputFingerprint: createStripeCatalogRequestShapeFingerprint({ sourceId: 'new-source', initialQuantity: 10 }),
    actorEmail: 'operator@blackboxrecords.example',
    variantId: 'variant_new_operation',
    expectedRevision: 0,
  };
  await expect(journal.begin({ ...input, kind: 'price_change' })).rejects.toThrow('conflicts');
  await journal.begin(input);
  const claim = (await journal.claim(input.id))!;
  const source = (await journal.advance(claim, 'source_linked', { cmsSourceId: 'cms-new-source' }))!;
  expect(await journal.markNeedsReview(claim, 'identity_conflict')).toBe(false);
  expect(await journal.markNeedsReview(source, 'provider_outcome_unknown')).toBe(true);
  expect(await journal.claim(input.id)).toBeNull();
  await expect(journal.begin({ ...input, id: 'replacement-operation' })).rejects.toThrow('conflicts');
  expect(await journal.begin(input)).toMatchObject({
    status: 'needs_review',
    results: { cmsSourceId: 'cms-new-source' },
  });
});
