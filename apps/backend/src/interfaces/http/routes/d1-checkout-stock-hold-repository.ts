import {
  createStockQuantity,
  parseCheckoutSessionId,
  type CheckoutSessionId,
  type VariantId,
} from '../../../domain/commerce';
import type {
  CheckoutOrderLineRecord,
  CheckoutStockHoldRepository,
  CreateCheckoutStockHoldInput,
  CreateCheckoutStockHoldResult,
  ExpiredSessionBoundCheckoutHold,
  SessionBoundPendingCheckoutOrder,
  SessionlessNotPaidCheckoutOrder,
  SessionlessPendingCheckoutOrder,
} from '../../../domain/commerce/repositories/spi';

type EffectiveAvailabilityRow = {
  effectiveQuantity: number;
};

type ExpiredSessionBoundCheckoutHoldRow = {
  checkoutExpiresAt: string;
  checkoutSessionId: string;
  id: string;
};

export class D1CheckoutStockHoldRepository implements CheckoutStockHoldRepository {
  public constructor(private readonly db: D1Database) {}

  public async createPendingHold(input: CreateCheckoutStockHoldInput): Promise<CreateCheckoutStockHoldResult> {
    const [primaryLine] = input.lines;
    const lineRecords: CheckoutOrderLineRecord[] = input.lines.map((line) => ({
      createdAt: input.createdAt,
      id: crypto.randomUUID(),
      orderId: input.orderId,
      quantity: line.quantity,
      storeItemSlug: line.storeItemSlug,
      stripePriceId: line.stripePriceId,
      variantId: line.variantId,
    }));
    const availability = createAllAvailabilityClause(input.lines);
    const orderInsert = this.db
      .prepare(
        [
          'INSERT INTO "CheckoutOrder"',
          '  ("id", "storeItemSlug", "variantId", "checkoutSessionId", "checkoutExpiresAt", "stripePaymentIntentId",',
          '   "shippingLockerId", "shippingLockerCountryCode", "shippingLockerNameOrLabel", "status",',
          '   "statusUpdatedAt", "paidAt", "notPaidAt", "needsReviewAt", "createdAt", "updatedAt")',
          'SELECT ?, ?, ?, NULL, ?, NULL, NULL, NULL, NULL, ?, ?, NULL, NULL, NULL, ?, ?',
          `WHERE ${availability.sql}`,
        ].join('\n'),
      )
      .bind(
        input.orderId,
        primaryLine.storeItemSlug,
        primaryLine.variantId,
        input.checkoutExpiresAt.toISOString(),
        'pending_payment',
        input.createdAt.toISOString(),
        input.createdAt.toISOString(),
        input.createdAt.toISOString(),
        ...availability.params,
      );
    const lineInserts = lineRecords.map((line) =>
      this.db
        .prepare(
          [
            'INSERT INTO "CheckoutOrderLine"',
            '  ("id", "orderId", "storeItemSlug", "variantId", "stripePriceId", "quantity", "createdAt")',
            'SELECT ?, ?, ?, ?, ?, ?, ?',
            'WHERE EXISTS (SELECT 1 FROM "CheckoutOrder" WHERE "id" = ? AND "status" = ?)',
          ].join('\n'),
        )
        .bind(
          line.id,
          line.orderId,
          line.storeItemSlug,
          line.variantId,
          line.stripePriceId,
          line.quantity,
          line.createdAt.toISOString(),
          input.orderId,
          'pending_payment',
        ),
    );
    const [orderResult] = await this.db.batch([orderInsert, ...lineInserts]);

    if (readChangeCount(orderResult) === 0) {
      return { kind: 'unavailable' };
    }

    return {
      hold: {
        checkoutExpiresAt: input.checkoutExpiresAt,
        checkoutSessionId: null,
        createdAt: input.createdAt,
        id: input.orderId,
        lines: lineRecords,
        needsReviewAt: null,
        notPaidAt: null,
        paidAt: null,
        shippingLocker: null,
        status: 'pending_payment',
        statusUpdatedAt: input.createdAt,
        storeItemSlug: primaryLine.storeItemSlug,
        stripePaymentIntentId: null,
        updatedAt: input.createdAt,
        variantId: primaryLine.variantId,
      },
      kind: 'created',
    };
  }

