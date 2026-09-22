import {
  CatalogOperationConflictError,
  catalogOperationInputSchema,
  catalogOperationResultsSchema,
  type CatalogOperation,
  type CatalogOperationInput,
  type CatalogOperationResults,
  type CatalogOperationStep,
  type StoreOfferSnapshotState,
  type StoreItemOptionRecord,
  type RuntimeCatalogRecord,
} from '../../../domain/commerce/repositories/spi';
import { parseStripePriceId, type StripePriceId } from '../../../domain/commerce';

type Row = Omit<CatalogOperation, 'results'> & { results: string };
const steps: Record<CatalogOperationInput['kind'], CatalogOperationStep[]> = {
  item_setup: [
    'started',
    'source_linked',
    'catalog_linked',
    'product_bound',
    'price_bound',
    'stock_initialized',
    'completed',
  ],
  price_change: ['started', 'validated', 'price_bound', 'default_selected', 'completed'],
  price_initialize: ['started', 'product_bound', 'price_bound', 'default_selected', 'completed'],
  item_publish: [
    'started',
    'artwork_approved',
    'product_projected',
    'content_published',
    'publication_requested',
    'completed',
  ],
};
const map = (row: Row): CatalogOperation => ({
  ...row,
  results: catalogOperationResultsSchema.parse(JSON.parse(row.results)),
});

export class D1CatalogOperationRepository {
  public constructor(private readonly db: D1Database) {}

  public async begin(input: CatalogOperationInput, accepted: CatalogOperationResults = {}): Promise<CatalogOperation> {
    const value = catalogOperationInputSchema.parse(input);
    const retained = await this.find(value.id);
    if (retained) {
      if (Object.entries(value).some(([key, field]) => retained[key as keyof CatalogOperationInput] !== field))
        throw new CatalogOperationConflictError('Catalog operation conflicts with existing input.');
      return retained;
    }
    const results = catalogOperationResultsSchema.parse(accepted);
    if (
      value.kind === 'price_initialize' &&
      (!results.initializationInput ||
        !results.productProjection ||
        !results.cmsSourceId ||
        !results.cmsRevision ||
        !results.sourceFingerprint)
    )
      throw new CatalogOperationConflictError('Initial pricing requires reviewed input.');
    await this.db
      .prepare(
        `INSERT INTO "CatalogOperation"
      (id, kind, inputFingerprint, actorEmail, variantId, expectedRevision, results)
      SELECT ?, ?, ?, ?, ?, ?, ? WHERE
        (EXISTS (SELECT 1 FROM "StoreItemOption" WHERE variantId = ? AND catalogRevision = ?)
        AND (? <> 'price_initialize' OR (
          EXISTS (SELECT 1 FROM "StoreItemOption" WHERE variantId = ? AND catalogAvailability = 'withheld')
          AND NOT EXISTS (SELECT 1 FROM "VariantStripeMapping" WHERE variantId = ?))))
        OR (? = 'item_setup' AND ? = 0 AND NOT EXISTS (SELECT 1 FROM "StoreItemOption" WHERE variantId = ?))
      ON CONFLICT DO NOTHING`,
      )
      .bind(
        value.id,
        value.kind,
        value.inputFingerprint,
        value.actorEmail,
        value.variantId,
        value.expectedRevision,
        JSON.stringify(results),
        value.variantId,
        value.expectedRevision,
        value.kind,
        value.variantId,
        value.variantId,
        value.kind,
        value.expectedRevision,
        value.variantId,
      )
      .run();
    const existing = await this.find(value.id);
    if (
      !existing ||
      Object.entries(value).some(([key, field]) => existing[key as keyof CatalogOperationInput] !== field)
    ) {
      throw new CatalogOperationConflictError(
        'Catalog operation conflicts with existing input, an unresolved operation, or the item revision.',
      );
    }
    return existing;
  }

  public async find(id: string): Promise<CatalogOperation | null> {
    const row = await this.db.prepare('SELECT * FROM "CatalogOperation" WHERE id = ?').bind(id).first<Row>();
    return row ? map(row) : null;
  }

