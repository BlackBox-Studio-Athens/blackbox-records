import type {
  CheckoutOrderLineRecord,
  CheckoutOrderRecord,
  CheckoutOrderTransitionInput,
  CreatePendingCheckoutOrderInput,
  ListRecentCheckoutOrdersInput,
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
  shippingLockerCountryCode: string | null;
  shippingLockerId: string | null;
  shippingLockerNameOrLabel: string | null;
  status: OrderStatus;
  statusUpdatedAt: Date;
  storeItemSlug: string;
  stripePaymentIntentId: string | null;
  updatedAt: Date;
  variantId: string;
  lines?: CheckoutOrderLineRecord[];
}): CheckoutOrderRecord {
  return {
    checkoutSessionId: record.checkoutSessionId,
    createdAt: record.createdAt,
    id: record.id,
    needsReviewAt: record.needsReviewAt,
    notPaidAt: record.notPaidAt,
    paidAt: record.paidAt,
    shippingLocker:
      record.shippingLockerId && record.shippingLockerCountryCode === 'GR' && record.shippingLockerNameOrLabel
        ? {
            country_code: record.shippingLockerCountryCode,
            locker_id: record.shippingLockerId,
            locker_name_or_label: record.shippingLockerNameOrLabel,
          }
        : null,
    status: record.status,
    statusUpdatedAt: record.statusUpdatedAt,
    storeItemSlug: record.storeItemSlug,
    stripePaymentIntentId: record.stripePaymentIntentId,
    updatedAt: record.updatedAt,
    variantId: record.variantId,
    lines: record.lines ?? [],
  };
}

type CheckoutOrderLineRow = {
  id: string;
  orderId: string;
  stripePriceId: string | null;
  storeItemSlug: string;
  variantId: string;
  quantity: number;
  createdAt: Date | string;
};

function mapCheckoutOrderLine(row: CheckoutOrderLineRow): CheckoutOrderLineRecord {
  return {
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    id: row.id,
    orderId: row.orderId,
    quantity: row.quantity,
    stripePriceId: row.stripePriceId,
    storeItemSlug: row.storeItemSlug,
    variantId: row.variantId,
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
        shippingLockerCountryCode: input.shippingLocker.country_code,
        shippingLockerId: input.shippingLocker.locker_id,
        shippingLockerNameOrLabel: input.shippingLocker.locker_name_or_label,
        status: 'pending_payment',
        statusUpdatedAt: createdAt,
        storeItemSlug: input.storeItemSlug,
        stripePaymentIntentId: input.stripePaymentIntentId ?? null,
        variantId: input.variantId,
      },
    });

    const lines = await this.createCheckoutOrderLines(
      record.id,
      input.lines ?? [{ quantity: 1, storeItemSlug: input.storeItemSlug, variantId: input.variantId }],
      createdAt,
    );

    return mapCheckoutOrder({ ...record, lines });
  }

  public async findByCheckoutSessionId(checkoutSessionId: string): Promise<CheckoutOrderRecord | null> {
    const record = await this.prisma.checkoutOrder.findUnique({
      where: { checkoutSessionId },
    });

    if (!record) return null;

    return mapCheckoutOrder({ ...record, lines: await this.readCheckoutOrderLines(record.id) });
  }

  public async listRecent(input: ListRecentCheckoutOrdersInput): Promise<CheckoutOrderRecord[]> {
    const records = await this.prisma.checkoutOrder.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      where: input.status
        ? {
            status: input.status,
          }
        : undefined,
    });

    return Promise.all(
      records.map(async (record) =>
        mapCheckoutOrder({ ...record, lines: await this.readCheckoutOrderLines(record.id) }),
      ),
    );
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

    return mapCheckoutOrder({ ...record, lines: await this.readCheckoutOrderLines(record.id) });
  }

  private async createCheckoutOrderLines(
    orderId: string,
    lines: NonNullable<CreatePendingCheckoutOrderInput['lines']>,
    createdAt: Date,
  ): Promise<CheckoutOrderLineRecord[]> {
    const createdLines: CheckoutOrderLineRecord[] = [];

    for (const line of lines) {
      const id = crypto.randomUUID();

      await this.prisma.$executeRawUnsafe(
        'INSERT INTO "CheckoutOrderLine" ("id", "orderId", "storeItemSlug", "variantId", "stripePriceId", "quantity", "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?)',
        id,
        orderId,
        line.storeItemSlug,
        line.variantId,
        line.stripePriceId ?? null,
        line.quantity,
        createdAt,
      );

      createdLines.push({
        createdAt,
        id,
        orderId,
        quantity: line.quantity,
        stripePriceId: line.stripePriceId ?? null,
        storeItemSlug: line.storeItemSlug,
        variantId: line.variantId,
      });
    }

    return createdLines;
  }

  private async readCheckoutOrderLines(orderId: string): Promise<CheckoutOrderLineRecord[]> {
    const rows = await this.prisma.$queryRawUnsafe<CheckoutOrderLineRow[]>(
      'SELECT "id", "orderId", "storeItemSlug", "variantId", "stripePriceId", "quantity", "createdAt" FROM "CheckoutOrderLine" WHERE "orderId" = ? ORDER BY "createdAt" ASC, "id" ASC',
      orderId,
    );

    return rows.map(mapCheckoutOrderLine);
  }
}