  public async bindCheckoutSession(
    hold: SessionlessPendingCheckoutOrder,
    checkoutSessionId: CheckoutSessionId,
    boundAt: Date,
  ): Promise<SessionBoundPendingCheckoutOrder | null> {
    const result = await this.db
      .prepare(
        [
          'UPDATE "CheckoutOrder"',
          'SET "checkoutSessionId" = ?, "statusUpdatedAt" = ?, "updatedAt" = ?',
          'WHERE "id" = ? AND "status" = ? AND "checkoutSessionId" IS NULL',
        ].join('\n'),
      )
      .bind(checkoutSessionId, boundAt.toISOString(), boundAt.toISOString(), hold.id, 'pending_payment')
      .run();

    if (readChangeCount(result) === 0) return null;

    return {
      ...hold,
      checkoutSessionId,
      statusUpdatedAt: boundAt,
      updatedAt: boundAt,
    };
  }

  public async releaseSessionlessHold(
    hold: SessionlessPendingCheckoutOrder,
    releasedAt: Date,
  ): Promise<SessionlessNotPaidCheckoutOrder | null> {
    const result = await this.db
      .prepare(
        [
          'UPDATE "CheckoutOrder"',
          'SET "status" = ?, "notPaidAt" = ?, "statusUpdatedAt" = ?, "updatedAt" = ?',
          'WHERE "id" = ? AND "status" = ? AND "checkoutSessionId" IS NULL',
        ].join('\n'),
      )
      .bind(
        'not_paid',
        releasedAt.toISOString(),
        releasedAt.toISOString(),
        releasedAt.toISOString(),
        hold.id,
        'pending_payment',
      )
      .run();

    if (readChangeCount(result) === 0) return null;

    return {
      ...hold,
      notPaidAt: releasedAt,
      status: 'not_paid',
      statusUpdatedAt: releasedAt,
      updatedAt: releasedAt,
    };
  }

  public async findEffectiveAvailability(variantId: VariantId) {
    const row = await this.db
      .prepare(
        [
          'SELECT MAX(0, MIN("Stock"."quantity", "Stock"."onlineQuantity") - COALESCE((',
          '  SELECT SUM("CheckoutOrderLine"."quantity")',
          '  FROM "CheckoutOrderLine"',
          '  INNER JOIN "CheckoutOrder" ON "CheckoutOrder"."id" = "CheckoutOrderLine"."orderId"',
          '  WHERE "CheckoutOrderLine"."variantId" = ? AND "CheckoutOrder"."status" = ?',
          '), 0)) AS "effectiveQuantity"',
          'FROM "Stock"',
          'WHERE "Stock"."variantId" = ?',
        ].join('\n'),
      )
      .bind(variantId, 'pending_payment', variantId)
      .first<EffectiveAvailabilityRow>();

    return row ? createStockQuantity(row.effectiveQuantity) : null;
  }