  public async findUnresolved(variantId: string): Promise<CatalogOperation | null> {
    const row = await this.db
      .prepare('SELECT * FROM "CatalogOperation" WHERE variantId = ? AND status <> \'completed\'')
      .bind(variantId)
      .first<Row>();
    return row ? map(row) : null;
  }

  public async linkSetupCatalog(
    operation: CatalogOperation,
    item: StoreItemOptionRecord,
    presentation: Pick<RuntimeCatalogRecord, 'itemType' | 'priceKind' | 'productProjection'>,
    now = new Date(),
  ): Promise<boolean> {
    if (
      operation.kind !== 'item_setup' ||
      operation.step !== 'source_linked' ||
      operation.expectedRevision !== 0 ||
      !operation.claimToken ||
      !operation.results.cmsSourceId ||
      item.variantId !== operation.variantId
    )
      return false;
    const timestamp = now.toISOString();
    const result = await this.db.batch([
      this.db
        .prepare(
          `UPDATE "CatalogOperation" SET step = 'catalog_linked', updatedAt = ?
        WHERE id = ? AND kind = 'item_setup' AND status = 'pending' AND step = 'source_linked'
        AND claimToken = ? AND leaseUntil > ? AND variantId = ? AND expectedRevision = 0
        AND json_extract(results, '$.cmsSourceId') = ?
        AND NOT EXISTS (SELECT 1 FROM "StoreItemOption" WHERE variantId = ? OR storeItemSlug = ?
          OR (sourceKind = ? AND (sourceId = ? OR cmsSourceId = ?)))
        AND NOT EXISTS (SELECT 1 FROM "VariantStripeMapping" WHERE variantId = ?)
        AND NOT EXISTS (SELECT 1 FROM "Stock" WHERE variantId = ?)
        AND NOT EXISTS (SELECT 1 FROM "ItemAvailability" WHERE variantId = ?)`,
        )
        .bind(
          timestamp,
          operation.id,
          operation.claimToken,
          timestamp,
          operation.variantId,
          operation.results.cmsSourceId,
          item.variantId,
          item.storeItemSlug,
          item.sourceKind,
          item.sourceId,
          operation.results.cmsSourceId,
          item.variantId,
          item.variantId,
          item.variantId,
        ),
      this.db
        .prepare(
          `INSERT INTO "StoreItemOption"
        (id, storeItemSlug, sourceKind, sourceId, variantId, cmsSourceId, catalogAvailability, catalogRevision, createdAt, updatedAt, itemType, priceKind, productProjection)
        SELECT ?, ?, ?, ?, ?, ?, 'withheld', 0, ?, ?, ?, ?, ? WHERE changes() = 1`,
        )
        .bind(
          crypto.randomUUID(),
          item.storeItemSlug,
          item.sourceKind,
          item.sourceId,
          item.variantId,
          operation.results.cmsSourceId,
          timestamp,
          timestamp,
          presentation.itemType,
          presentation.priceKind,
          JSON.stringify(presentation.productProjection),
        ),
    ]);
    return result[0].meta.changes === 1;
  }

  public async bindSetupPrice(operation: CatalogOperation, priceId: StripePriceId, now = new Date()): Promise<boolean> {
    const stripePriceId = parseStripePriceId(priceId);
    if (
      operation.kind !== 'item_setup' ||
      operation.step !== 'product_bound' ||
      !operation.claimToken ||
      !operation.results.stripeProductId ||
      !operation.results.cmsSourceId
    )
      return false;
    const timestamp = now.toISOString();
    const result = await this.db.batch([
      this.db
        .prepare(
          `UPDATE "CatalogOperation" SET step = 'price_bound',
        results = json_set(results, '$.stripePriceId', ?), updatedAt = ?
        WHERE id = ? AND kind = 'item_setup' AND status = 'pending' AND step = 'product_bound'
        AND claimToken = ? AND leaseUntil > ? AND variantId = ? AND expectedRevision = ?
        AND json_extract(results, '$.stripeProductId') = ? AND json_extract(results, '$.cmsSourceId') = ?
        AND json_extract(results, '$.stripePriceId') IS NULL
        AND EXISTS (SELECT 1 FROM "StoreItemOption" WHERE variantId = ? AND cmsSourceId = ?
          AND catalogRevision = ? AND catalogAvailability = 'withheld')
        AND NOT EXISTS (SELECT 1 FROM "VariantStripeMapping" WHERE variantId = ? OR stripeProductId = ? OR stripePriceId = ?)`,
        )
        .bind(
          stripePriceId,
          timestamp,
          operation.id,
          operation.claimToken,
          timestamp,
          operation.variantId,
          operation.expectedRevision,
          operation.results.stripeProductId,
          operation.results.cmsSourceId,
          operation.variantId,
          operation.results.cmsSourceId,
          operation.expectedRevision,
          operation.variantId,
          operation.results.stripeProductId,
          stripePriceId,
        ),
      this.db
        .prepare(
          `INSERT INTO "VariantStripeMapping" (id, variantId, stripeProductId, stripePriceId, createdAt, updatedAt)
        SELECT ?, ?, ?, ?, ?, ? WHERE changes() = 1`,
        )
        .bind(
          crypto.randomUUID(),
          operation.variantId,
          operation.results.stripeProductId,
          stripePriceId,
          timestamp,
          timestamp,
        ),
    ]);
    return result[0].meta.changes === 1;
  }

