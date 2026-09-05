import {
  CheckoutConfigurationError,
  CheckoutUnavailableError,
  CatalogDriftError,
  NativeCheckoutDisabledError,
  listVariantOffersForStoreItem,
  readCheckoutState,
  readStoreCapabilities,
  readStoreOffer,
  startCheckout,
  StoreItemNotFoundError,
  VariantMismatchError,
  type StartCheckoutCommand,
} from '../../../application/commerce/checkout';
import { productEnvironmentProfileFromBindings, type AppBindings } from '../../../env';
import {
  createPrismaClient,
  PrismaItemAvailabilityRepository,
  PrismaOrderStateRepository,
  PrismaStoreOfferSnapshotRepository,
  PrismaStockRepository,
  PrismaStoreItemOptionRepository,
  PrismaVariantStripeMappingRepository,
} from '../../../infrastructure/persistence/prisma';
import { createFeatureFlagReader } from '../../../infrastructure/feature-flags';
import { createStripeCatalogGateway, createStripeCheckoutGateway } from '../../../infrastructure/stripe';
import {
  CatalogReconciler,
  createCurrentCatalogProductProjectionReader,
} from '../../../application/commerce/catalog-sync';
import type { AppLogger } from '../../../observability';
import { readStoreListingPrices } from '../../../application/commerce/readers';
import type { VariantId } from '../../../domain/commerce';
import { D1CheckoutStockHoldRepository } from '../../../infrastructure/persistence/d1-checkout-stock-hold-repository';

export function createPublicCommerceServices(bindings: AppBindings, logger?: Pick<AppLogger, 'warn'>) {
  const productEnvironmentProfile = productEnvironmentProfileFromBindings(bindings);
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
  const productProjections = createCurrentCatalogProductProjectionReader();
  const createCatalogReconciler = () =>
    new CatalogReconciler({
      environment: productEnvironmentProfile.workerDeploymentTarget,
      storeItems,
      storeOfferSnapshots,
      stripeCatalog: createStripeCatalogGateway(bindings),
      variantStripeMappings,
    });

  return {
    disconnect: async () => prisma.$disconnect(),
    errors: {
      CatalogDriftError,
      CheckoutConfigurationError,
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
        createCatalogReconciler(),
        productProjections,
        storeItemSlug,
      ),
    readCheckoutState: async (checkoutSessionId: string) =>
      readCheckoutState(createStripeCheckoutGateway(bindings), orders, checkoutSessionId),
    readStoreCapabilities: async () => readStoreCapabilities(createFeatureFlagReader(bindings, logger)),
    readStoreListingPrices: async () => readStoreListingPrices(storeOfferSnapshots),
    readStoreOffer: async (storeItemSlug: string) =>
      readStoreOffer(
        storeItems,
        itemAvailability,
        effectiveStock,
        createCatalogReconciler(),
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
      ),
  };
}
