import { env } from 'cloudflare:workers';
import { applyD1Migrations } from 'cloudflare:test';
import { beforeAll, expect, it, vi } from 'vitest';
import { requestPublication } from '../../../src/cms/publication-journal';
import { guardItemLifecycle, reconcileItemPublications } from '../../../src/cms/item-publication-recovery';
import {
  publishCatalogItem,
  createStripeCatalogMetadata,
  createStripeCatalogRequestShapeFingerprint,
  type StripeCatalogPrice,
} from '../../../src/application/commerce/catalog-sync';
import {
  createPrismaClient,
  D1CatalogOperationRepository,
  PrismaStoreItemOptionRepository,
  PrismaVariantStripeMappingRepository,
} from '../../../src/infrastructure/persistence/prisma';
import { parseStoreItemSlug, parseVariantId, parseStripePriceId } from '../../../src/domain/commerce';

beforeAll(async () => {
  await applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS);
});

it.each(['none', 'product', 'content', 'request', 'complete', 'unpublish'] as const)(
  'publishes with unchanged Price and stock after %s acknowledgement loss',
  async (failure) => {
    const db = createPrismaClient(env);
    const journal = new D1CatalogOperationRepository(env.COMMERCE_DB);
    const item = {
      variantId: parseVariantId(`variant_publish_${failure}`),
      storeItemSlug: parseStoreItemSlug(`publish-${failure}`),
      sourceKind: 'release' as const,
      sourceId: `publish-${failure}`,
    };
    const metadata = createStripeCatalogMetadata('local', item);
    const projection = {
      name: 'Record',
      description: 'Saved copy',
      imageUrls: [],
      metadata: {},
      taxCode: 'txcd_99999999',
    };
    const desired = { ...projection, imageUrls: ['http://127.0.0.1:8787/media/published/' + 'a'.repeat(64)] };
    let current: StripeCatalogPrice = {
      active: true,
      amountMinor: 2400,
      currencyCode: 'EUR',
      customUnitAmount: null,
      lookupKey: null,
      taxBehavior: 'inclusive',
      metadata,
      priceKind: 'fixed',
      productActive: true,
      productDescription: projection.description,
      productId: `prod_publish_${failure}`,
      productImages: [],
      productMetadata: metadata,
      productName: projection.name,
      productTaxCode: projection.taxCode,
      priceId: parseStripePriceId(`price_publish_${failure}`),
    };
    let time = new Date();
    let lost = false;
    const interrupt = (step: string) => {
      if (step === failure && !lost) {
        lost = true;
        throw new Error('Lost response');
      }
    };
    let publicationState: 'pending' | 'live' | 'failed' = 'pending';
    const gateway = {
      retrieveDefaultPrice: vi.fn(async () => current),
      updateProductProjection: vi.fn(async () => {
        current = { ...current, productImages: desired.imageUrls };
        interrupt('product');
        return { productId: current.productId!, active: true, name: current.productName, metadata };
      }),
    };
    const cms = {
      checkRevision: vi.fn(async () => {}),
      approve: vi.fn(async () => ({
        projection: desired,
        sourceFingerprint: createStripeCatalogRequestShapeFingerprint('content'),
      })),
      publish: vi.fn(async () => {
        interrupt('content');
        return 'revision_published';
      }),
      publication: vi.fn(async (): Promise<'pending' | 'live' | 'failed'> => {
        interrupt('request');
        return publicationState;
      }),
    };
    const complete = journal.completeItemPublication.bind(journal);
    vi.spyOn(journal, 'completeItemPublication').mockImplementation(async (...args) => {
      const result = await complete(...args);
      interrupt('complete');
      return result;
    });
    const deps = {
      environment: 'local' as const,
      journal,
      catalog: new PrismaStoreItemOptionRepository(db),
      mappings: new PrismaVariantStripeMappingRepository(db),
      gateway,
      cms,
      now: () => time,
    };
    const command = { operationId: crypto.randomUUID(), expectedRevision: 1, cmsRevision: 'MTpjdXJyZW50' };
    try {
      await db.storeItemOption.create({
        data: {
          ...item,
          cmsSourceId: 'cms_' + failure,
          itemType: 'Vinyl 12-inch',
          priceKind: 'fixed',
          catalogAvailability: 'withheld',
          catalogRevision: 1,
          productProjection: projection,
        },
      });
      await db.variantStripeMapping.create({
        data: { variantId: item.variantId, stripePriceId: current.priceId, stripeProductId: current.productId },
      });
      await db.stock.create({ data: { variantId: item.variantId, quantity: 7, onlineQuantity: 5 } });
      const beforeStock = await db.stock.findUnique({ where: { variantId: item.variantId } });
      const beforeMapping = await db.variantStripeMapping.findUnique({ where: { variantId: item.variantId } });
      await expect(
        publishCatalogItem({ ...deps, environment: 'prd' }, item.variantId, 'operator@example.com', command),
      ).rejects.toThrow('Confirm');
      expect(await journal.find(command.operationId)).toBeNull();
      if (['product', 'content', 'request'].includes(failure)) {
        await expect(publishCatalogItem(deps, item.variantId, 'operator@example.com', command)).rejects.toThrow(
          'Lost response',
        );
        time = new Date(time.getTime() + 120_000);
      }
      const pending = await publishCatalogItem(deps, item.variantId, 'operator@example.com', command);
      expect(pending).toMatchObject({ status: 'pending', publicationStatus: 'pending' });
      expect(await db.storeItemOption.findUnique({ where: { variantId: item.variantId } })).toMatchObject({
        catalogAvailability: 'withheld',
        catalogRevision: 1,
      });
      expect(await journal.find(command.operationId)).toMatchObject({
        claimToken: null,
        results: { stripePriceId: current.priceId },
      });
      await expect(
        journal.begin({
          id: 'another-command',
          kind: 'price_change',
          variantId: item.variantId,
          actorEmail: 'operator@example.com',
          expectedRevision: 1,
          inputFingerprint: createStripeCatalogRequestShapeFingerprint('other'),
        }),
      ).rejects.toThrow('conflicts');
      if (failure === 'unpublish') {
        await db.itemAvailability.create({ data: { variantId: item.variantId, status: 'available', canBuy: false } });
        await guardItemLifecycle(
          new Request('http://127.0.0.1:8787/_emdash/api/content/releases/cms_unpublish/unpublish', {
            method: 'POST',
            body: JSON.stringify({ _rev: 'current' }),
          }),
          env.COMMERCE_DB,
          async () => Response.json({ data: { _rev: 'current' } }),
        );
        await requestPublication(env.TEST_CMS_DB, {
          id: pending.publicationId!,
          environment: 'local',
          actorEmail: 'operator@example.com',
          requestedRevision: 'revision_published',
        });
        await env.TEST_CMS_DB.prepare(
          "UPDATE _blackbox_publications SET status = 'live', snapshot_sha256 = ? WHERE id = ?",
        )
          .bind('a'.repeat(64), pending.publicationId)
          .run();
        await reconcileItemPublications(env.COMMERCE_DB, env.TEST_CMS_DB, 'local');
        expect((await journal.find(command.operationId))?.status).toBe('needs_review');
        expect(await db.storeItemOption.findUnique({ where: { variantId: item.variantId } })).toMatchObject({
          catalogAvailability: 'withheld',
          catalogRevision: 2,
        });
        expect(await db.itemAvailability.findUnique({ where: { variantId: item.variantId } })).toMatchObject({
          canBuy: false,
        });
        expect(await db.stock.findUnique({ where: { variantId: item.variantId } })).toEqual(beforeStock);
        expect(await db.variantStripeMapping.findUnique({ where: { variantId: item.variantId } })).toEqual(
          beforeMapping,
        );
        return;
      }
      if (failure === 'none') {
        publicationState = 'failed';
        const failed = await publishCatalogItem(deps, item.variantId, 'operator@example.com', command);
        expect(failed).toMatchObject({
          status: 'pending',
          publicationId: pending.publicationId,
          publicationStatus: 'failed',
        });
        const retried = await publishCatalogItem(deps, item.variantId, 'operator@example.com', {
          ...command,
          retryPublication: true,
        });
        expect(retried.publicationId).not.toBe(pending.publicationId);
        await requestPublication(env.TEST_CMS_DB, {
          id: retried.publicationId!,
          environment: 'local',
          actorEmail: 'operator@example.com',
          requestedRevision: 'revision_published',
        });
        await reconcileItemPublications(env.COMMERCE_DB, env.TEST_CMS_DB, 'local');
        expect((await journal.find(command.operationId))?.status).toBe('pending');
        await env.TEST_CMS_DB.prepare(
          "UPDATE _blackbox_publications SET status = 'live', snapshot_sha256 = ? WHERE id = ?",
        )
          .bind('a'.repeat(64), retried.publicationId)
          .run();
        await reconcileItemPublications(env.COMMERCE_DB, env.TEST_CMS_DB, 'uat');
        expect((await journal.find(command.operationId))?.status).toBe('pending');
        await reconcileItemPublications(env.COMMERCE_DB, env.TEST_CMS_DB, 'local');
        expect((await journal.find(command.operationId))?.status).toBe('completed');
      }
      publicationState = 'live';
      if (failure === 'complete')
        await expect(publishCatalogItem(deps, item.variantId, 'operator@example.com', command)).rejects.toThrow(
          'Lost response',
        );
      const result = await publishCatalogItem(deps, item.variantId, 'operator@example.com', command);
      expect(result.status).toBe('completed');
      expect(gateway.updateProductProjection).toHaveBeenCalledTimes(1);
      expect(cms.approve).toHaveBeenCalledTimes(1);
      expect(await db.storeItemOption.findUnique({ where: { variantId: item.variantId } })).toMatchObject({
        catalogAvailability: 'published',
        catalogRevision: 2,
        productProjection: desired,
      });
      expect(await db.stock.findUnique({ where: { variantId: item.variantId } })).toEqual(beforeStock);
      expect(await db.variantStripeMapping.findUnique({ where: { variantId: item.variantId } })).toEqual(beforeMapping);
      expect(current.amountMinor).toBe(2400);
      expect(await db.itemAvailability.findUnique({ where: { variantId: item.variantId } })).toMatchObject({
        canBuy: true,
      });
      expect(await db.stockChange.count({ where: { variantId: item.variantId } })).toBe(0);
    } finally {
      await db.$disconnect();
    }
  },
);