  public async completeSetup(
    operation: CatalogOperation,
    presentation: Pick<RuntimeCatalogRecord, 'itemType' | 'priceKind' | 'productProjection'>,
    now = new Date(),
  ): Promise<boolean> {
    if (
      operation.kind !== 'item_setup' ||
      operation.step !== 'stock_initialized' ||
      !operation.claimToken ||
      !presentation.itemType?.trim() ||
      !['fixed', 'pay_what_you_want'].includes(presentation.priceKind ?? '') ||
      !presentation.productProjection ||
      typeof presentation.productProjection !== 'object' ||
      Array.isArray(presentation.productProjection)
    )
      return false;
    const timestamp = now.toISOString();
    const result = await this.db.batch([
      this.db
        .prepare(
          `UPDATE "CatalogOperation" SET step = 'completed', status = 'completed', updatedAt = ?
        WHERE id = ? AND kind = 'item_setup' AND status = 'pending' AND step = 'stock_initialized'
        AND claimToken = ? AND leaseUntil > ? AND variantId = ? AND expectedRevision = ?
        AND EXISTS (SELECT 1 FROM "StoreItemOption" s WHERE s.variantId = "CatalogOperation".variantId
          AND s.cmsSourceId = json_extract("CatalogOperation".results, '$.cmsSourceId')
          AND s.catalogRevision = "CatalogOperation".expectedRevision AND s.catalogAvailability = 'withheld')
        AND EXISTS (SELECT 1 FROM "VariantStripeMapping" m WHERE m.variantId = "CatalogOperation".variantId
          AND m.stripeProductId = json_extract("CatalogOperation".results, '$.stripeProductId')
          AND m.stripePriceId = json_extract("CatalogOperation".results, '$.stripePriceId'))
        AND EXISTS (SELECT 1 FROM "Stock" WHERE variantId = "CatalogOperation".variantId)`,
        )
        .bind(
          timestamp,
          operation.id,
          operation.claimToken,
          timestamp,
          operation.variantId,
          operation.expectedRevision,
        ),
      this.db
        .prepare(
          `UPDATE "StoreItemOption" SET itemType = ?, priceKind = ?, productProjection = ?,
        catalogRevision = catalogRevision + 1, updatedAt = ? WHERE variantId = ? AND changes() = 1`,
        )
        .bind(
          presentation.itemType,
          presentation.priceKind,
          JSON.stringify(presentation.productProjection),
          timestamp,
          operation.variantId,
        ),
      this.db
        .prepare(
          `UPDATE "CatalogOperation" SET claimToken = NULL, leaseUntil = NULL
        WHERE id = ? AND status = 'completed' AND claimToken = ? AND changes() = 1`,
        )
        .bind(operation.id, operation.claimToken),
    ]);
    return result[0].meta.changes === 1;
  }

