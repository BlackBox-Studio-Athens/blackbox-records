import {
  CheckoutOrderNotFoundError,
  createPaidOrderDeliveryId,
  InvalidOrderTransitionError,
  type FinalizePaidCheckoutCommand,
  type PaidCheckoutFinalizationLineItem,
  type PaidCheckoutFinalizationRepository,
  type PaidCheckoutFinalizationResult,
} from '../../../application/commerce/orders';
import {
  createCartQuantity,
  createStockChangeDelta,
  createStockQuantity,
  parseCheckoutSessionId,
  parsePaymentIntentId,
  parseStoreItemSlug,
  parseStripePriceId,
  parseVariantId,
  type CheckoutSessionId,
  type VariantId,
} from '../../../domain/commerce';
import type {
  CheckoutOrderLineRecord,
  CheckoutOrderRecord,
  OrderStatus,
  StockChangeRecord,
  StockRecord,
} from '../../../domain/commerce/repositories/spi';
import { readPaidCheckoutFulfillment } from '../../../domain/commerce/repositories/spi';

type D1Value = null | number | string;

type CheckoutOrderRow = {
  amountTotalMinor: null | number;
  checkoutSessionId: null | string;
  checkoutExpiresAt: string;
  createdAt: string;
  currencyCode: null | string;
  id: string;
  needsReviewAt: null | string;
  newsletterConsentAt: null | string;
  newsletterConsentCopyVersion: null | string;
  newsletterOptIn: boolean | number | null;
  notPaidAt: null | string;
  paidAt: null | string;
  recipientName: null | string;
  shopperEmail: null | string;
  shopperPhone: null | string;
  shippingAddressCity: null | string;
  shippingAddressCountryCode: null | string;
  shippingAddressLine1: null | string;
  shippingAddressLine2: null | string;
  shippingAddressPostalCode: null | string;
  shippingAddressState: null | string;
  shippingLockerCountryCode: null | string;
  shippingLockerId: null | string;
  shippingLockerNameOrLabel: null | string;
  status: OrderStatus;
  statusUpdatedAt: string;
  storeItemSlug: string;
  stripePaymentIntentId: null | string;
  updatedAt: string;
  variantId: string;
};

type CheckoutOrderLineRow = {
  createdAt: string;
  displayName: null | string;
  id: string;
  lineAmountMinor: null | number;
  optionLabel: null | string;
  orderId: string;
  quantity: number;
  storeItemSlug: string;
  stripePriceId: null | string;
  unitAmountMinor: null | number;
  variantId: string;
};

type GroupedLineItem = {
  lineAmountMinor: number;
  quantity: number;
  stockChangeId: string;
  unitAmountMinor: number;
  variantId: VariantId;
};

const paidOrderDeliveryKinds = ['shopper_confirmation', 'ops_fulfillment'] as const;

type StockRow = {
  createdAt: string;
  onlineQuantity: number;
  quantity: number;
  updatedAt: string;
  variantId: string;
};

type StockChangeRow = {
  actorEmail: string;
  id: string;
  notes: null | string;
  quantityDelta: number;
  reason: string;
  recordedAt: string;
  variantId: string;
};

const checkoutOrderSelectSql = [
  'SELECT',
  '  "id",',
  '  "storeItemSlug",',
  '  "variantId",',
  '  "checkoutSessionId",',
  '  "checkoutExpiresAt",',
  '  "stripePaymentIntentId",',
  '  "amountTotalMinor",',
  '  "currencyCode",',
  '  "recipientName",',
  '  "shopperEmail",',
  '  "shopperPhone",',
  '  "shippingAddressLine1",',
  '  "shippingAddressLine2",',
  '  "shippingAddressCity",',
  '  "shippingAddressPostalCode",',
  '  "shippingAddressState",',
  '  "shippingAddressCountryCode",',
  '  "newsletterOptIn",',
  '  "newsletterConsentAt",',
  '  "newsletterConsentCopyVersion",',
  '  "shippingLockerId",',
  '  "shippingLockerCountryCode",',
  '  "shippingLockerNameOrLabel",',
  '  "status",',
  '  "statusUpdatedAt",',
  '  "paidAt",',
  '  "notPaidAt",',
  '  "needsReviewAt",',
  '  "createdAt",',
  '  "updatedAt"',
  'FROM "CheckoutOrder"',
  'WHERE "checkoutSessionId" = ?',
].join('\n');

