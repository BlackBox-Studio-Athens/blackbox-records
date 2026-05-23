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
import type { AppBindings } from '../../../env';
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
import { CatalogReconciler } from '../../../application/commerce/catalog-sync';

export function createPublicCommerceServices(bindings: AppBindings) {
  const prisma = createPrismaClient(bindings);
  const storeItems = new PrismaStoreItemOptionRepository(prisma);
  const itemAvailability = new PrismaItemAvailabilityRepository(prisma);
  const stock = new PrismaStockRepository(prisma);
  const variantStripeMappings = new PrismaVariantStripeMappingRepository(prisma);
  const storeOfferSnapshots = new PrismaStoreOfferSnapshotRepository(prisma);
  const orders = new PrismaOrderStateRepository(prisma);
  const createCatalogReconciler = () =>
    new CatalogReconciler({
      environment: bindings.APP_ENV,
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
      listVariantOffersForStoreItem(storeItems, itemAvailability, stock, createCatalogReconciler(), storeItemSlug),
    readCheckoutState: async (checkoutSessionId: string) =>
      readCheckoutState(createStripeCheckoutGateway(bindings), orders, checkoutSessionId),
    readStoreCapabilities: async () => readStoreCapabilities(createFeatureFlagReader(bindings)),
    readStoreOffer: async (storeItemSlug: string) =>
      readStoreOffer(storeItems, itemAvailability, stock, createCatalogReconciler(), storeItemSlug),
    startCheckout: async (command: StartCheckoutCommand) =>
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        createCatalogReconciler(),
        createStripeCheckoutGateway(bindings),
        orders,
        command,
        createFeatureFlagReader(bindings),
      ),
  };
}
