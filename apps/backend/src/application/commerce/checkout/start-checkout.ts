import type {
  CheckoutStockHoldRepository,
  CreateCheckoutStockHoldInput,
  ItemAvailabilityRepository,
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
  CheckoutCreationError,
  CustomPriceCartError,
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
import type { CheckoutSessionLineItem, CheckoutGateway, FeatureFlagReader, HostedCheckoutSession } from './spi';
import { quoteDelivery, type PackingPolicy } from './packing';
import { createPackingPolicy } from './packing-policy';

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

type StartCheckoutOptions = {
  now?: Date;
  packingPolicy?: PackingPolicy;
  monetaryPolicyReference?: string | null;
};

const CHECKOUT_HOLD_DURATION_MS = 35 * 60 * 1000;

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
  checkoutHolds: CheckoutStockHoldRepository,
  command: StartCheckoutCommand,
  featureFlags: FeatureFlagReader = enabledFeatureFlags,
  options: StartCheckoutOptions = {},
): Promise<Pick<HostedCheckoutSession, 'checkoutSessionId' | 'checkoutUrl'>> {
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

    if (!currentStock || Math.min(currentStock.quantity, currentStock.onlineQuantity) < quantity) {
      throw new CheckoutUnavailableError();
    }

    const productProjection = productProjections.findByStoreItem(storeItem);

    if (!productProjection) {
      throw new CatalogDriftError();
    }

    const catalogResult = await catalogReconciler.reconcileVariant(storeItem, {
      apply: true,
      applyProductProjection: false,
      productProjection,
    });
    const resolvedPrice = catalogResult.resolvedPrice;
    const offerPrice = resolvedPrice ? createStoreOfferPriceFromCatalogPrice(resolvedPrice) : null;

    if (!resolvedPrice || !offerPrice || hasBlockingCatalogIssue(catalogResult.issues)) {
      throw new CatalogDriftError();
    }

    const unitAmountMinor = offerPrice.kind === 'fixed' ? offerPrice.amountMinor : null;

    validatedLines.push({
      displayName: productProjection.name,
      lineAmountMinor: unitAmountMinor === null ? null : unitAmountMinor * quantity,
      optionLabel: null,
      quantity,
      storeItemSlug: line.storeItemSlug,
      stripePriceId: resolvedPrice.priceId,
      unitAmountMinor,
      variantId: line.variantId,
    });
  }

  if (
    validatedLines.some((line) => line.unitAmountMinor === null && (validatedLines.length !== 1 || line.quantity !== 1))
  ) {
    throw new CustomPriceCartError();
  }

  const createdAt = options.now ?? new Date();
  const delivery = quoteDelivery(validatedLines, options.packingPolicy ?? createPackingPolicy());
  if (!delivery || !options.monetaryPolicyReference?.trim()) throw new CheckoutUnavailableError();
  if (
    !Number.isSafeInteger(validatedLines.reduce((sum, line) => sum + (line.lineAmountMinor ?? 0), delivery.amountMinor))
  ) {
    throw new CheckoutUnavailableError();
  }
  const monetaryPolicy = {
    acceptedDeliveryAmountMinor: delivery.amountMinor,
    acceptedParcelTier: delivery.tier,
    monetaryPolicyReference: options.monetaryPolicyReference,
  };
  const checkoutExpiresAt = new Date(createdAt.getTime() + CHECKOUT_HOLD_DURATION_MS);
  const [firstLine, ...remainingLines] = validatedLines;
  const holdInput: CreateCheckoutStockHoldInput = {
    monetaryPolicy,
    checkoutExpiresAt,
    createdAt,
    lines: [firstLine!, ...remainingLines],
    orderId: crypto.randomUUID(),
  };
  let holdResult = await checkoutHolds.createPendingHold(holdInput);

  if (holdResult.kind === 'unavailable') {
    const [firstVariantId, ...remainingVariantIds] = validatedLines.map((line) => line.variantId);
    const expiredHolds = await checkoutHolds.listOldestExpiredSessionBoundHolds(
      [firstVariantId!, ...remainingVariantIds],
      createdAt,
    );
    let releasedAnyHold = false;

    try {
      for (const expiredHold of expiredHolds) {
        const providerSession = await checkoutGateway.readCheckoutSession(expiredHold.checkoutSessionId);

        if (providerSession.status === 'expired' && providerSession.paymentStatus !== 'paid') {
          releasedAnyHold = (await checkoutHolds.releaseSessionBoundHold(expiredHold, new Date())) || releasedAnyHold;
        }
      }
    } catch {
      throw new CheckoutUnavailableError();
    }

    if (releasedAnyHold) holdResult = await checkoutHolds.createPendingHold(holdInput);
  }

  if (holdResult.kind === 'unavailable') throw new CheckoutUnavailableError();

  let checkoutSession: HostedCheckoutSession;

  try {
    checkoutSession = await checkoutGateway.createHostedCheckoutSession({
      monetaryPolicy,
      cancelUrl: command.cancelUrl,
      checkoutExpiresAt,
      lineItems: validatedLines,
      newsletterOptIn: command.newsletterOptIn === true,
      orderId: holdResult.hold.id,
      successUrl: command.successUrl,
    });
  } catch (error) {
    if (error instanceof CheckoutCreationError && error.definitiveNonCreation) {
      await checkoutHolds.releaseSessionlessHold(holdResult.hold, new Date());
    } else if (error instanceof CheckoutCreationError && error.session) {
      await checkoutHolds.recoverCheckoutSession(
        holdResult.hold.id,
        error.session.checkoutSessionId,
        new Date(),
        error.session.checkoutExpiresAt,
      );
    }
    throw error;
  }

  let boundOrder;
  try {
    boundOrder = await checkoutHolds.bindCheckoutSession(
      holdResult.hold,
      checkoutSession.checkoutSessionId,
      new Date(),
      checkoutSession.checkoutExpiresAt,
    );
  } catch {
    // A failed write can still have committed; recover the same Session below.
    boundOrder = null;
  }

  if (!boundOrder) {
    const recovered = await checkoutHolds.recoverCheckoutSession(
      holdResult.hold.id,
      checkoutSession.checkoutSessionId,
      new Date(),
      checkoutSession.checkoutExpiresAt,
    );
    const expiredSession = await checkoutGateway.expireHostedCheckoutSession(checkoutSession.checkoutSessionId);
    if (recovered && expiredSession.status === 'expired' && expiredSession.paymentStatus !== 'paid') {
      await checkoutHolds.releaseSessionBoundHold(
        {
          id: holdResult.hold.id,
          checkoutSessionId: checkoutSession.checkoutSessionId,
          checkoutExpiresAt: checkoutSession.checkoutExpiresAt,
        },
        new Date(),
      );
    }

    throw new CheckoutUnavailableError();
  }

  return {
    checkoutSessionId: checkoutSession.checkoutSessionId,
    checkoutUrl: checkoutSession.checkoutUrl,
  };
}