const checkoutOrderLinesSql = [
  'SELECT',
  '  "id",',
  '  "orderId",',
  '  "storeItemSlug",',
  '  "variantId",',
  '  "stripePriceId",',
  '  "displayName",',
  '  "optionLabel",',
  '  "quantity",',
  '  "unitAmountMinor",',
  '  "lineAmountMinor",',
  '  "createdAt"',
  'FROM "CheckoutOrderLine"',
  'WHERE "orderId" = ?',
  'ORDER BY "createdAt" ASC, "id" ASC',
].join('\n');

const stockSelectSql = [
  'SELECT "variantId", "quantity", "onlineQuantity", "createdAt", "updatedAt"',
  'FROM "Stock"',
  'WHERE "variantId" = ?',
].join('\n');

const stockChangeSelectSql = [
  'SELECT "id", "variantId", "quantityDelta", "reason", "notes", "actorEmail", "recordedAt"',
  'FROM "StockChange"',
  'WHERE "id" = ?',
].join('\n');

export class D1PaidCheckoutFinalizationRepository implements PaidCheckoutFinalizationRepository {
  public constructor(private readonly db: D1Database) {}

  public async finalizePaidCheckout(command: FinalizePaidCheckoutCommand): Promise<PaidCheckoutFinalizationResult> {
    const currentOrder = await this.findOrder(command.checkoutSessionId);

    if (!currentOrder) {
      throw new CheckoutOrderNotFoundError(command.checkoutSessionId);
    }

    if (currentOrder.status === 'paid') {
      return {
        kind: 'replay',
        order: currentOrder,
        paidFulfillment: readPaidCheckoutFulfillment(currentOrder),
      };
    }

    if (currentOrder.status !== 'pending_payment') {
      throw new InvalidOrderTransitionError(`Order cannot transition from ${currentOrder.status} to paid.`);
    }

    const groupedLineItems = groupLineItems(command.checkoutSessionId, command.lineItems);
    const unavailableStock = await this.findUnavailableStock(groupedLineItems);

    if (unavailableStock) {
      return {
        kind: 'stock_unavailable',
        order: currentOrder,
        reason: 'Paid checkout cannot decrement unavailable stock.',
      };
    }

    const batchResult = await this.db.batch(this.createFinalizationBatch(command, groupedLineItems, currentOrder.id));
    const orderUpdateResult = batchResult.at(-1);

    if (readChangeCount(orderUpdateResult) === 0) {
      const latestOrder = await this.findOrder(command.checkoutSessionId);

      if (latestOrder?.status === 'paid') {
        return {
          kind: 'replay',
          order: latestOrder,
          paidFulfillment: readPaidCheckoutFulfillment(latestOrder),
        };
      }

      return {
        kind: 'stock_unavailable',
        order: latestOrder ?? currentOrder,
        reason: 'Paid checkout cannot decrement unavailable stock.',
      };
    }

    const transitionedOrder = await this.findOrder(command.checkoutSessionId);

    if (!transitionedOrder) {
      throw new CheckoutOrderNotFoundError(command.checkoutSessionId);
    }

    return {
      kind: 'transitioned',
      order: transitionedOrder,
      stock: await Promise.all(groupedLineItems.map((lineItem) => this.findRequiredStock(lineItem.variantId))),
      stockChanges: await Promise.all(
        groupedLineItems.map((lineItem) => this.findRequiredStockChange(lineItem.stockChangeId)),
      ),
    };
  }

