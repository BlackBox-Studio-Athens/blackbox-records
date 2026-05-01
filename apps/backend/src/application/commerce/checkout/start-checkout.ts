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
import { createPendingCheckoutOrder } from '../orders';
import { validateCheckoutShippingLocker } from './checkout-shipping';
import type { FeatureFlagReader } from './feature-gates';
import type { CheckoutGateway, CheckoutShippingLockerSnapshot, EmbeddedCheckoutSession } from './types';

export type StartCheckoutCommand = {
  returnUrl: string;
  shippingLocker: CheckoutShippingLockerSnapshot;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
};

const enabledFeatureFlags: FeatureFlagReader = {
  isNativeCheckoutEnabled: async () => true,
};

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

  const storeItem = await storeItems.findByStoreItemSlug(command.storeItemSlug);

  if (!storeItem) {
    throw new StoreItemNotFoundError(command.storeItemSlug);
  }

  if (storeItem.variantId !== command.variantId) {
    throw new VariantMismatchError();
  }

  const availability = await itemAvailability.findByVariantId(command.variantId);

  if (!availability || availability.status !== 'available' || !availability.canBuy) {
    throw new CheckoutUnavailableError();
  }

  const currentStock = await stock.findByVariantId(command.variantId);

  if (!currentStock || currentStock.onlineQuantity <= 0) {
    throw new CheckoutUnavailableError();
  }

  const stripeMapping = await variantStripeMappings.findByVariantId(command.variantId);

  if (!stripeMapping) {
    throw new CheckoutConfigurationError();
  }

  const checkoutSession = await checkoutGateway.createEmbeddedCheckoutSession({
    returnUrl: command.returnUrl,
    storeItemSlug: command.storeItemSlug,
    stripePriceId: stripeMapping.stripePriceId,
    variantId: command.variantId,
  });

  await createPendingCheckoutOrder(orders, {
    checkoutSessionId: checkoutSession.checkoutSessionId,
    shippingLocker,
    storeItemSlug: command.storeItemSlug,
    variantId: command.variantId,
  });

  return checkoutSession;
}
