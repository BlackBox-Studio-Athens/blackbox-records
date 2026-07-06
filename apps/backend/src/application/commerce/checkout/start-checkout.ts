import type {
  ItemAvailabilityRepository,
  OrderStateRepository,
  StockRepository,
  StoreItemOptionRepository,
} from '../../../domain/commerce/repositories/spi';
import {
  createCartQuantity,
  parseStoreItemSlug,
  parseVariantId,
  type CartQuantity,
  type StoreItemSlug,
  type VariantId,
} from '../../../domain/commerce';
import {
  CheckoutUnavailableError,
  NativeCheckoutDisabledError,
  StoreItemNotFoundError,
  VariantMismatchError,
} from './errors';
import {
  CatalogDriftError,
  createStoreOfferPriceFromCatalogPrice,
  hasBlockingCatalogIssue,
  type CatalogProductProjectionReader,
  type CatalogReconciler,
} from '../catalog-sync';
import { createPendingCheckoutOrder } from '../orders/create-pending-checkout-order';
import type { CheckoutSessionLineItem, CheckoutGateway, FeatureFlagReader, HostedCheckoutSession } from './spi';

export type StartCheckoutCommand = {
  cancelUrl: string;
  lines?: StartCheckoutLineCommand[];
  newsletterOptIn?: boolean;
  successUrl: string;
  storeItemSlug?: StoreItemSlug;
  variantId?: VariantId;
};

export type StartCheckoutLineCommand = {
  quantity: CartQuantity;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
};

type CatalogMutationPolicy = {
  applyCatalogMutations?: boolean;
};

const enabledFeatureFlags: FeatureFlagReader = {
  isNativeCheckoutEnabled: async () => true,
};

function legacySingleCheckoutLine(command: StartCheckoutCommand): StartCheckoutLineCommand[] {
  if (!command.storeItemSlug || !command.variantId) return [];

  return [
    {
      quantity: createCartQuantity(1),
      storeItemSlug: command.storeItemSlug,
      variantId: command.variantId,
    },
  ];
}

export function createStartCheckoutLineCommand(input: {
  quantity: unknown;
  storeItemSlug: unknown;
  variantId: unknown;
}): StartCheckoutLineCommand {
  try {
    return {
      quantity: createCartQuantity(input.quantity),
      storeItemSlug: parseStoreItemSlug(input.storeItemSlug),
      variantId: parseVariantId(input.variantId),
    };
  } catch {
    throw new CheckoutUnavailableError();
  }
}

function createCheckoutQuantity(value: unknown): CartQuantity {
  try {
    return createCartQuantity(value);
  } catch {
    throw new CheckoutUnavailableError();
  }
}

function mergeCheckoutLines(lines: StartCheckoutLineCommand[]): StartCheckoutLineCommand[] {
  const mergedLines = new Map<string, StartCheckoutLineCommand>();

  for (const line of lines) {
    const key = `${line.storeItemSlug}:${line.variantId}`;
    const existingLine = mergedLines.get(key);

    mergedLines.set(key, {
      quantity: createCheckoutQuantity((existingLine?.quantity ?? 0) + line.quantity),
      storeItemSlug: line.storeItemSlug,
      variantId: line.variantId,
    });
  }

  return [...mergedLines.values()];
}

export async function startCheckout(
  storeItems: StoreItemOptionRepository,
  itemAvailability: ItemAvailabilityRepository,
  stock: StockRepository,
  catalogReconciler: Pick<CatalogReconciler, 'reconcileVariant'>,
  productProjections: CatalogProductProjectionReader,
  checkoutGateway: CheckoutGateway,
  orders: OrderStateRepository,
  command: StartCheckoutCommand,
  featureFlags: FeatureFlagReader = enabledFeatureFlags,
  options: CatalogMutationPolicy = {},
): Promise<HostedCheckoutSession> {
  if (!(await featureFlags.isNativeCheckoutEnabled())) {
    throw new NativeCheckoutDisabledError();
  }

  const requestedLines = mergeCheckoutLines(
    command.lines && command.lines.length > 0 ? command.lines : legacySingleCheckoutLine(command),
  );

  if (requestedLines.length === 0) {
    throw new CheckoutUnavailableError();
  }

  const validatedLines: CheckoutSessionLineItem[] = [];

  for (const line of requestedLines) {
    const quantity = line.quantity;
    const storeItem = await storeItems.findByStoreItemSlug(line.storeItemSlug);

    if (!storeItem) {
      throw new StoreItemNotFoundError(line.storeItemSlug);
    }

    if (storeItem.variantId !== line.variantId) {
      throw new VariantMismatchError();
    }

    const availability = await itemAvailability.findByVariantId(line.variantId);

    if (!availability || availability.status !== 'available' || !availability.canBuy) {
      throw new CheckoutUnavailableError();
    }

    const currentStock = await stock.findByVariantId(line.variantId);

    if (!currentStock || currentStock.onlineQuantity < quantity) {
      throw new CheckoutUnavailableError();
    }

    const productProjection = productProjections.findByStoreItem(storeItem);

    if (!productProjection) {
      throw new CatalogDriftError();
    }

    const catalogResult = await catalogReconciler.reconcileVariant(storeItem, {
      apply: options.applyCatalogMutations ?? true,
      productProjection,
    });
    const resolvedPrice = catalogResult.resolvedPrice;

    if (
      !resolvedPrice ||
      !createStoreOfferPriceFromCatalogPrice(resolvedPrice) ||
      hasBlockingCatalogIssue(catalogResult.issues)
    ) {
      throw new CatalogDriftError();
    }

    validatedLines.push({
      quantity,
      storeItemSlug: line.storeItemSlug,
      stripePriceId: resolvedPrice.priceId,
      variantId: line.variantId,
    });
  }

  const checkoutSession = await checkoutGateway.createHostedCheckoutSession({
    cancelUrl: command.cancelUrl,
    lineItems: validatedLines,
    newsletterOptIn: command.newsletterOptIn === true,
    successUrl: command.successUrl,
  });

  const primaryLine = validatedLines[0]!;

  await createPendingCheckoutOrder(orders, {
    checkoutSessionId: checkoutSession.checkoutSessionId,
    lines: validatedLines.map((line) => ({
      quantity: line.quantity,
      stripePriceId: line.stripePriceId,
      storeItemSlug: line.storeItemSlug,
      variantId: line.variantId,
    })),
    shippingLocker: null,
    storeItemSlug: primaryLine.storeItemSlug,
    variantId: primaryLine.variantId,
  });

  return checkoutSession;
}
