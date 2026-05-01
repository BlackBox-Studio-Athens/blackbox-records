import {
  CheckoutConfigurationError,
  CheckoutShippingSelectionError,
  CheckoutUnavailableError,
  NativeCheckoutDisabledError,
  listVariantOffersForStoreItem,
  readCheckoutState,
  readStoreCapabilities,
  readStoreOffer,
  startCheckout,
  StoreItemNotFoundError,
  VariantMismatchError,
  type CheckoutShippingLockerSnapshot,
} from '../../../application/commerce/checkout';
import type { AppBindings } from '../../../env';
import {
  createPrismaClient,
  PrismaItemAvailabilityRepository,
  PrismaOrderStateRepository,
  PrismaStockRepository,
  PrismaStoreItemOptionRepository,
  PrismaVariantStripeMappingRepository,
} from '../../../infrastructure/persistence/prisma';
import { createFeatureFlagReader } from '../../../infrastructure/feature-flags';
import { createStripeCheckoutGateway } from '../../../infrastructure/stripe';

export function createPublicCommerceServices(bindings: AppBindings) {
  const prisma = createPrismaClient(bindings);
  const storeItems = new PrismaStoreItemOptionRepository(prisma);
  const itemAvailability = new PrismaItemAvailabilityRepository(prisma);
  const stock = new PrismaStockRepository(prisma);
  const variantStripeMappings = new PrismaVariantStripeMappingRepository(prisma);
  const orders = new PrismaOrderStateRepository(prisma);

  return {
    disconnect: async () => prisma.$disconnect(),
    errors: {
      CheckoutConfigurationError,
      CheckoutShippingSelectionError,
      CheckoutUnavailableError,
      NativeCheckoutDisabledError,
      StoreItemNotFoundError,
      VariantMismatchError,
    },
    listVariantOffersForStoreItem: async (storeItemSlug: string) =>
      listVariantOffersForStoreItem(storeItems, itemAvailability, stock, storeItemSlug),
    readCheckoutState: async (checkoutSessionId: string) =>
      readCheckoutState(createStripeCheckoutGateway(bindings), orders, checkoutSessionId),
    readStoreCapabilities: async () => readStoreCapabilities(createFeatureFlagReader(bindings)),
    readStoreOffer: async (storeItemSlug: string) => readStoreOffer(storeItems, itemAvailability, stock, storeItemSlug),
    startCheckout: async (command: {
      returnUrl: string;
      shippingLocker: CheckoutShippingLockerSnapshot;
      storeItemSlug: string;
      variantId: string;
    }) =>
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        variantStripeMappings,
        createStripeCheckoutGateway(bindings),
        orders,
        command,
        createFeatureFlagReader(bindings),
      ),
  };
}