  private createFinalizationBatch(
    command: FinalizePaidCheckoutCommand,
    lineItems: GroupedLineItem[],
    orderId: string,
  ): D1PreparedStatement[] {
    const transitionedAt = command.transitionedAt.toISOString();
    const stockAvailableClause = createAllStockAvailableClause(lineItems);
    const stockChangesExistClause = createAllStockChangesExistClause(lineItems);
    const lineSnapshotsCompleteClause = createAllLineSnapshotsCompleteClause(orderId, lineItems);
    const deliveryKinds = command.newsletterOptIn
      ? [...paidOrderDeliveryKinds, 'newsletter_registration' as const]
      : [...paidOrderDeliveryKinds];
    const deliveriesExistClause = createAllDeliveriesExistClause(orderId, deliveryKinds);
    const statements: D1PreparedStatement[] = [];

    for (const lineItem of lineItems) {
      statements.push(
        this.db
          .prepare(
            [
              'UPDATE "CheckoutOrderLine"',
              'SET "quantity" = ?, "unitAmountMinor" = ?, "lineAmountMinor" = ?',
              'WHERE "orderId" = ? AND "variantId" = ?',
              'AND EXISTS (',
              '  SELECT 1 FROM "CheckoutOrder"',
              '  WHERE "id" = ? AND "checkoutSessionId" = ? AND "status" = ?',
              ')',
            ].join('\n'),
          )
          .bind(
            lineItem.quantity,
            lineItem.unitAmountMinor,
            lineItem.lineAmountMinor,
            orderId,
            lineItem.variantId,
            orderId,
            command.checkoutSessionId,
            'pending_payment',
          ),
      );
    }

    for (const lineItem of lineItems) {
      statements.push(
        this.db
          .prepare(
            [
              'INSERT OR IGNORE INTO "StockChange"',
              '  ("id", "variantId", "quantityDelta", "reason", "notes", "actorEmail", "recordedAt")',
              'SELECT ?, ?, ?, ?, ?, ?, ?',
              'WHERE EXISTS (',
              '  SELECT 1 FROM "CheckoutOrder"',
              '  WHERE "checkoutSessionId" = ? AND "status" = ?',
              ')',
              `AND ${stockAvailableClause.sql}`,
              `AND ${lineSnapshotsCompleteClause.sql}`,
            ].join('\n'),
          )
          .bind(
            lineItem.stockChangeId,
            lineItem.variantId,
            lineItem.quantity * -1,
            'checkout_paid',
            `Checkout session ${command.checkoutSessionId}`,
            'stripe-webhook',
            transitionedAt,
            command.checkoutSessionId,
            'pending_payment',
            ...stockAvailableClause.params,
            ...lineSnapshotsCompleteClause.params,
          ),
      );
    }

    for (const lineItem of lineItems) {
      statements.push(
        this.db
          .prepare(
            [
              'UPDATE "Stock"',
              'SET "quantity" = "quantity" - ?,',
              '    "onlineQuantity" = "onlineQuantity" - ?,',
              '    "updatedAt" = ?',
              'WHERE "variantId" = ?',
              'AND EXISTS (',
              '  SELECT 1 FROM "CheckoutOrder"',
              '  WHERE "checkoutSessionId" = ? AND "status" = ?',
              ')',
              `AND ${stockChangesExistClause.sql}`,
            ].join('\n'),
          )
          .bind(
            lineItem.quantity,
            lineItem.quantity,
            transitionedAt,
            lineItem.variantId,
            command.checkoutSessionId,
            'pending_payment',
            ...stockChangesExistClause.params,
          ),
      );
    }

    for (const kind of deliveryKinds) {
      statements.push(
        this.db
          .prepare(
            [
              'INSERT OR IGNORE INTO "PaidOrderDelivery"',
              '  ("id", "orderId", "kind", "status", "attemptCount", "nextAttemptAt", "leaseUntil",',
              '   "providerMessageId", "safeReason", "deliveredAt", "needsReviewAt", "createdAt", "updatedAt")',
              'SELECT ?, ?, ?, ?, 0, ?, NULL, NULL, NULL, NULL, NULL, ?, ?',
              'WHERE EXISTS (',
              '  SELECT 1 FROM "CheckoutOrder"',
              '  WHERE "id" = ? AND "checkoutSessionId" = ? AND "status" = ?',
              ')',
              `AND ${stockChangesExistClause.sql}`,
              `AND ${lineSnapshotsCompleteClause.sql}`,
            ].join('\n'),
          )
          .bind(
            createPaidOrderDeliveryId(orderId, kind),
            orderId,
            kind,
            'pending',
            transitionedAt,
            transitionedAt,
            transitionedAt,
            orderId,
            command.checkoutSessionId,
            'pending_payment',
            ...stockChangesExistClause.params,
            ...lineSnapshotsCompleteClause.params,
          ),
      );
    }

    statements.push(
      this.db
        .prepare(
          [
            'UPDATE "CheckoutOrder"',
            'SET "status" = ?,',
            '    "statusUpdatedAt" = ?,',
            '    "paidAt" = ?,',
            '    "amountTotalMinor" = ?,',
            '    "currencyCode" = ?,',
            '    "recipientName" = ?,',
            '    "shopperEmail" = ?,',
            '    "shopperPhone" = ?,',
            '    "shippingAddressLine1" = ?,',
            '    "shippingAddressLine2" = ?,',
            '    "shippingAddressCity" = ?,',
            '    "shippingAddressPostalCode" = ?,',
            '    "shippingAddressState" = ?,',
            '    "shippingAddressCountryCode" = ?,',
            '    "newsletterOptIn" = ?,',
            '    "newsletterConsentAt" = ?,',
            '    "newsletterConsentCopyVersion" = ?,',
            '    "stripePaymentIntentId" = COALESCE(?, "stripePaymentIntentId"),',
            '    "updatedAt" = ?',
            'WHERE "checkoutSessionId" = ?',
            'AND "status" = ?',
            lineItems.length ? `AND ${stockChangesExistClause.sql}` : '',
            lineItems.length ? `AND ${lineSnapshotsCompleteClause.sql}` : '',
            `AND ${deliveriesExistClause.sql}`,
          ]
            .filter(Boolean)
            .join('\n'),
        )
        .bind(
          'paid',
          transitionedAt,
          transitionedAt,
          command.amountTotalMinor,
          command.currencyCode,
          command.recipientName,
          command.shopperEmail,
          command.shopperPhone,
          command.shippingAddressLine1,
          command.shippingAddressLine2,
          command.shippingAddressCity,
          command.shippingAddressPostalCode,
          command.shippingAddressState,
          command.shippingAddressCountryCode,
          command.newsletterOptIn ? 1 : 0,
          command.newsletterConsentAt?.toISOString() ?? null,
          command.newsletterConsentCopyVersion,
          command.stripePaymentIntentId,
          transitionedAt,
          command.checkoutSessionId,
          'pending_payment',
          ...stockChangesExistClause.params,
          ...lineSnapshotsCompleteClause.params,
          ...deliveriesExistClause.params,
        ),
    );

    return statements;
  }

