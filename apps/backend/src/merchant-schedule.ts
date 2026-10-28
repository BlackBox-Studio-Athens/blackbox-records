import { z } from 'zod';
import { createMerchantProductInput, runMerchantSynchronization } from './application/commerce/merchant-sync';
import { readStoreOffer } from './application/commerce/checkout';
import { createFeatureFlagReader } from './application/commerce/checkout/feature-flags';
import { CatalogReconciler, createRuntimeCatalogProductProjectionReader } from './application/commerce/catalog-sync';
import { loadPublishedMerchantCatalog } from './cms/published-merchant-catalog';
import { parseVariantId } from './domain/commerce';
import { GoogleMerchantAdapter, GoogleMerchantError } from './infrastructure/google-merchant';
import { D1MerchantSyncRepository } from './infrastructure/persistence/d1-merchant-sync-repository';
import { D1CheckoutStockHoldRepository } from './infrastructure/persistence/d1-checkout-stock-hold-repository';
import {
  createPrismaClient,
  PrismaStoreItemOptionRepository,
  PrismaItemAvailabilityRepository,
  PrismaStockRepository,
  PrismaStoreOfferSnapshotRepository,
  PrismaVariantStripeMappingRepository,
} from './infrastructure/persistence/prisma';
import { createStripeCatalogGateway } from './infrastructure/stripe';
import { productEnvironmentProfileFromBindings, type AppBindings } from './platform/env';
import { createBindingLogger } from './platform/observability';

const merchantId = z.string().regex(/^[1-9][0-9]{0,19}$/);
const serviceAccountSchema = z.object({
  client_email: z.email().endsWith('.gserviceaccount.com'),
  private_key: z.string().min(1).max(16000),
});

export function merchantConfiguration(bindings: AppBindings) {
  if (
    bindings.MERCHANT_SYNC_ENABLED !== 'true' ||
    bindings.PRODUCT_ENVIRONMENT === 'LOCAL' ||
    (bindings.PRODUCT_ENVIRONMENT === 'PRD' && bindings.PRD_MERCHANT_SYNC_APPROVED !== 'true')
  )
    return null;
  const profile = productEnvironmentProfileFromBindings(bindings);
  const credentials = z.string().max(20000).parse(bindings.MERCHANT_SERVICE_ACCOUNT_JSON);
  return {
    environment: profile.workerDeploymentTarget,
    accountId: merchantId.parse(bindings.MERCHANT_ACCOUNT_ID),
    dataSourceId: merchantId.parse(bindings.MERCHANT_DATA_SOURCE_ID),
    expectedTestAccount: bindings.PRODUCT_ENVIRONMENT === 'UAT',
    serviceAccount: serviceAccountSchema.parse(JSON.parse(credentials)),
    publicOrigin: bindings.PRODUCT_ENVIRONMENT === 'PRD' ? profile.publicBackendOrigin : profile.publicSite.origin,
  };
}

