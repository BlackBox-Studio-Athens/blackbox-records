import { z } from 'zod';
import { DISTRO_GROUP_VALUES } from '@blackbox/content-model';
import { parseStripePriceId, parseVariantId } from '../../../domain/commerce';
import {
  CatalogOperationConflictError,
  type CatalogOperation,
  type CatalogOperationRepository,
  type RuntimeCatalogRecord,
  type RuntimeCatalogRepository,
  type StoreItemOptionRepository,
  type VariantStripeMappingRepository,
} from '../../../domain/commerce/repositories/spi';
import { catalogPriceChangeSchema, readCatalogPrice } from './change-catalog-price';
import {
  createStripeCatalogLookupKey,
  createStripeCatalogMetadata,
  createStripeCatalogMutationContext,
} from './catalog-identifiers';
import {
  CatalogPriceConflictError,
  STORE_OFFER_FRESHNESS_MS,
  type CmsItemSource,
  type StripeCatalogEnvironment,
  type StripeCatalogGateway,
  type StripeCatalogSetupGateway,
  type StripeCatalogPriceChangeGateway,
  type StripeCatalogProductProjection,
} from './types';

export const catalogPriceInitializeSchema = z
  .object({
    operationId: catalogPriceChangeSchema.shape.operationId,
    expectedRevision: z.number().int().nonnegative(),
    cmsRevision: z.string().min(1).max(512),
    itemType: z
      .string()
      .min(1)
      .max(128)
      .refine((value) => value === value.trim()),
    price: catalogPriceChangeSchema.shape.price,
    confirmLiveSetup: z.boolean().default(false),
  })
  .strict();

type Dependencies = {
  environment: StripeCatalogEnvironment;
  catalog: StoreItemOptionRepository & RuntimeCatalogRepository;
  mappings: VariantStripeMappingRepository;
  journal: CatalogOperationRepository;
  gateway: Pick<StripeCatalogGateway, 'retrieveDefaultPrice'> &
    StripeCatalogSetupGateway &
    StripeCatalogPriceChangeGateway;
  readSource(
    record: RuntimeCatalogRecord,
  ): Promise<{ cmsRevision: string; source: CmsItemSource; sourceFingerprint: string }>;
  preparePresentation(source: CmsItemSource): Promise<StripeCatalogProductProjection>;
  now?: () => Date;
};

export class CatalogSellingNotFoundError extends Error {}

async function readRecord(deps: Dependencies, variant: string) {
  const item = await deps.catalog.findByVariantId(parseVariantId(variant));
  const record = item && (await deps.catalog.findByStoreItem(item));
  if (!record) throw new CatalogSellingNotFoundError('Item not found.');
  return record;
}

async function prepare(deps: Dependencies, record: RuntimeCatalogRecord) {
  if (record.catalogAvailability !== 'withheld') throw new CatalogPriceConflictError('Item is not withheld.');
  const saved = await deps.readSource(record);
  if (saved.source.slug !== record.sourceId || (record.cmsSourceId && saved.source.id !== record.cmsSourceId))
    throw new CatalogPriceConflictError('CMS source identity changed.');
  const nativeType = record.sourceKind === 'distro' ? z.enum(DISTRO_GROUP_VALUES).parse(saved.source.data.group) : null;
  const itemType =
    record.itemType === null ? nativeType : catalogPriceInitializeSchema.shape.itemType.parse(record.itemType);
  const priceKind =
    record.priceKind === null ? 'fixed' : z.enum(['fixed', 'pay_what_you_want']).parse(record.priceKind);
  const projection = await deps.preparePresentation(saved.source);
  return { ...saved, itemType, priceKind, projection };
}

async function checkAbsentAuthority(deps: Dependencies, record: RuntimeCatalogRecord) {
  if (await deps.mappings.findByVariantId(record.variantId))
    throw new CatalogPriceConflictError('Existing price binding requires review.');
  const product = await deps.gateway.inspectSetupProduct(
    `prod_blackbox_${deps.environment}_${record.variantId}`,
    deps.environment,
  );
  if (product) throw new CatalogPriceConflictError('Existing Product requires review.');
}

