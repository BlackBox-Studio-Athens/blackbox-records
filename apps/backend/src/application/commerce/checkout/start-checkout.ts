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
  StoreItemNotFoundError,
  VariantMismatchError,
} from './errors';
import { createPendingCheckoutOrder } from '../orders';
import type { CheckoutGateway, EmbeddedCheckoutSession } from './types';

export type StartCheckoutCommand = {
  returnUrl: string;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
};

export async function startCheckout(
  storeItems: StoreItemOptionRepository,
  itemAvailability: ItemAvailabilityRepository,
  stock: StockRepository,
  variantStripeMappings: VariantStripeMappingRepository,
  checkoutGateway: CheckoutGateway,
  orders: OrderStateRepository,
  command: StartCheckoutCommand,
): Promise<EmbeddedCheckoutSession> {
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
    storeItemSlug: command.storeItemSlug,
    variantId: command.variantId,
  });

  return checkoutSession;
}