  public async completePriceChange(
    operation: CatalogOperation,
    snapshot: StoreOfferSnapshotState,
    priceKind: 'fixed' | 'pay_what_you_want',
    now = new Date(),
  ): Promise<boolean> {
    if (
      operation.kind !== 'price_change' ||
      operation.step !== 'default_selected' ||
      !operation.claimToken ||
      snapshot.variantId !== operation.variantId ||
      snapshot.stripePriceId !== operation.results.stripePriceId ||
      !operation.results.stripeProductId ||
      !operation.results.previousStripePriceId
    )
      throw new Error('Invalid price completion.');
    const marker = `EXISTS (SELECT 1 FROM "CatalogOperation" WHERE id = ? AND status = 'completed' AND claimToken = ?)`;
    const result = await this.db.batch([
      this.db
        .prepare(
          `UPDATE "CatalogOperation" SET status = 'completed', step = 'completed', updatedAt = ?
        WHERE id = ? AND kind = 'price_change' AND status = 'pending' AND step = 'default_selected' AND claimToken = ? AND leaseUntil > ?
        AND variantId = ? AND expectedRevision = ?
        AND json_extract(results, '$.stripeProductId') = ? AND json_extract(results, '$.stripePriceId') = ?
        AND json_extract(results, '$.previousStripePriceId') = ?
        AND EXISTS (SELECT 1 FROM "StoreItemOption" WHERE variantId = ? AND storeItemSlug = ? AND catalogRevision = ?)
        AND EXISTS (SELECT 1 FROM "VariantStripeMapping" WHERE variantId = ? AND stripeProductId = ? AND stripePriceId = ?)`,
        )
        .bind(
          now.toISOString(),
          operation.id,
          operation.claimToken,
          now.toISOString(),
          operation.variantId,
          operation.expectedRevision,
          operation.results.stripeProductId,
          operation.results.stripePriceId,
          operation.results.previousStripePriceId,
          operation.variantId,
          snapshot.storeItemSlug,
          operation.expectedRevision,
          operation.variantId,
          operation.results.stripeProductId,
          operation.results.previousStripePriceId,
        ),
      this.db
        .prepare(
          `UPDATE "StoreItemOption" SET catalogRevision = catalogRevision + 1, priceKind = ?, updatedAt = ? WHERE variantId = ? AND ${marker}`,
        )
        .bind(priceKind, now.toISOString(), operation.variantId, operation.id, operation.claimToken),
      this.db
        .prepare(`UPDATE "VariantStripeMapping" SET stripePriceId = ?, updatedAt = ? WHERE variantId = ? AND ${marker}`)
        .bind(snapshot.stripePriceId, now.toISOString(), operation.variantId, operation.id, operation.claimToken),
      this.db
        .prepare(
          `INSERT INTO "StoreOfferSnapshot" (id, storeItemSlug, variantId, stripePriceId, stripeLookupKey, amountMinor, currencyCode, priceActive, productActive, syncedAt, freshUntil, createdAt, updatedAt)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE ${marker}
        ON CONFLICT (variantId) DO UPDATE SET stripePriceId = excluded.stripePriceId, stripeLookupKey = excluded.stripeLookupKey,
          amountMinor = excluded.amountMinor, currencyCode = excluded.currencyCode, priceActive = excluded.priceActive,
          productActive = excluded.productActive, syncedAt = excluded.syncedAt, freshUntil = excluded.freshUntil, updatedAt = excluded.updatedAt`,
        )
        .bind(
          crypto.randomUUID(),
          snapshot.storeItemSlug,
          operation.variantId,
          snapshot.stripePriceId,
          snapshot.stripeLookupKey,
          snapshot.amountMinor,
          snapshot.currencyCode,
          snapshot.priceActive ? 1 : 0,
          snapshot.productActive ? 1 : 0,
          snapshot.syncedAt.toISOString(),
          snapshot.freshUntil.toISOString(),
          now.toISOString(),
          now.toISOString(),
          operation.id,
          operation.claimToken,
        ),
      this.db
        .prepare(
          `UPDATE "CatalogOperation" SET claimToken = NULL, leaseUntil = NULL WHERE id = ? AND status = 'completed' AND claimToken = ?`,
        )
        .bind(operation.id, operation.claimToken),
    ]);
    return result[0].meta.changes === 1;
  }

