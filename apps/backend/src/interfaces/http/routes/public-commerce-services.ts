import {
    CheckoutConfigurationError,
    CheckoutUnavailableError,
    listVariantOffersForStoreItem,
    readCheckoutState,
    readStoreOffer,
    startCheckout,
    StoreItemNotFoundError,
    VariantMismatchError,
} from '../../../application/commerce/checkout';
import type { AppBindings } from '../../../env';
import {
    createPrismaClient,
    PrismaItemAvailabilityRepository,
    PrismaStockRepository,
    PrismaStoreItemOptionRepository,
    PrismaVariantStripeMappingRepository,
} from '../../../infrastructure/persistence/prisma';
import { createStripeCheckoutGateway } from '../../../infrastructure/stripe';

export function createPublicCommerceServices(bindings: AppBindings) {
    const prisma = createPrismaClient(bindings);
    const storeItems = new PrismaStoreItemOptionRepository(prisma);
    const itemAvailability = new PrismaItemAvailabilityRepository(prisma);
    const stock = new PrismaStockRepository(prisma);
    const variantStripeMappings = new PrismaVariantStripeMappingRepository(prisma);

    return {
        disconnect: async () => prisma.$disconnect(),
        errors: {
            CheckoutConfigurationError,
            CheckoutUnavailableError,
            StoreItemNotFoundError,
            VariantMismatchError,
        },
        listVariantOffersForStoreItem: async (storeItemSlug: string) =>
            listVariantOffersForStoreItem(storeItems, itemAvailability, stock, storeItemSlug),
        readCheckoutState: async (checkoutSessionId: string) =>
            readCheckoutState(createStripeCheckoutGateway(bindings), checkoutSessionId),
        readStoreOffer: async (storeItemSlug: string) => readStoreOffer(storeItems, itemAvailability, stock, storeItemSlug),
        startCheckout: async (command: { returnUrl: string; storeItemSlug: string; variantId: string }) =>
            startCheckout(
                storeItems,
                itemAvailability,
                stock,
                variantStripeMappings,
                createStripeCheckoutGateway(bindings),
                command,
            ),
    };
}
