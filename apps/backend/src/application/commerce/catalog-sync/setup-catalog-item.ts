import { z } from 'zod';
import { DISTRO_GROUP_VALUES, projectProseFields, richTextSchema } from '@blackbox/content-model';
import { createStockQuantity, parseStoreItemSlug, parseStripePriceId, parseVariantId } from '../../../domain/commerce';
import {
  CatalogOperationConflictError,
  type CatalogOperation,
  type CatalogOperationRepository,
  type OperatorStockRepository,
  type RuntimeCatalogRepository,
  type StoreItemOptionRepository,
} from '../../../domain/commerce/repositories/spi';
import { catalogPriceChangeSchema } from './change-catalog-price';
import {
  createStripeCatalogLookupKey,
  createStripeCatalogMetadata,
  createStripeCatalogMutationContext,
  createStripeCatalogRequestShapeFingerprint,
} from './catalog-identifiers';
import {
  CatalogPriceConflictError,
  type CmsItemSource,
  type CmsItemSourceGateway,
  type StripeCatalogEnvironment,
  type StripeCatalogPriceChangeGateway,
  type StripeCatalogProductProjection,
  type StripeCatalogSetupGateway,
} from './types';

const identifier = z.string().trim().min(1).max(128);
export const catalogItemSetupSchema = z
  .object({
    operationId: identifier.regex(/^[A-Za-z0-9_-]+$/),
    storeItemSlug: identifier.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    source: z.union([
      z.object({ mode: z.literal('existing'), sourceKind: z.enum(['release', 'distro']), id: identifier }).strict(),
      z
        .object({
          mode: z.literal('create'),
          sourceKind: z.enum(['release', 'distro']),
          slug: identifier.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
          data: z
            .record(z.string(), z.unknown())
            .refine((value) => z.json().safeParse(value).success, 'Use JSON content data.'),
        })
        .strict(),
    ]),
    itemType: z.enum(DISTRO_GROUP_VALUES),
    price: catalogPriceChangeSchema.shape.price,
    openingQuantity: z.number().int().nonnegative().max(2_147_483_647).default(0),
    confirmLiveSetup: z.boolean().default(false),
  })
  .strict()
  .refine(
    (command) =>
      command.source.mode !== 'create' ||
      command.source.sourceKind !== 'distro' ||
      command.source.data.group === command.itemType,
    { path: ['itemType'], message: 'Item type must match the Distro source physical type.' },
  );
const projectionSchema = z
  .object({
    name: z.string().trim().min(1),
    description: z.string(),
    imageUrls: z.array(z.url({ protocol: /^https$/ })),
    metadata: z.record(z.string(), z.string()),
    taxCode: z.literal('txcd_99999999'),
  })
  .strict();

type Dependencies = {
  environment: StripeCatalogEnvironment;
  journal: CatalogOperationRepository;
  catalog: StoreItemOptionRepository & RuntimeCatalogRepository;
  sources: CmsItemSourceGateway;
  // The CMS adapter must resolve only approved public media, never browser-supplied provider presentation.
  preparePresentation(source: CmsItemSource): Promise<StripeCatalogProductProjection>;
  gateway: StripeCatalogSetupGateway & StripeCatalogPriceChangeGateway;
  stock: Pick<OperatorStockRepository, 'initializeOpeningStock'>;
  now?: () => Date;
};

export async function prepareCmsSetupPresentation(source: CmsItemSource): Promise<StripeCatalogProductProjection> {
  const content = z
    .object({
      title: z.string().trim().min(1).max(250),
      summary: z.string().max(20_000).nullish(),
      summary_rich: richTextSchema.nullish(),
    })
    .safeParse(projectProseFields('distro', source.data));
  if (!content.success) throw new CatalogOperationConflictError('CMS title or summary is invalid for item setup.');
  return {
    name: content.data.title,
    description: content.data.summary ?? '',
    // Initial draft setup omits artwork. Publication approves and applies the public image.
    imageUrls: [],
    metadata: {},
    taxCode: 'txcd_99999999',
  };
}

