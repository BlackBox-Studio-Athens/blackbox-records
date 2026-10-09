import {
  CheckoutConfigurationError,
  CheckoutIdempotencyConflictError,
  CheckoutRetryableError,
  CheckoutAttemptTerminalError,
  CheckoutUnavailableError,
  NativeCheckoutDisabledError,
  listVariantOffersForStoreItem,
  readCheckoutState,
  readStoreCapabilities,
  readStoreOffer,
  requestAvailabilityAlert,
  AvailabilityAlertCapReachedError,
  AvailabilityAlertIneligibleError,
  startCheckout,
  StoreItemNotFoundError,
  VariantMismatchError,
  createPackingPolicy,
  quoteDelivery,
  currentMonetaryPolicyReference,
  deliveryCharges,
  taxCollectionDisclosure,
  type StartCheckoutCommand,
} from '../../../application/commerce/checkout';
import { productEnvironmentProfileFromBindings, type AppBindings } from '../../../platform/env';
import {
  createPrismaClient,
  PrismaItemAvailabilityRepository,
  PrismaOrderStateRepository,
  PrismaStoreOfferSnapshotRepository,
  PrismaStockRepository,
  PrismaStoreItemOptionRepository,
  PrismaVariantStripeMappingRepository,
} from '../../../infrastructure/persistence/prisma';
import { createFeatureFlagReader } from '../../../application/commerce/checkout/feature-flags';
import { createStripeCatalogGateway, createStripeCheckoutGateway } from '../../../infrastructure/stripe';
import {
  CatalogDriftError,
  CatalogReconciler,
  createRuntimeCatalogProductProjectionReader,
} from '../../../application/commerce/catalog-sync';
import type { AppLogger } from '../../../platform/observability';
import { readStoreListingPrices } from '../../../application/commerce/checkout/readers';
import { resolveTaxCollectionMode, type VariantId } from '../../../domain/commerce';
import { D1AvailabilityAlertRepository } from '../../../infrastructure/persistence/d1-availability-alert-repository';
import { D1CheckoutStockHoldRepository } from '../../../infrastructure/persistence/d1-checkout-stock-hold-repository';

export async function readPublicStoreCapabilities(bindings: AppBindings, logger?: Pick<AppLogger, 'warn'>) {
  const mode = resolveTaxCollectionMode(
    currentMonetaryPolicyReference(productEnvironmentProfileFromBindings(bindings).workerDeploymentTarget),
  )!;
  return {
    ...(await readStoreCapabilities(createFeatureFlagReader(bindings, logger))),
    pricing: {
      vatDisclosure: taxCollectionDisclosure(mode),
      taxCollectionMode: mode,
      deliveryCharges,
      currencyCode: 'EUR' as const,
    },
  };
}

