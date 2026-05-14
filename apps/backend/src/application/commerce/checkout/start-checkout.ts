import type {
  ItemAvailabilityRepository,
  OrderStateRepository,
  StockRepository,
  StoreItemOptionRepository,
  StoreItemSlug,
  VariantId,
  VariantStripeMappingRepository,
} from '../../../domain/commerce/repositories';
import {
  CheckoutConfigurationError,
  CheckoutUnavailableError,
  NativeCheckoutDisabledError,
  StoreItemNotFoundError,
  VariantMismatchError,
} from './errors';
import { createPendingCheckoutOrder } from '../orders/create-pending-checkout-order';
import { validateCheckoutShippingLocker } from './checkout-shipping';
import type { FeatureFlagReader } from './feature-gates';
import type {
  CheckoutGateway,
  CheckoutShippingLockerSnapshot,
  EmbeddedCheckoutSession,
  EmbeddedCheckoutSessionLineItem,
} from './types';

export type StartCheckoutCommand = {
  lines?: StartCheckoutLineCommand[];
  returnUrl: string;
  shippingLocker: CheckoutShippingLockerSnapshot;
  storeItemSlug?: StoreItemSlug;
  variantId?: VariantId;
};

export type StartCheckoutLineCommand = {
  quantity: number;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
};

const enabledFeatureFlags: FeatureFlagReader = {
  isNativeCheckoutEnabled: async () => true,
};

function legacySingleCheckoutLine(command: StartCheckoutCommand): StartCheckoutLineCommand[] {
  if (!command.storeItemSlug || !command.variantId) return [];

  return [
    {
      quantity: 1,
      storeItemSlug: command.storeItemSlug,
      variantId: command.variantId,
    },
  ];
}

function validateCheckoutQuantity(quantity: number): number {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9) {
    throw new CheckoutUnavailableError();
  }

  return quantity;
}

function mergeCheckoutLines(lines: StartCheckoutLineCommand[]): StartCheckoutLineCommand[] {
  const mergedLines = new Map<string, StartCheckoutLineCommand>();

  for (const line of lines) {
    const key = `${line.storeItemSlug}:${line.variantId}`;
    const existingLine = mergedLines.get(key);
    const quantity = validateCheckoutQuantity(line.quantity);

    mergedLines.set(key, {
      quantity: validateCheckoutQuantity((existingLine?.quantity ?? 0) + quantity),
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
  variantStripeMappings: VariantStripeMappingRepository,
  checkoutGateway: CheckoutGateway,
  orders: OrderStateRepository,
  command: StartCheckoutCommand,
  featureFlags: FeatureFlagReader = enabledFeatureFlags,
): Promise<EmbeddedCheckoutSession> {
  if (!(await featureFlags.isNativeCheckoutEnabled())) {
    throw new NativeCheckoutDisabledError();
  }

  const shippingLocker = validateCheckoutShippingLocker(command.shippingLocker);
  const requestedLines = mergeCheckoutLines(
    command.lines && command.lines.length > 0 ? command.lines : legacySingleCheckoutLine(command),
  );

  if (requestedLines.length === 0) {
    throw new CheckoutUnavailableError();
  }

  const validatedLines: EmbeddedCheckoutSessionLineItem[] = [];

  for (const line of requestedLines) {
    const quantity = validateCheckoutQuantity(line.quantity);
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

    const stripeMapping = await variantStripeMappings.findByVariantId(line.variantId);

    if (!stripeMapping) {
      throw new CheckoutConfigurationError();
    }

    validatedLines.push({
      adjustableQuantityMaximum: Math.min(currentStock.onlineQuantity, 9),
      quantity,
      storeItemSlug: line.storeItemSlug,
      stripePriceId: stripeMapping.stripePriceId,
      variantId: line.variantId,
    });
  }

  const checkoutSession = await checkoutGateway.createEmbeddedCheckoutSession({
    lineItems: validatedLines,
    returnUrl: command.returnUrl,
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
    shippingLocker,
    storeItemSlug: primaryLine.storeItemSlug,
    variantId: primaryLine.variantId,
  });

  return checkoutSession;
}