  private async findOrder(checkoutSessionId: CheckoutSessionId): Promise<CheckoutOrderRecord | null> {
    const row = await this.db.prepare(checkoutOrderSelectSql).bind(checkoutSessionId).first<CheckoutOrderRow>();

    if (!row) return null;

    return mapCheckoutOrder(row, await this.findOrderLines(row.id));
  }

  private async findOrderLines(orderId: string): Promise<CheckoutOrderLineRecord[]> {
    const { results } = await this.db.prepare(checkoutOrderLinesSql).bind(orderId).all<CheckoutOrderLineRow>();

    return (results ?? []).map(mapCheckoutOrderLine);
  }

  private async findRequiredStock(variantId: VariantId): Promise<StockRecord> {
    const row = await this.db.prepare(stockSelectSql).bind(variantId).first<StockRow>();

    if (!row) {
      throw new Error(`Stock record was not found for variant ${variantId}.`);
    }

    return mapStock(row);
  }

  private async findRequiredStockChange(id: string): Promise<StockChangeRecord> {
    const row = await this.db.prepare(stockChangeSelectSql).bind(id).first<StockChangeRow>();

    if (!row) {
      throw new Error(`Stock change record was not found for paid checkout finalization ${id}.`);
    }

    return mapStockChange(row);
  }