  public async completePriceInitialization(
    operation: CatalogOperation,
    snapshot: StoreOfferSnapshotState,
    now = new Date(),
  ): Promise<boolean> {
    if (
      operation.kind !== 'price_initialize' ||
      operation.step !== 'default_selected' ||
      !operation.claimToken ||
      snapshot.variantId !== operation.variantId ||
      snapshot.stripePriceId !== operation.results.stripePriceId ||
      !operation.results.stripeProductId ||
      !operation.results.initializationInput ||
      !operation.results.productProjection
    )
      throw new Error('Invalid initial price completion.');
    const timestamp = now.toISOString();
    const marker = `EXISTS (SELECT 1 FROM "CatalogOperation" WHERE id = ? AND status = 'completed' AND claimToken = ?)`;
    const result = await this.db.batch([
      this.db
        .prepare(
          `UPDATE "CatalogOperation" SET status = 'completed', step = 'completed', updatedAt = ?
        WHERE id = ? AND kind = 'price_initialize' AND status = 'pending' AND step = 'default_selected'
        AND claimToken = ? AND leaseUntil > ? AND variantId = ? AND expectedRevision = ?
        AND json_extract(results, '$.stripeProductId') = ? AND json_extract(results, '$.stripePriceId') = ?
        AND EXISTS (SELECT 1 FROM "StoreItemOption" s WHERE s.variantId = "CatalogOperation".variantId
          AND s.storeItemSlug = ? AND s.catalogRevision = "CatalogOperation".expectedRevision
          AND s.catalogAvailability = 'withheld'
          AND (s.cmsSourceId IS NULL OR s.cmsSourceId = json_extract("CatalogOperation".results, '$.cmsSourceId'))
          AND (s.itemType IS NULL OR s.itemType = json_extract("CatalogOperation".results, '$.initializationInput.itemType'))
          AND (s.priceKind IS NULL OR s.priceKind = json_extract("CatalogOperation".results, '$.initializationInput.price.kind')))
        AND NOT EXISTS (SELECT 1 FROM "VariantStripeMapping" WHERE variantId = ? OR stripeProductId = ? OR stripePriceId = ?)`,
        )
        .bind(
          timestamp,
          operation.id,
          operation.claimToken,
          timestamp,
          operation.variantId,
          operation.expectedRevision,
          operation.results.stripeProductId,
          snapshot.stripePriceId,
          snapshot.storeItemSlug,
          operation.variantId,
          operation.results.stripeProductId,
          snapshot.stripePriceId,
        ),
      this.db
        .prepare(
          `UPDATE "StoreItemOption" SET
        cmsSourceId = (SELECT json_extract(results, '$.cmsSourceId') FROM "CatalogOperation" WHERE id = ?),
        itemType = (SELECT json_extract(results, '$.initializationInput.itemType') FROM "CatalogOperation" WHERE id = ?),
        priceKind = (SELECT json_extract(results, '$.initializationInput.price.kind') FROM "CatalogOperation" WHERE id = ?),
        productProjection = (SELECT json_extract(results, '$.productProjection') FROM "CatalogOperation" WHERE id = ?),
        catalogRevision = catalogRevision + 1, updatedAt = ? WHERE variantId = ? AND ${marker}`,
        )
        .bind(
          operation.id,
          operation.id,
          operation.id,
          operation.id,
          timestamp,
          operation.variantId,
          operation.id,
          operation.claimToken,
        ),
      this.db
        .prepare(
          `INSERT INTO "VariantStripeMapping" (id, variantId, stripeProductId, stripePriceId, createdAt, updatedAt)
        SELECT ?, ?, ?, ?, ?, ? WHERE ${marker}`,
        )
        .bind(
          crypto.randomUUID(),
          operation.variantId,
          operation.results.stripeProductId,
          snapshot.stripePriceId,
          timestamp,
          timestamp,
          operation.id,
          operation.claimToken,
        ),
      this.db
        .prepare(
          `INSERT INTO "StoreOfferSnapshot"
        (id, storeItemSlug, variantId, stripePriceId, stripeLookupKey, amountMinor, currencyCode, priceActive, productActive, syncedAt, freshUntil, createdAt, updatedAt)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE ${marker}
        ON CONFLICT (variantId) DO UPDATE SET stripePriceId = excluded.stripePriceId, stripeLookupKey = excluded.stripeLookupKey,
          amountMinor = excluded.amountMinor, currencyCode = excluded.currencyCode, priceActive = excluded.priceActive,
          productActive = excluded.productActive, syncedAt = excluded.syncedAt, freshUntil = excluded.freshUntil, updatedAt = excluded.updatedAt`,
        )
        .bind(
          crypto.randomUUID(),
          snapshot.storeItemSlug,
          operation.variantId,
          snapshot.stripePriceId,
          snapshot.stripeLookupKey,
          snapshot.amountMinor,
          snapshot.currencyCode,
          snapshot.priceActive ? 1 : 0,
          snapshot.productActive ? 1 : 0,
          snapshot.syncedAt.toISOString(),
          snapshot.freshUntil.toISOString(),
          timestamp,
          timestamp,
          operation.id,
          operation.claimToken,
        ),
      this.db
        .prepare(
          `UPDATE "CatalogOperation" SET claimToken = NULL, leaseUntil = NULL
        WHERE id = ? AND status = 'completed' AND claimToken = ?`,
        )
        .bind(operation.id, operation.claimToken),
    ]);
    return result[0].meta.changes === 1;
  }