/** Separate scheduled invocation; failure cannot change checkout or paid-delivery results. */
export async function runMerchantSchedule(bindings: AppBindings, media: R2Bucket | undefined, scheduledTime: number) {
  const logger = createBindingLogger(bindings, { scheduledTime });
  const startedAt = Date.now();
  try {
    const config = merchantConfiguration(bindings);
    if (!config) return;
    if (!media) throw new Error('Missing accepted publication storage.');
    const prisma = createPrismaClient(bindings);
    const storeItems = new PrismaStoreItemOptionRepository(prisma);
    const availability = new PrismaItemAvailabilityRepository(prisma);
    const stock = new PrismaStockRepository(prisma);
    const holds = new D1CheckoutStockHoldRepository(bindings.COMMERCE_DB);
    const effectiveStock = {
      findByVariantId: async (variantId: ReturnType<typeof parseVariantId>) => {
        const [record, quantity] = await Promise.all([
          stock.findByVariantId(variantId),
          holds.findEffectiveAvailability(variantId),
        ]);
        return record && quantity !== null ? { ...record, onlineQuantity: quantity } : null;
      },
    };
    const reconciler = new CatalogReconciler({
      environment: config.environment,
      storeItems,
      storeOfferSnapshots: new PrismaStoreOfferSnapshotRepository(prisma),
      variantStripeMappings: new PrismaVariantStripeMappingRepository(prisma),
      stripeCatalog: createStripeCatalogGateway(bindings, { timeout: 3000, maxNetworkRetries: 0 }),
    });
    const projections = createRuntimeCatalogProductProjectionReader(storeItems, config.environment);
    const checkout = createFeatureFlagReader(bindings, logger);
    const provider = new GoogleMerchantAdapter(config);
    let catalog: Awaited<ReturnType<typeof loadPublishedMerchantCatalog>> | undefined;
    let verified = false;
    const beforeMutation = async () => {
      if (!verified) {
        await provider.verifySource();
        verified = true;
      }
      if (!catalog || !(await catalog.isCurrent())) throw new Error('Accepted publication changed.');
    };
    const result = await runMerchantSynchronization({
      repository: new D1MerchantSyncRepository(bindings.COMMERCE_DB),
      scope: { environment: config.environment, accountId: config.accountId, dataSourceId: config.dataSourceId },
      readCatalog: async () => {
        catalog = await loadPublishedMerchantCatalog(media, config.environment);
        return { revision: catalog.identity, items: catalog.snapshot.storeItems! };
      },
      isCurrent: async (revision) => !!catalog && catalog.identity === revision && (await catalog.isCurrent()),
      readInput: async (item) => {
        if (!catalog) throw new Error('Missing accepted catalog.');
        if (!(await checkout.isNativeCheckoutEnabled({ throwOnError: true }))) return null;
        const accepted = catalog.snapshot.storeItems!.find((entry) => entry.variantId === item.variantId);
        if (!accepted) throw new Error('Missing accepted identity.');
        const offer = await readStoreOffer(
          storeItems,
          availability,
          effectiveStock,
          reconciler,
          projections,
          item.storeItemSlug,
        );
        if (!offer || offer.variantId !== item.variantId || offer.storeItemSlug !== item.storeItemSlug)
          throw new Error('Offer identity is uncertain.');
        const variantId = parseVariantId(item.variantId);
        // Recheck local availability after the Stripe wait, preserving the raw pre-order flag.
        const [latestStock, latestAvailability] = await Promise.all([
          effectiveStock.findByVariantId(variantId),
          availability.findByVariantId(variantId),
        ]);
        if (!latestAvailability) throw new Error('Missing availability.');
        if (latestAvailability.status !== 'available' || !latestAvailability.canBuy) return null;
        return createMerchantProductInput(catalog.snapshot, accepted, offer, latestStock, config.publicOrigin);
      },
      provider: {
        upsert: async (input) => {
          await beforeMutation();
          if (!(await checkout.isNativeCheckoutEnabled({ throwOnError: true })))
            throw new Error('Checkout closed before submission.');
          const variantId = parseVariantId(input.offerId);
          const [latest, eligibility] = await Promise.all([
            effectiveStock.findByVariantId(variantId),
            availability.findByVariantId(variantId),
          ]);
          if (
            !latest ||
            latest.preorder ||
            latest.onlineQuantity < 1 ||
            latest.quantity < 1 ||
            eligibility?.status !== 'available' ||
            !eligibility.canBuy
          )
            throw new Error('Availability changed before submission.');
          await provider.upsert(input);
        },
        remove: async (offerId) => {
          await beforeMutation();
          await provider.remove(offerId);
        },
      },
      isSourceFailure: (error) => error instanceof GoogleMerchantError && error.sourceStop,
      isQuotaFailure: (error) => error instanceof GoogleMerchantError && error.reason === 'quota',
      checkQuota: () => provider.checkQuota(),
      errorReason: (error) => (error instanceof GoogleMerchantError ? error.reason : 'source_uncertain'),
    });
    if (result.outcome !== 'skipped') {
      const record = { event: 'merchant_sync_outcome', ...result, durationMs: Date.now() - startedAt };
      if (result.failed || result.outcome !== 'completed') logger.warn(record);
      else logger.info(record);
    }
  } catch {
    logger.warn({
      event: 'merchant_sync_outcome',
      outcome: 'failed',
      safeReason: 'configuration_or_storage',
      durationMs: Date.now() - startedAt,
    });
  }
}