  private async findUnavailableStock(lineItems: GroupedLineItem[]): Promise<GroupedLineItem | null> {
    for (const lineItem of lineItems) {
      const stock = await this.db.prepare(stockSelectSql).bind(lineItem.variantId).first<StockRow>();

      if (!stock || stock.quantity < lineItem.quantity || stock.onlineQuantity < lineItem.quantity) {
        return lineItem;
      }
    }

    return null;
  }
}

function createAllStockAvailableClause(lineItems: GroupedLineItem[]): { params: D1Value[]; sql: string } {
  return createAllClause(
    lineItems,
    'EXISTS (SELECT 1 FROM "Stock" WHERE "variantId" = ? AND "quantity" >= ? AND "onlineQuantity" >= ?)',
    (lineItem) => [lineItem.variantId, lineItem.quantity, lineItem.quantity],
  );
}

function createAllStockChangesExistClause(lineItems: GroupedLineItem[]): { params: D1Value[]; sql: string } {
  return createAllClause(lineItems, 'EXISTS (SELECT 1 FROM "StockChange" WHERE "id" = ?)', (lineItem) => [
    lineItem.stockChangeId,
  ]);
}

function createAllLineSnapshotsCompleteClause(
  orderId: string,
  lineItems: GroupedLineItem[],
): { params: D1Value[]; sql: string } {
  return createAllClause(
    lineItems,
    'EXISTS (SELECT 1 FROM "CheckoutOrderLine" WHERE "orderId" = ? AND "variantId" = ? AND "quantity" = ? AND "unitAmountMinor" = ? AND "lineAmountMinor" = ?)',
    (lineItem) => [orderId, lineItem.variantId, lineItem.quantity, lineItem.unitAmountMinor, lineItem.lineAmountMinor],
  );
}

function createAllDeliveriesExistClause(
  orderId: string,
  kinds: ReadonlyArray<'newsletter_registration' | 'ops_fulfillment' | 'shopper_confirmation'>,
): { params: D1Value[]; sql: string } {
  return createAllClause(
    kinds,
    'EXISTS (SELECT 1 FROM "PaidOrderDelivery" WHERE "orderId" = ? AND "kind" = ?)',
    (kind) => [orderId, kind],
  );
}

function createAllClause<T>(
  lineItems: readonly T[],
  sql: string,
  readParams: (lineItem: T) => D1Value[],
): { params: D1Value[]; sql: string } {
  if (!lineItems.length) {
    return {
      params: [],
      sql: '1 = 1',
    };
  }

  return {
    params: lineItems.flatMap(readParams),
    sql: lineItems.map(() => sql).join(' AND '),
  };
}

function groupLineItems(
  checkoutSessionId: CheckoutSessionId,
  lineItems: PaidCheckoutFinalizationLineItem[],
): GroupedLineItem[] {
  const quantityByVariantId = new Map<VariantId, number>();
  const amountByVariantId = new Map<VariantId, number>();
  const unitAmountByVariantId = new Map<VariantId, number>();

  for (const lineItem of lineItems) {
    quantityByVariantId.set(lineItem.variantId, (quantityByVariantId.get(lineItem.variantId) ?? 0) + lineItem.quantity);
    amountByVariantId.set(
      lineItem.variantId,
      (amountByVariantId.get(lineItem.variantId) ?? 0) + lineItem.lineAmountMinor,
    );
    unitAmountByVariantId.set(lineItem.variantId, lineItem.unitAmountMinor);
  }

  return [...quantityByVariantId].map(([variantId, quantity]) => ({
    lineAmountMinor: amountByVariantId.get(variantId)!,
    quantity: createCartQuantity(quantity),
    stockChangeId: createPaidCheckoutStockChangeId(checkoutSessionId, variantId),
    unitAmountMinor: unitAmountByVariantId.get(variantId)!,
    variantId,
  }));
}

