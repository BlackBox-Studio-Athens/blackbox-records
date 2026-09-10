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
  createPackingPolicy,
  quoteDelivery,
  hostedMonetaryPolicyReference,
  deliveryCharges,
  vatDisclosure,
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
  const target = productEnvironmentProfile.workerDeploymentTarget;
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
    readStoreCapabilities: async () => ({
      ...(await readStoreCapabilities(createFeatureFlagReader(bindings, logger))),
      pricing: { vatDisclosure, deliveryCharges, currencyCode: 'EUR' as const },
    }),
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
          createCatalogReconciler(),
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
      return { ...quote, merchandiseGrossMinor, totalAmountMinor };
    },
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
        {
          packingPolicy,
          monetaryPolicyReference: packingPolicy.allowSynthetic
            ? `synthetic-${target}-inclusive-v1`
            : hostedMonetaryPolicyReference,
        },
      ),
  };
}