export function createPublicCommerceServices(bindings: AppBindings, logger?: Pick<AppLogger, 'warn'>) {
  const productEnvironmentProfile = productEnvironmentProfileFromBindings(bindings);
  const target = productEnvironmentProfile.workerDeploymentTarget;
  const monetaryPolicyReference = currentMonetaryPolicyReference(target);
  const taxCollectionMode = resolveTaxCollectionMode(monetaryPolicyReference)!;
  const packingPolicy = createPackingPolicy(target, /^[sr]k_test_/.test(bindings.STRIPE_SECRET_KEY));
  const prisma = createPrismaClient(bindings);
  const storeItems = new PrismaStoreItemOptionRepository(prisma);
  const itemAvailability = new PrismaItemAvailabilityRepository(prisma);
  const stock = new PrismaStockRepository(prisma);
  const checkoutHolds = new D1CheckoutStockHoldRepository(bindings.COMMERCE_DB);
  const effectiveStock = {
    findByVariantId: async (variantId: VariantId) => {
      const [currentStock, effectiveAvailability] = await Promise.all([
        stock.findByVariantId(variantId),
        checkoutHolds.findEffectiveAvailability(variantId),
      ]);

      return currentStock && effectiveAvailability !== null
        ? { ...currentStock, onlineQuantity: effectiveAvailability }
        : null;
    },
  };
  const variantStripeMappings = new PrismaVariantStripeMappingRepository(prisma);
  const storeOfferSnapshots = new PrismaStoreOfferSnapshotRepository(prisma);
  const orders = new PrismaOrderStateRepository(prisma);
  const productProjections = createRuntimeCatalogProductProjectionReader(storeItems, target);
  const createCatalogReconciler = (publicRead = false) =>
    new CatalogReconciler({
      environment: productEnvironmentProfile.workerDeploymentTarget,
      storeItems,
      storeOfferSnapshots,
      stripeCatalog: createStripeCatalogGateway(bindings, publicRead ? { timeout: 3000, maxNetworkRetries: 0 } : {}),
      variantStripeMappings,
    });

  return {
    disconnect: async () => prisma.$disconnect(),
    errors: {
      AvailabilityAlertCapReachedError,
      AvailabilityAlertIneligibleError,
      CatalogDriftError,
      CheckoutConfigurationError,
      CheckoutIdempotencyConflictError,
      CheckoutRetryableError,
      CheckoutAttemptTerminalError,
      CheckoutUnavailableError,
      NativeCheckoutDisabledError,
      StoreItemNotFoundError,
      VariantMismatchError,
    },
    listVariantOffersForStoreItem: async (storeItemSlug: string) =>
      listVariantOffersForStoreItem(
        storeItems,
        itemAvailability,
        effectiveStock,
        createCatalogReconciler(true),
        productProjections,
        storeItemSlug,
      ),
    readCheckoutState: async (checkoutSessionId: string) =>
      readCheckoutState(createStripeCheckoutGateway(bindings), orders, checkoutSessionId),
    quoteDelivery: async (lines: { storeItemSlug: string; variantId: string; quantity: number }[]) => {
      const merged = new Map<string, { storeItemSlug: string; variantId: string; quantity: number }>();
      for (const line of lines) {
        const existing = merged.get(line.variantId);
        const quantity = (existing?.quantity ?? 0) + line.quantity;
        if (
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 9 ||
          (existing && existing.storeItemSlug !== line.storeItemSlug)
        )
          return null;
        merged.set(line.variantId, { ...line, quantity });
      }
      const quote = quoteDelivery([...merged.values()], packingPolicy);
      if (!quote) return null;
      let merchandiseGrossMinor: number | null = 0;
      for (const line of merged.values()) {
        const offer = await readStoreOffer(
          storeItems,
          itemAvailability,
          effectiveStock,
          createCatalogReconciler(true),
          productProjections,
          line.storeItemSlug,
        );
        if (!offer?.canCheckout || offer.variantId !== line.variantId) return null;
        const availableStock = await effectiveStock.findByVariantId(offer.variantId);
        if (!availableStock || availableStock.onlineQuantity < line.quantity) return null;
        if (offer.price.kind === 'pay_what_you_want') {
          if (merged.size !== 1 || line.quantity !== 1) return null;
          merchandiseGrossMinor = null;
        } else if (merchandiseGrossMinor !== null) {
          merchandiseGrossMinor += offer.price.amountMinor * line.quantity;
        }
      }
      const totalAmountMinor = merchandiseGrossMinor === null ? null : merchandiseGrossMinor + quote.amountMinor;
      if (totalAmountMinor !== null && !Number.isSafeInteger(totalAmountMinor)) return null;
      return { ...quote, merchandiseGrossMinor, totalAmountMinor, taxCollectionMode };
    },
    requestAvailabilityAlert: async (storeItemSlug: string, email: string) =>
      requestAvailabilityAlert(
        await readStoreOffer(
          storeItems,
          itemAvailability,
          effectiveStock,
          createCatalogReconciler(true),
          productProjections,
          storeItemSlug,
        ),
        new D1AvailabilityAlertRepository(bindings.COMMERCE_DB),
        { storeItemSlug, email, consentedAt: new Date() },
      ),
    readStoreListingPrices: async (scope?: 'preorders') => readStoreListingPrices(storeOfferSnapshots, scope),
    readStoreOffer: async (storeItemSlug: string) =>
      readStoreOffer(
        storeItems,
        itemAvailability,
        effectiveStock,
        createCatalogReconciler(true),
        productProjections,
        storeItemSlug,
      ),
    startCheckout: async (command: StartCheckoutCommand) =>
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        createCatalogReconciler(),
        productProjections,
        createStripeCheckoutGateway(bindings),
        checkoutHolds,
        command,
        createFeatureFlagReader(bindings, logger),
        {
          packingPolicy,
          monetaryPolicyReference,
          productEnvironment: productEnvironmentProfile.productEnvironment,
        },
      ),
  };
}
