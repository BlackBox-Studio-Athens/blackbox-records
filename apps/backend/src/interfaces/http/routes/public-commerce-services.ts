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
import {
  isCatalogMutationEnabledFromBindings,
  productEnvironmentProfileFromBindings,
  type AppBindings,
} from '../../../env';
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

export function createPublicCommerceServices(bindings: AppBindings, logger?: Pick<AppLogger, 'warn'>) {
  const productEnvironmentProfile = productEnvironmentProfileFromBindings(bindings);
  const prisma = createPrismaClient(bindings);
  const storeItems = new PrismaStoreItemOptionRepository(prisma);
  const itemAvailability = new PrismaItemAvailabilityRepository(prisma);
  const stock = new PrismaStockRepository(prisma);
  const variantStripeMappings = new PrismaVariantStripeMappingRepository(prisma);
  const storeOfferSnapshots = new PrismaStoreOfferSnapshotRepository(prisma);
  const orders = new PrismaOrderStateRepository(prisma);
  const productProjections = createCurrentCatalogProductProjectionReader();
  const catalogMutationEnabled = isCatalogMutationEnabledFromBindings(bindings);
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
        stock,
        createCatalogReconciler(),
        productProjections,
        storeItemSlug,
        { applyCatalogMutations: catalogMutationEnabled },
      ),
    readCheckoutState: async (checkoutSessionId: string) =>
      readCheckoutState(createStripeCheckoutGateway(bindings), orders, checkoutSessionId),
    readStoreCapabilities: async () => readStoreCapabilities(createFeatureFlagReader(bindings, logger)),
    readStoreListingPrices: async () => readStoreListingPrices(storeOfferSnapshots),
    readStoreOffer: async (storeItemSlug: string) =>
      readStoreOffer(
        storeItems,
        itemAvailability,
        stock,
        createCatalogReconciler(),
        productProjections,
        storeItemSlug,
        {
          applyCatalogMutations: catalogMutationEnabled,
        },
      ),
    startCheckout: async (command: StartCheckoutCommand) =>
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        createCatalogReconciler(),
        productProjections,
        createStripeCheckoutGateway(bindings),
        orders,
        command,
        createFeatureFlagReader(bindings, logger),
        { applyCatalogMutations: catalogMutationEnabled },
      ),
  };
}