  public async claim(id: string, now = new Date()): Promise<CatalogOperation | null> {
    const row = await this.db
      .prepare(
        `UPDATE "CatalogOperation" SET claimToken = ?, leaseUntil = ?, updatedAt = ?
      WHERE id = ? AND status = 'pending' AND (leaseUntil IS NULL OR leaseUntil <= ?) RETURNING *`,
      )
      .bind(
        crypto.randomUUID(),
        new Date(now.getTime() + 60_000).toISOString(),
        now.toISOString(),
        id,
        now.toISOString(),
      )
      .first<Row>();
    return row ? map(row) : null;
  }

  public async release(operation: CatalogOperation): Promise<void> {
    await this.db
      .prepare(
        `UPDATE "CatalogOperation" SET claimToken = NULL, leaseUntil = NULL
      WHERE id = ? AND status = 'pending' AND claimToken = ?`,
      )
      .bind(operation.id, operation.claimToken)
      .run();
  }

  public async retryPublication(
    operation: CatalogOperation,
    publicationId: string,
    now = new Date(),
  ): Promise<CatalogOperation | null> {
    const replacement = catalogOperationResultsSchema.parse({ publicationId }).publicationId!;
    const row = await this.db
      .prepare(
        `UPDATE "CatalogOperation" SET results = json_set(results, '$.publicationId', ?), updatedAt = ?
      WHERE id = ? AND kind = 'item_publish' AND step = 'publication_requested' AND status = 'pending'
      AND claimToken = ? AND leaseUntil > ? AND json_extract(results, '$.publicationId') = ? RETURNING *`,
      )
      .bind(
        replacement,
        now.toISOString(),
        operation.id,
        operation.claimToken,
        now.toISOString(),
        operation.results.publicationId,
      )
      .first<Row>();
    return row ? map(row) : null;
  }