export async function readCatalogSelling(deps: Dependencies, variant: string, actorEmail: string) {
  const record = await readRecord(deps, variant);
  const pending = await deps.journal.findUnresolved(record.variantId);
  if (pending)
    return {
      state: 'blocked' as const,
      reason:
        pending.status === 'needs_review'
          ? 'Ask a label administrator to review the retained operation.'
          : 'Finish the retained operation before starting another change.',
      action:
        pending.kind === 'price_initialize' && pending.status === 'pending' && pending.actorEmail === actorEmail
          ? ('resume' as const)
          : pending.kind === 'price_change'
            ? ('price_change' as const)
            : pending.kind === 'item_publish'
              ? ('publication' as const)
              : ('administrator' as const),
      operationId: pending.id,
      pending:
        pending.kind === 'price_initialize' && pending.status === 'pending' && pending.actorEmail === actorEmail
          ? catalogPriceInitializeSchema.parse(pending.results.initializationInput)
          : null,
    };
  const mapping = await deps.mappings.findByVariantId(record.variantId);
  if (mapping) {
    try {
      return { state: 'ready' as const, detail: await readCatalogPrice(deps, variant) };
    } catch (error) {
      if (!(error instanceof CatalogPriceConflictError)) throw error;
      return {
        state: 'blocked' as const,
        reason: 'The existing price binding needs administrator review.',
        action: 'administrator' as const,
        pending: null,
      };
    }
  }
  if (record.catalogAvailability !== 'withheld')
    return {
      state: 'blocked' as const,
      reason: 'This item needs administrator review before setting a price.',
      action: 'administrator' as const,
      pending: null,
    };
  try {
    await checkAbsentAuthority(deps, record);
  } catch (error) {
    if (!(error instanceof CatalogPriceConflictError)) throw error;
    return {
      state: 'blocked' as const,
      reason: 'An existing Product needs administrator review.',
      action: 'administrator' as const,
      pending: null,
    };
  }
  try {
    const saved = await prepare(deps, record);
    return {
      state: 'setup_required' as const,
      variantId: record.variantId,
      expectedRevision: record.catalogRevision,
      cmsRevision: saved.cmsRevision,
      cmsSourceId: saved.source.id,
      itemType: saved.itemType,
      priceKind: saved.priceKind,
      requiresLiveConfirmation: deps.environment === 'prd',
    };
  } catch (error) {
    if (!(
      error instanceof z.ZodError ||
      error instanceof CatalogOperationConflictError ||
      error instanceof CatalogPriceConflictError
    ))
      throw error;
    return {
      state: 'blocked' as const,
      reason: 'Review and save the item details and format before setting a price.',
      action: 'details' as const,
      pending: null,
    };
  }
}