  public async listOldestExpiredSessionBoundHolds(
    variantIds: [VariantId, ...VariantId[]],
    expiredAt: Date,
  ): Promise<ExpiredSessionBoundCheckoutHold[]> {
    const variantPlaceholders = variantIds.map(() => '?').join(', ');
    const result = await this.db
      .prepare(
        [
          'SELECT "id", "checkoutSessionId", "checkoutExpiresAt"',
          'FROM "CheckoutOrder"',
          'WHERE "status" = ? AND "checkoutSessionId" IS NOT NULL AND "checkoutExpiresAt" <= ?',
          '  AND EXISTS (',
          '    SELECT 1 FROM "CheckoutOrderLine"',
          '    WHERE "CheckoutOrderLine"."orderId" = "CheckoutOrder"."id"',
          `      AND "CheckoutOrderLine"."variantId" IN (${variantPlaceholders})`,
          '  )',
          'ORDER BY "checkoutExpiresAt" ASC, "createdAt" ASC, "id" ASC',
          'LIMIT 5',
        ].join('\n'),
      )
      .bind('pending_payment', expiredAt.toISOString(), ...variantIds)
      .all<ExpiredSessionBoundCheckoutHoldRow>();

    return result.results.map((row) => ({
      checkoutExpiresAt: new Date(row.checkoutExpiresAt),
      checkoutSessionId: parseCheckoutSessionId(row.checkoutSessionId),
      id: row.id,
    }));
  }

  public async recoverCheckoutSession(
    orderId: string,
    checkoutSessionId: CheckoutSessionId,
    recoveredAt: Date,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        [
          'UPDATE "CheckoutOrder"',
          'SET "checkoutSessionId" = ?, "statusUpdatedAt" = ?, "updatedAt" = ?',
          'WHERE "id" = ? AND "status" = ? AND "checkoutSessionId" IS NULL',
        ].join('\n'),
      )
      .bind(checkoutSessionId, recoveredAt.toISOString(), recoveredAt.toISOString(), orderId, 'pending_payment')
      .run();

    if (readChangeCount(result) === 1) return true;

    return Boolean(
      await this.db
        .prepare('SELECT 1 AS "found" FROM "CheckoutOrder" WHERE "id" = ? AND "checkoutSessionId" = ? LIMIT 1')
        .bind(orderId, checkoutSessionId)
        .first<{ found: number }>(),
    );
  }

  public async releaseSessionBoundHold(hold: ExpiredSessionBoundCheckoutHold, releasedAt: Date): Promise<boolean> {
    const releasedAtIso = releasedAt.toISOString();
    const result = await this.db
      .prepare(
        [
          'UPDATE "CheckoutOrder"',
          'SET "status" = ?, "notPaidAt" = ?, "statusUpdatedAt" = ?, "updatedAt" = ?',
          'WHERE "id" = ? AND "checkoutSessionId" = ? AND "status" = ? AND "checkoutExpiresAt" <= ?',
        ].join('\n'),
      )
      .bind(
        'not_paid',
        releasedAtIso,
        releasedAtIso,
        releasedAtIso,
        hold.id,
        hold.checkoutSessionId,
        'pending_payment',
        releasedAtIso,
      )
      .run();

    return readChangeCount(result) === 1;
  }
}

function createAllAvailabilityClause(lines: CreateCheckoutStockHoldInput['lines']): {
  params: Array<number | string>;
  sql: string;
} {
  const params: Array<number | string> = [];
  const clauses = lines.map((line) => {
    params.push(line.variantId, line.variantId, 'pending_payment', line.quantity);

    return [
      'EXISTS (',
      '  SELECT 1 FROM "Stock"',
      '  WHERE "Stock"."variantId" = ?',
      '    AND MAX(0, MIN("Stock"."quantity", "Stock"."onlineQuantity") - COALESCE((',
      '      SELECT SUM("CheckoutOrderLine"."quantity")',
      '      FROM "CheckoutOrderLine"',
      '      INNER JOIN "CheckoutOrder" ON "CheckoutOrder"."id" = "CheckoutOrderLine"."orderId"',
      '      WHERE "CheckoutOrderLine"."variantId" = ? AND "CheckoutOrder"."status" = ?',
      '    ), 0)) >= ?',
      ')',
    ].join('\n');
  });

  return { params, sql: clauses.join('\nAND ') };
}

function readChangeCount(result: D1Result | undefined): number {
  return typeof result?.meta?.changes === 'number' ? result.meta.changes : 0;
}
