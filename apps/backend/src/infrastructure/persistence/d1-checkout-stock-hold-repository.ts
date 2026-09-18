import {
  createCartQuantity,
  createStockQuantity,
  parseStoreItemSlug,
  parseCheckoutSessionId,
  parseStripePriceId,
  parseVariantId,
  type CheckoutSessionId,
  type VariantId,
} from '../../domain/commerce';
import type {
  CheckoutRetryAttempt,
  CheckoutOrderLineRecord,
  CheckoutStockHoldRepository,
  CreateCheckoutStockHoldInput,
  CreateCheckoutStockHoldResult,
  ExpiredSessionBoundCheckoutHold,
  SessionBoundPendingCheckoutOrder,
  SessionlessNotPaidCheckoutOrder,
  SessionlessPendingCheckoutOrder,
} from '../../domain/commerce/repositories/spi';
import { EMPTY_PAID_CHECKOUT_ORDER_FIELDS } from '../../domain/commerce/repositories/spi';
import type { RequestIdentity } from '../../domain/commerce/repositories/request-identity';

type EffectiveAvailabilityRow = {
  effectiveQuantity: number;
};

type ExpiredSessionBoundCheckoutHoldRow = {
  checkoutExpiresAt: string;
  checkoutSessionId: string;
  id: string;
};

type CheckoutRetryAttemptRow = {
  acceptedDeliveryAmountMinor: number | null;
  acceptedParcelTier: string | null;
  checkoutCancelUrl: string | null;
  checkoutExpiresAt: string;
  checkoutSessionId: string | null;
  checkoutSuccessUrl: string | null;
  checkoutUrl: string | null;
  id: string;
  idempotencyFingerprint: string | null;
  monetaryPolicyReference: string | null;
  newsletterOptIn: number | null;
  status: 'pending_payment' | 'paid' | 'not_paid' | 'needs_review';
};

type CheckoutRetryLineRow = {
  createdAt: string;
  displayName: string | null;
  id: string;
  lineAmountMinor: number | null;
  optionLabel: string | null;
  orderId: string;
  quantity: number;
  storeItemSlug: string;
  stripePriceId: string | null;
  unitAmountMinor: number | null;
  variantId: string;
};

export class D1CheckoutStockHoldRepository implements CheckoutStockHoldRepository {
  public constructor(private readonly db: D1Database) {}

