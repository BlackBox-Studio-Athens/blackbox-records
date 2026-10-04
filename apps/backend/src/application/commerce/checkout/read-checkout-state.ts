import type { OrderStateRepository } from '../../../domain/commerce/repositories/spi';
import {
  createCheckoutOrderReferenceToken,
  latestShipEstimate,
  parseCheckoutSessionId,
} from '../../../domain/commerce';
import { reconcileCheckoutSession } from './reconcile-checkout-session';
import type { CheckoutGateway } from './spi';
import type { CheckoutState } from './types';

export async function readCheckoutState(
  checkoutGateway: CheckoutGateway,
  orders: OrderStateRepository,
  checkoutSessionId: unknown,
): Promise<CheckoutState> {
  const parsedCheckoutSessionId = parseCheckoutSessionId(checkoutSessionId);
  const [session, order] = await Promise.all([
    checkoutGateway.readCheckoutSession(parsedCheckoutSessionId),
    orders.findByCheckoutSessionId(parsedCheckoutSessionId),
  ]);
  const estimates = order?.lines?.flatMap((line) => (line.preorder ? [line.preorder.shipEstimate] : [])) ?? [];

  return {
    ...reconcileCheckoutSession(session).checkoutState,
    ...(session.paymentStatus === 'paid' &&
    order?.status === 'paid' &&
    order.lines?.length &&
    order.lines.every((line) => line.displayName?.trim() && Number.isInteger(line.quantity) && line.quantity > 0)
      ? {
          orderSnapshot: {
            reference: createCheckoutOrderReferenceToken({
              checkoutSessionId: parsedCheckoutSessionId,
              orderId: order.id,
              referenceDate: order.paidAt,
            }),
            lines: order.lines.map((line) => ({
              displayName: line.displayName ?? '',
              optionLabel: line.optionLabel,
              quantity: line.quantity,
              storeItemSlug: line.storeItemSlug,
              preorder: line.preorder ? { shipEstimate: line.preorder.shipEstimate } : null,
            })),
          },
        }
      : {}),
    orderStatus: order?.status ?? null,
    preorder: estimates.length ? { shipEstimate: latestShipEstimate(estimates) } : null,
    shippingLocker: order?.shippingLocker ?? null,
  };
}