function createPaidCheckoutStockChangeId(checkoutSessionId: CheckoutSessionId, variantId: VariantId): string {
  return `checkout_paid:${checkoutSessionId}:${variantId}`;
}

function mapCheckoutOrder(row: CheckoutOrderRow, lines: CheckoutOrderLineRecord[]): CheckoutOrderRecord {
  return {
    amountTotalMinor: row.amountTotalMinor,
    checkoutSessionId: row.checkoutSessionId ? parseCheckoutSessionId(row.checkoutSessionId) : null,
    checkoutExpiresAt: new Date(row.checkoutExpiresAt),
    createdAt: new Date(row.createdAt),
    currencyCode: row.currencyCode,
    id: row.id,
    needsReviewAt: row.needsReviewAt ? new Date(row.needsReviewAt) : null,
    newsletterConsentAt: row.newsletterConsentAt ? new Date(row.newsletterConsentAt) : null,
    newsletterConsentCopyVersion: row.newsletterConsentCopyVersion,
    newsletterOptIn: row.newsletterOptIn === null ? null : Boolean(row.newsletterOptIn),
    notPaidAt: row.notPaidAt ? new Date(row.notPaidAt) : null,
    paidAt: row.paidAt ? new Date(row.paidAt) : null,
    recipientName: row.recipientName,
    shopperEmail: row.shopperEmail,
    shopperPhone: row.shopperPhone,
    shippingAddressCity: row.shippingAddressCity,
    shippingAddressCountryCode: row.shippingAddressCountryCode,
    shippingAddressLine1: row.shippingAddressLine1,
    shippingAddressLine2: row.shippingAddressLine2,
    shippingAddressPostalCode: row.shippingAddressPostalCode,
    shippingAddressState: row.shippingAddressState,
    shippingLocker:
      row.shippingLockerId && row.shippingLockerCountryCode === 'GR' && row.shippingLockerNameOrLabel
        ? {
            country_code: row.shippingLockerCountryCode,
            locker_id: row.shippingLockerId,
            locker_name_or_label: row.shippingLockerNameOrLabel,
          }
        : null,
    status: row.status,
    statusUpdatedAt: new Date(row.statusUpdatedAt),
    storeItemSlug: parseStoreItemSlug(row.storeItemSlug),
    stripePaymentIntentId: row.stripePaymentIntentId ? parsePaymentIntentId(row.stripePaymentIntentId) : null,
    updatedAt: new Date(row.updatedAt),
    variantId: parseVariantId(row.variantId),
    lines,
  };
}

function mapCheckoutOrderLine(row: CheckoutOrderLineRow): CheckoutOrderLineRecord {
  return {
    createdAt: new Date(row.createdAt),
    displayName: row.displayName,
    id: row.id,
    lineAmountMinor: row.lineAmountMinor,
    optionLabel: row.optionLabel,
    orderId: row.orderId,
    quantity: createCartQuantity(row.quantity),
    stripePriceId: row.stripePriceId ? parseStripePriceId(row.stripePriceId) : null,
    storeItemSlug: parseStoreItemSlug(row.storeItemSlug),
    unitAmountMinor: row.unitAmountMinor,
    variantId: parseVariantId(row.variantId),
  };
}

function mapStock(row: StockRow): StockRecord {
  return {
    createdAt: new Date(row.createdAt),
    onlineQuantity: createStockQuantity(row.onlineQuantity),
    quantity: createStockQuantity(row.quantity),
    updatedAt: new Date(row.updatedAt),
    variantId: parseVariantId(row.variantId),
  };
}

function mapStockChange(row: StockChangeRow): StockChangeRecord {
  return {
    actorEmail: row.actorEmail,
    id: row.id,
    notes: row.notes,
    quantityDelta: createStockChangeDelta(row.quantityDelta),
    reason: row.reason,
    recordedAt: new Date(row.recordedAt),
    variantId: parseVariantId(row.variantId),
  };
}

function readChangeCount(result: D1Result | undefined): number {
  return Number(result?.meta.changes ?? 0);
}