  public async createPendingHold(input: CreateCheckoutStockHoldInput): Promise<CreateCheckoutStockHoldResult> {
    const [primaryLine] = input.lines;
    const lineRecords: CheckoutOrderLineRecord[] = input.lines.map((line) => ({
      createdAt: input.createdAt,
      displayName: line.displayName,
      id: crypto.randomUUID(),
      lineAmountMinor: line.lineAmountMinor,
      optionLabel: line.optionLabel,
      orderId: input.orderId,
      quantity: line.quantity,
      storeItemSlug: line.storeItemSlug,
      stripePriceId: line.stripePriceId,
      unitAmountMinor: line.unitAmountMinor,
      variantId: line.variantId,
    }));
    const availability = createAllAvailabilityClause(input.lines);
    const orderInsert = this.db
      .prepare(
        [
          'INSERT INTO "CheckoutOrder"',
          '  ("id", "storeItemSlug", "variantId", "checkoutSessionId", "checkoutUrl", "checkoutCancelUrl", "checkoutSuccessUrl",',
          '   "idempotencyKeyDigest", "idempotencyFingerprint", "idempotencyEnvironment", "checkoutProviderClaimToken", "checkoutProviderLeaseUntil",',
          '   "checkoutExpiresAt", "stripePaymentIntentId",',
          '   "shippingLockerId", "shippingLockerCountryCode", "shippingLockerNameOrLabel", "status",',
          '   "statusUpdatedAt", "paidAt", "notPaidAt", "needsReviewAt", "createdAt", "updatedAt",',
          '   "acceptedDeliveryAmountMinor", "acceptedParcelTier", "monetaryPolicyReference", "newsletterOptIn")',
          'SELECT ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, NULL, NULL, ?, NULL, NULL, NULL, NULL, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?',
          `WHERE ${availability.sql}`,
        ].join('\n'),
      )
      .bind(
        input.orderId,
        primaryLine.storeItemSlug,
        primaryLine.variantId,
        input.checkoutCancelUrl ?? null,
        input.checkoutSuccessUrl ?? null,
        input.requestIdentity?.keyDigest ?? null,
        input.requestIdentity?.requestFingerprint ?? null,
        input.requestIdentity?.productEnvironment ?? null,
        input.checkoutExpiresAt.toISOString(),
        'pending_payment',
        input.createdAt.toISOString(),
        input.createdAt.toISOString(),
        input.createdAt.toISOString(),
        input.monetaryPolicy?.acceptedDeliveryAmountMinor ?? null,
        input.monetaryPolicy?.acceptedParcelTier ?? null,
        input.monetaryPolicy?.monetaryPolicyReference ?? null,
        input.newsletterOptIn ? 1 : 0,
        ...availability.params,
      );
    const lineInserts = lineRecords.map((line) =>
      this.db
        .prepare(
          [
            'INSERT INTO "CheckoutOrderLine"',
            '  ("id", "orderId", "storeItemSlug", "variantId", "stripePriceId", "displayName", "optionLabel",',
            '   "quantity", "unitAmountMinor", "lineAmountMinor", "createdAt")',
            'SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?',
            'WHERE EXISTS (SELECT 1 FROM "CheckoutOrder" WHERE "id" = ? AND "status" = ?)',
          ].join('\n'),
        )
        .bind(
          line.id,
          line.orderId,
          line.storeItemSlug,
          line.variantId,
          line.stripePriceId,
          line.displayName,
          line.optionLabel,
          line.quantity,
          line.unitAmountMinor,
          line.lineAmountMinor,
          line.createdAt.toISOString(),
          input.orderId,
          'pending_payment',
        ),
    );
    let orderResult: D1Result | undefined;
    try {
      [orderResult] = await this.db.batch([orderInsert, ...lineInserts]);
    } catch (error) {
      if (input.requestIdentity) {
        const attempt = await this.findByRequestIdentity(input.requestIdentity);
        if (attempt) return { attempt, kind: 'existing' };
      }
      throw error;
    }

    if (readChangeCount(orderResult) === 0) {
      return { kind: 'unavailable' };
    }

    return {
      hold: {
        ...EMPTY_PAID_CHECKOUT_ORDER_FIELDS,
        ...input.monetaryPolicy,
        checkoutCancelUrl: input.checkoutCancelUrl ?? null,
        checkoutExpiresAt: input.checkoutExpiresAt,
        checkoutSessionId: null,
        checkoutSuccessUrl: input.checkoutSuccessUrl ?? null,
        idempotencyEnvironment: input.requestIdentity?.productEnvironment ?? null,
        idempotencyFingerprint: input.requestIdentity?.requestFingerprint ?? null,
        idempotencyKeyDigest: input.requestIdentity?.keyDigest ?? null,
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
        newsletterOptIn: input.newsletterOptIn ?? false,
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
    checkoutExpiresAt: Date = hold.checkoutExpiresAt,
    checkoutUrl?: string,
  ): Promise<SessionBoundPendingCheckoutOrder | null> {
    const result = await this.db
      .prepare(
        [
          'UPDATE "CheckoutOrder"',
          'SET "checkoutSessionId" = ?, "checkoutUrl" = COALESCE(?, "checkoutUrl"), "checkoutExpiresAt" = ?, "checkoutProviderClaimToken" = NULL, "checkoutProviderLeaseUntil" = NULL, "statusUpdatedAt" = ?, "updatedAt" = ?',
          'WHERE "id" = ? AND "status" = ? AND "checkoutSessionId" IS NULL',
        ].join('\n'),
      )
      .bind(
        checkoutSessionId,
        checkoutUrl ?? null,
        checkoutExpiresAt.toISOString(),
        boundAt.toISOString(),
        boundAt.toISOString(),
        hold.id,
        'pending_payment',
      )
      .run();

    if (readChangeCount(result) === 0) return null;

    return {
      ...hold,
      checkoutExpiresAt,
      checkoutSessionId,
      checkoutUrl: checkoutUrl ?? hold.checkoutUrl,
      checkoutProviderClaimToken: null,
      checkoutProviderLeaseUntil: null,
      statusUpdatedAt: boundAt,
      updatedAt: boundAt,
    };
  }

  public async claimCheckoutProvider(
    orderId: string,
    claimToken: string,
    claimedAt: Date,
    leaseUntil: Date,
  ): Promise<'claimed' | 'in_progress' | 'unavailable'> {
    const result = await this.db
      .prepare(
        [
          'UPDATE "CheckoutOrder"',
          'SET "checkoutProviderClaimToken" = ?, "checkoutProviderLeaseUntil" = ?',
          'WHERE "id" = ? AND "status" = ? AND "checkoutSessionId" IS NULL',
          '  AND ("checkoutProviderClaimToken" IS NULL OR "checkoutProviderLeaseUntil" <= ?)',
        ].join('\n'),
      )
      .bind(claimToken, leaseUntil.toISOString(), orderId, 'pending_payment', claimedAt.toISOString())
      .run();

    if (readChangeCount(result) === 1) return 'claimed';

    const row = await this.db
      .prepare(
        'SELECT "status", "checkoutSessionId", "checkoutProviderClaimToken", "checkoutProviderLeaseUntil" FROM "CheckoutOrder" WHERE "id" = ?',
      )
      .bind(orderId)
      .first<{
        checkoutProviderClaimToken: string | null;
        checkoutProviderLeaseUntil: string | null;
        checkoutSessionId: string | null;
        status: string;
      }>();

    if (
      row?.status === 'pending_payment' &&
      row.checkoutSessionId === null &&
      row.checkoutProviderClaimToken &&
      row.checkoutProviderLeaseUntil &&
      row.checkoutProviderLeaseUntil > claimedAt.toISOString()
    ) {
      return 'in_progress';
    }

    return 'unavailable';
  }

  public async findByRequestIdentity(identity: RequestIdentity): Promise<CheckoutRetryAttempt | null> {
    const row = await this.db
      .prepare(
        [
          'SELECT "id", "status", "checkoutSessionId", "checkoutUrl", "checkoutCancelUrl", "checkoutSuccessUrl",',
          '       "checkoutExpiresAt", "idempotencyFingerprint", "acceptedDeliveryAmountMinor", "acceptedParcelTier",',
          '       "monetaryPolicyReference", "newsletterOptIn"',
          'FROM "CheckoutOrder"',
          'WHERE "idempotencyEnvironment" = ? AND "idempotencyKeyDigest" = ?',
          'LIMIT 1',
        ].join('\n'),
      )
      .bind(identity.productEnvironment, identity.keyDigest)
      .first<CheckoutRetryAttemptRow>();

    if (!row) return null;

    const lineRows = await this.db
      .prepare(
        'SELECT "id", "orderId", "storeItemSlug", "variantId", "stripePriceId", "displayName", "optionLabel", "quantity", "unitAmountMinor", "lineAmountMinor", "createdAt" FROM "CheckoutOrderLine" WHERE "orderId" = ? ORDER BY "createdAt" ASC, "id" ASC',
      )
      .bind(row.id)
      .all<CheckoutRetryLineRow>();

    return {
      acceptedDeliveryAmountMinor: row.acceptedDeliveryAmountMinor,
      acceptedParcelTier:
        row.acceptedParcelTier === 'small' || row.acceptedParcelTier === 'medium' ? row.acceptedParcelTier : null,
      checkoutCancelUrl: row.checkoutCancelUrl,
      checkoutExpiresAt: new Date(row.checkoutExpiresAt),
      checkoutSessionId: row.checkoutSessionId ? parseCheckoutSessionId(row.checkoutSessionId) : null,
      checkoutSuccessUrl: row.checkoutSuccessUrl,
      checkoutUrl: row.checkoutUrl,
      id: row.id,
      idempotencyFingerprint: row.idempotencyFingerprint,
      lines: lineRows.results.map((line) => ({
        createdAt: new Date(line.createdAt),
        displayName: line.displayName,
        id: line.id,
        lineAmountMinor: line.lineAmountMinor,
        optionLabel: line.optionLabel,
        orderId: line.orderId,
        quantity: createCartQuantity(line.quantity),
        storeItemSlug: parseStoreItemSlug(line.storeItemSlug),
        stripePriceId: line.stripePriceId ? parseStripePriceId(line.stripePriceId) : null,
        unitAmountMinor: line.unitAmountMinor,
        variantId: parseVariantId(line.variantId),
      })),
      monetaryPolicyReference: row.monetaryPolicyReference,
      newsletterOptIn: row.newsletterOptIn === null ? null : row.newsletterOptIn === 1,
      status: row.status,
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
    checkoutExpiresAt?: Date,
    checkoutUrl?: string,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        [
          'UPDATE "CheckoutOrder"',
          'SET "checkoutSessionId" = ?, "checkoutUrl" = COALESCE(?, "checkoutUrl"), "checkoutExpiresAt" = COALESCE(?, "checkoutExpiresAt"), "checkoutProviderClaimToken" = NULL, "checkoutProviderLeaseUntil" = NULL, "statusUpdatedAt" = ?, "updatedAt" = ?',
          'WHERE "id" = ? AND "status" = ? AND "checkoutSessionId" IS NULL',
        ].join('\n'),
      )
      .bind(
        checkoutSessionId,
        checkoutUrl ?? null,
        checkoutExpiresAt?.toISOString() ?? null,
        recoveredAt.toISOString(),
        recoveredAt.toISOString(),
        orderId,
        'pending_payment',
      )
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
          'WHERE "id" = ? AND "checkoutSessionId" = ? AND "status" = ?',
        ].join('\n'),
      )
      .bind('not_paid', releasedAtIso, releasedAtIso, releasedAtIso, hold.id, hold.checkoutSessionId, 'pending_payment')
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