export async function initializeCatalogPrice(deps: Dependencies, variant: string, actorEmail: string, input: unknown) {
  const command = catalogPriceInitializeSchema.parse(input);
  const variantId = parseVariantId(variant);
  const context = createStripeCatalogMutationContext({
    action: 'create_catalog_price',
    environment: deps.environment,
    variantId,
    identity: command.operationId,
    requestShape: { ...command, variantId, environment: deps.environment },
  });
  const identity = {
    id: command.operationId,
    kind: 'price_initialize' as const,
    variantId,
    actorEmail,
    expectedRevision: command.expectedRevision,
    inputFingerprint: context.requestShapeFingerprint,
  };
  const retained = await deps.journal.find(command.operationId);
  let existing: CatalogOperation;
  if (retained) {
    // Resolve actor/environment/input replay before applying fresh eligibility to our own completed writes.
    existing = await deps.journal.begin(identity);
  } else {
    if (deps.environment === 'prd' && !command.confirmLiveSetup)
      throw new CatalogPriceConflictError('Confirm this live initial price.');
    const record = await readRecord(deps, variantId);
    if (record.catalogRevision !== command.expectedRevision)
      throw new CatalogPriceConflictError('Catalog revision changed.');
    if (await deps.journal.findUnresolved(variantId))
      throw new CatalogOperationConflictError('Finish the retained operation.');
    const saved = await prepare(deps, record);
    if (!saved.itemType && !z.enum(DISTRO_GROUP_VALUES).safeParse(command.itemType).success)
      throw new CatalogPriceConflictError('Choose a supported format.');
    if (
      saved.cmsRevision !== command.cmsRevision ||
      (saved.itemType && saved.itemType !== command.itemType) ||
      saved.priceKind !== command.price.kind
    )
      throw new CatalogPriceConflictError('Reviewed source, format or price policy changed.');
    await checkAbsentAuthority(deps, record);
    existing = await deps.journal.begin(identity, {
      cmsSourceId: saved.source.id,
      cmsRevision: saved.cmsRevision,
      sourceFingerprint: saved.sourceFingerprint,
      productProjection: saved.projection,
      initializationInput: command,
    });
  }
  const response = (operation: CatalogOperation) => ({
    operationId: operation.id,
    variantId,
    status: operation.status,
  });
  if (existing.status !== 'pending') return response(existing);
  const now = deps.now ?? (() => new Date());
  let operation = await deps.journal.claim(existing.id, now());
  if (!operation) return response(existing);
  const current = async () => response((await deps.journal.find(existing.id))!);
  const active = () => operation?.leaseUntil && operation.leaseUntil > now().toISOString();
  try {
    const record = await readRecord(deps, variantId);
    if (record.catalogRevision !== operation.expectedRevision || record.catalogAvailability !== 'withheld')
      throw new CatalogPriceConflictError('Catalog revision changed.');
    const accepted = catalogPriceInitializeSchema.parse(operation.results.initializationInput);
    const projection = z
      .object({
        name: z.string().min(1),
        description: z.string(),
        imageUrls: z.array(z.string()),
        metadata: z.record(z.string(), z.string()),
        taxCode: z.literal('txcd_99999999'),
      })
      .parse(operation.results.productProjection);
    const metadata = createStripeCatalogMetadata(deps.environment, record);
    if (operation.step === 'started') {
      if (!active()) return current();
      const product = await deps.gateway.ensureSetupProduct(
        { operationId: operation.id, metadata, projection, confirmLiveSetup: accepted.confirmLiveSetup },
        context,
      );
      operation = await deps.journal.advance(operation, 'product_bound', { stripeProductId: product.productId }, now());
      if (!operation) return current();
    }
    if (!operation.results.stripeProductId) throw new CatalogPriceConflictError('Initial Product is missing.');
    const providerInput = {
      ...accepted.price,
      metadata,
      productName: projection.name,
      lookupKey: createStripeCatalogLookupKey(deps.environment, record),
      productId: operation.results.stripeProductId,
      expectedDefaultPriceId: null,
      operationId: operation.id,
    };
    if (operation.step === 'product_bound') {
      if (!active()) return current();
      const price = await deps.gateway.createReplacementPrice(providerInput, context);
      operation = await deps.journal.advance(operation, 'price_bound', { stripePriceId: price.priceId }, now());
      if (!operation) return current();
    }
    if (!operation.results.stripePriceId || !['price_bound', 'default_selected'].includes(operation.step))
      throw new CatalogPriceConflictError('Invalid initial price operation.');
    if (!active()) return current();
    const selected = await deps.gateway.selectReplacementPrice(
      providerInput,
      parseStripePriceId(operation.results.stripePriceId),
      context,
    );
    if (operation.step === 'price_bound') {
      operation = await deps.journal.advance(operation, 'default_selected', {}, now());
      if (!operation) return current();
    }
    const syncedAt = now();
    if (
      !(await deps.journal.completePriceInitialization(
        operation,
        {
          variantId,
          storeItemSlug: record.storeItemSlug,
          stripePriceId: selected.priceId,
          stripeLookupKey: providerInput.lookupKey,
          amountMinor: selected.amountMinor,
          currencyCode: 'EUR',
          priceActive: selected.active,
          productActive: selected.productActive,
          syncedAt,
          freshUntil: new Date(syncedAt.getTime() + STORE_OFFER_FRESHNESS_MS),
        },
        syncedAt,
      ))
    )
      await deps.journal.markNeedsReview(operation, 'revision_conflict', now());
    return current();
  } catch (error) {
    if (operation && (error instanceof CatalogPriceConflictError || error instanceof CatalogOperationConflictError)) {
      await deps.journal.markNeedsReview(operation, 'identity_conflict', now());
      return current();
    }
    throw error;
  }
}
