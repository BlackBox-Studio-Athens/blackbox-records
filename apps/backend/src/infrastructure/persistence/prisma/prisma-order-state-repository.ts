import type {
  CheckoutOrderRecord,
  CheckoutOrderTransitionInput,
  CreatePendingCheckoutOrderInput,
  OrderStateRepository,
  OrderStatus,
} from '../../../domain/commerce/repositories';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapCheckoutOrder(record: {
  checkoutSessionId: string;
  createdAt: Date;
  id: string;
  needsReviewAt: Date | null;
  notPaidAt: Date | null;
  paidAt: Date | null;
  status: OrderStatus;
  statusUpdatedAt: Date;
  storeItemSlug: string;
  stripePaymentIntentId: string | null;
  updatedAt: Date;
  variantId: string;
}): CheckoutOrderRecord {
  return {
    checkoutSessionId: record.checkoutSessionId,
    createdAt: record.createdAt,
    id: record.id,
    needsReviewAt: record.needsReviewAt,
    notPaidAt: record.notPaidAt,
    paidAt: record.paidAt,
    status: record.status,
    statusUpdatedAt: record.statusUpdatedAt,
    storeItemSlug: record.storeItemSlug,
    stripePaymentIntentId: record.stripePaymentIntentId,
    updatedAt: record.updatedAt,
    variantId: record.variantId,
  };
}

export class PrismaOrderStateRepository implements OrderStateRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async createPending(input: CreatePendingCheckoutOrderInput): Promise<CheckoutOrderRecord> {
    const createdAt = input.createdAt ?? new Date();
    const record = await this.prisma.checkoutOrder.create({
      data: {
        checkoutSessionId: input.checkoutSessionId,
        createdAt,
        status: 'pending_payment',
        statusUpdatedAt: createdAt,
        storeItemSlug: input.storeItemSlug,
        stripePaymentIntentId: input.stripePaymentIntentId ?? null,
        variantId: input.variantId,
      },
    });

    return mapCheckoutOrder(record);
  }

  public async findByCheckoutSessionId(checkoutSessionId: string): Promise<CheckoutOrderRecord | null> {
    const record = await this.prisma.checkoutOrder.findUnique({
      where: { checkoutSessionId },
    });

    return record ? mapCheckoutOrder(record) : null;
  }

  public async saveTransition(
    checkoutSessionId: string,
    transition: CheckoutOrderTransitionInput,
  ): Promise<CheckoutOrderRecord | null> {
    const current = await this.prisma.checkoutOrder.findUnique({
      where: { checkoutSessionId },
    });

    if (!current) {
      return null;
    }

    const record = await this.prisma.checkoutOrder.update({
      data: {
        needsReviewAt: transition.status === 'needs_review' ? transition.statusUpdatedAt : current.needsReviewAt,
        notPaidAt: transition.status === 'not_paid' ? transition.statusUpdatedAt : current.notPaidAt,
        paidAt: transition.status === 'paid' ? transition.statusUpdatedAt : current.paidAt,
        status: transition.status,
        statusUpdatedAt: transition.statusUpdatedAt,
        stripePaymentIntentId: transition.stripePaymentIntentId ?? current.stripePaymentIntentId,
      },
      where: { checkoutSessionId },
    });

    return mapCheckoutOrder(record);
  }
}