export async function setupCatalogItem(deps: Dependencies, actorEmail: string, input: unknown) {
  const command = catalogItemSetupSchema.parse(input);
  if (deps.environment === 'prd' && !command.confirmLiveSetup)
    throw new CatalogOperationConflictError('This live item setup requires confirmation.');
  const variantId = parseVariantId(
    `variant_${createStripeCatalogRequestShapeFingerprint(command.operationId).slice(6)}`,
  );
  const context = createStripeCatalogMutationContext({
    action: 'create_catalog_price',
    environment: deps.environment,
    variantId,
    identity: command.operationId,
    requestShape: { ...command, environment: deps.environment },
  });
  const existing = await deps.journal.begin({
    id: command.operationId,
    kind: 'item_setup',
    variantId,
    expectedRevision: 0,
    inputFingerprint: context.requestShapeFingerprint,
    actorEmail,
  });
  const response = (operation: CatalogOperation) => ({
    operationId: operation.id,
    variantId,
    status: operation.status,
  });
  if (existing.status !== 'pending') return response(existing);
  const now = deps.now ?? (() => new Date());
  let operation = await deps.journal.claim(existing.id, now());
  const current = async () => response((await deps.journal.find(existing.id))!);
  if (!operation) return response(existing);
  const active = () => operation?.leaseUntil && operation.leaseUntil > now().toISOString();
  try {
    if (operation.step === 'started' || operation.step === 'source_linked') {
      if (!active()) return current();
      const source = await deps.sources.ensureSource(command.source);
      if (command.source.sourceKind === 'distro' && source.data.group !== command.itemType)
        throw new CatalogOperationConflictError('Item type differs from the Distro source.');
      if (operation.results.cmsSourceId && operation.results.cmsSourceId !== source.id)
        throw new CatalogOperationConflictError('CMS source identity changed.');
      if (operation.step === 'started') {
        operation = await deps.journal.advance(operation, 'source_linked', { cmsSourceId: source.id }, now());
        if (!operation) return current();
      }
      const projection = projectionSchema.parse(await deps.preparePresentation(source));
      const linked = await deps.journal.linkSetupCatalog(
        operation,
        {
          variantId,
          storeItemSlug: parseStoreItemSlug(command.storeItemSlug),
          sourceKind: command.source.sourceKind,
          sourceId: source.slug,
        },
        { itemType: command.itemType, priceKind: command.price.kind, productProjection: projection },
        now(),
      );
      if (!linked) {
        await deps.journal.markNeedsReview(operation, 'identity_conflict', now());
        return current();
      }
      operation = (await deps.journal.find(existing.id))!;
    }
    const item = await deps.catalog.findByVariantId(variantId);
    const record = item && (await deps.catalog.findByStoreItem(item));
    if (
      !item ||
      !record ||
      record.cmsSourceId !== operation.results.cmsSourceId ||
      record.catalogRevision !== 0 ||
      record.catalogAvailability !== 'withheld'
    )
      throw new CatalogOperationConflictError('Setup catalog identity or revision changed.');
    const projection = projectionSchema.parse(record.productProjection);
    const metadata = createStripeCatalogMetadata(deps.environment, item);
    if (operation.step === 'catalog_linked') {
      if (!active()) return current();
      const product = await deps.gateway.ensureSetupProduct(
        { operationId: operation.id, metadata, projection, confirmLiveSetup: command.confirmLiveSetup },
        context,
      );
      operation = await deps.journal.advance(operation, 'product_bound', { stripeProductId: product.productId }, now());
      if (!operation) return current();
    }
    if (!operation.results.stripeProductId) throw new CatalogOperationConflictError('Setup Product is missing.');
    const providerInput = {
      ...command.price,
      metadata,
      productName: projection.name,
      lookupKey: createStripeCatalogLookupKey(deps.environment, item),
      productId: operation.results.stripeProductId,
      expectedDefaultPriceId: null,
      operationId: operation.id,
    };
    if (operation.step === 'product_bound') {
      if (!active()) return current();
      const price = await deps.gateway.createReplacementPrice(providerInput, context);
      if (!active()) return current();
      await deps.gateway.selectReplacementPrice(providerInput, price.priceId, context);
      if (!(await deps.journal.bindSetupPrice(operation, price.priceId, now()))) {
        await deps.journal.markNeedsReview(operation, 'identity_conflict', now());
        return current();
      }
      operation = (await deps.journal.find(existing.id))!;
    } else if (operation.results.stripePriceId) {
      if (!active()) return current();
      await deps.gateway.selectReplacementPrice(
        providerInput,
        parseStripePriceId(operation.results.stripePriceId),
        context,
      );
    }
    if (operation.step === 'price_bound') {
      if (!(await deps.stock.initializeOpeningStock(operation, createStockQuantity(command.openingQuantity), now()))) {
        await deps.journal.markNeedsReview(operation, 'identity_conflict', now());
        return current();
      }
      operation = (await deps.journal.find(existing.id))!;
    }
    if (
      !(await deps.journal.completeSetup(
        operation,
        { itemType: record.itemType, priceKind: record.priceKind, productProjection: projection },
        now(),
      ))
    )
      await deps.journal.markNeedsReview(operation, 'revision_conflict', now());
    return current();
  } catch (error) {
    if (operation && (error instanceof CatalogOperationConflictError || error instanceof CatalogPriceConflictError)) {
      await deps.journal.markNeedsReview(operation, 'identity_conflict', now());
      return current();
    }
    throw error;
  }
}