  // The application calls this only after the CMS journal confirms the static publication is Live.
  public async completeItemPublication(operation: CatalogOperation, now = new Date()): Promise<boolean> {
    if (
      operation.kind !== 'item_publish' ||
      operation.step !== 'publication_requested' ||
      !operation.claimToken ||
      !operation.results.productProjection ||
      !operation.results.publicationId ||
      !operation.results.publishedRevisionId
    )
      return false;
    const timestamp = now.toISOString();
    const result = await this.db.batch([
      this.db
        .prepare(
          `UPDATE "CatalogOperation" SET step = 'completed', status = 'completed', updatedAt = ?
        WHERE id = ? AND kind = 'item_publish' AND step = 'publication_requested' AND status = 'pending'
        AND claimToken = ? AND leaseUntil > ?
        AND variantId = ? AND expectedRevision = ?
        AND json_extract(results, '$.publicationId') = ? AND json_extract(results, '$.publishedRevisionId') = ?
        AND EXISTS (SELECT 1 FROM "StoreItemOption" s WHERE s.variantId = "CatalogOperation".variantId
          AND s.catalogRevision = "CatalogOperation".expectedRevision AND s.catalogAvailability <> 'retired'
          AND s.cmsSourceId = json_extract("CatalogOperation".results, '$.cmsSourceId'))
        AND EXISTS (SELECT 1 FROM "VariantStripeMapping" m WHERE m.variantId = "CatalogOperation".variantId
          AND m.stripeProductId = json_extract("CatalogOperation".results, '$.stripeProductId')
          AND m.stripePriceId = json_extract("CatalogOperation".results, '$.stripePriceId'))`,
        )
        .bind(
          timestamp,
          operation.id,
          operation.claimToken,
          timestamp,
          operation.variantId,
          operation.expectedRevision,
          operation.results.publicationId,
          operation.results.publishedRevisionId,
        ),
      this.db
        .prepare(
          `UPDATE "StoreItemOption" SET productProjection = (SELECT json_extract(results, '$.productProjection') FROM "CatalogOperation" WHERE id = ?), catalogAvailability = 'published',
        catalogRevision = catalogRevision + 1, updatedAt = ? WHERE variantId = ? AND changes() = 1`,
        )
        .bind(operation.id, timestamp, operation.variantId),
      this.db
        .prepare(
          `INSERT INTO "ItemAvailability" (id, variantId, status, canBuy, updatedAt)
        SELECT ?, ?, 'available', 1, ? WHERE changes() = 1
        ON CONFLICT(variantId) DO UPDATE SET status = 'available', canBuy = 1, updatedAt = excluded.updatedAt`,
        )
        .bind(crypto.randomUUID(), operation.variantId, timestamp),
      this.db
        .prepare(
          `UPDATE "CatalogOperation" SET claimToken = NULL, leaseUntil = NULL
        WHERE id = ? AND status = 'completed' AND claimToken = ? AND changes() = 1`,
        )
        .bind(operation.id, operation.claimToken),
    ]);
    return result[0].meta.changes === 1;
  }

  public async advance(
    operation: CatalogOperation,
    nextStep: CatalogOperationStep,
    results: CatalogOperationResults = {},
    now = new Date(),
  ): Promise<CatalogOperation | null> {
    if (
      (['price_change', 'price_initialize', 'item_publish'].includes(operation.kind) && nextStep === 'completed') ||
      (operation.kind === 'item_setup' && ['stock_initialized', 'completed'].includes(nextStep)) ||
      steps[operation.kind][steps[operation.kind].indexOf(operation.step) + 1] !== nextStep
    ) {
      throw new Error('Invalid catalog operation step.');
    }
    const additions = catalogOperationResultsSchema.parse(results);
    if (
      Object.entries(additions).some(
        ([key, value]) =>
          operation.results[key as keyof CatalogOperationResults] !== undefined &&
          JSON.stringify(operation.results[key as keyof CatalogOperationResults]) !== JSON.stringify(value),
      )
    ) {
      throw new Error('Catalog operation results cannot be replaced.');
    }
    const completed = nextStep === 'completed';
    const row = await this.db
      .prepare(
        `UPDATE "CatalogOperation" SET step = ?, results = ?, status = ?, updatedAt = ?,
      claimToken = CASE WHEN ? THEN NULL ELSE claimToken END, leaseUntil = CASE WHEN ? THEN NULL ELSE leaseUntil END
      WHERE id = ? AND status = 'pending' AND step = ? AND claimToken = ? AND leaseUntil > ? RETURNING *`,
      )
      .bind(
        nextStep,
        JSON.stringify({ ...operation.results, ...additions }),
        completed ? 'completed' : 'pending',
        now.toISOString(),
        completed ? 1 : 0,
        completed ? 1 : 0,
        operation.id,
        operation.step,
        operation.claimToken,
        now.toISOString(),
      )
      .first<Row>();
    return row ? map(row) : null;
  }

  public async markNeedsReview(
    operation: CatalogOperation,
    reason: 'provider_outcome_unknown' | 'identity_conflict' | 'revision_conflict',
    now = new Date(),
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE "CatalogOperation" SET status = 'needs_review', safeReason = ?, claimToken = NULL, leaseUntil = NULL, updatedAt = ?
      WHERE id = ? AND status = 'pending' AND step = ? AND claimToken = ? AND leaseUntil > ?`,
      )
      .bind(reason, now.toISOString(), operation.id, operation.step, operation.claimToken, now.toISOString())
      .run();
    return result.meta.changes === 1;
  }
}
