import { z } from 'zod';
import { parseVariantId } from '../../../domain/commerce';
import type {
  CatalogOperation,
  CatalogOperationRepository,
  RuntimeCatalogRecord,
  RuntimeCatalogRepository,
  StoreItemOptionRepository,
  VariantStripeMappingRepository,
} from '../../../domain/commerce/repositories/spi';
import {
  createStripeCatalogMetadata,
  createStripeCatalogMutationContext,
  createStripeCatalogRequestShapeFingerprint,
} from './catalog-identifiers';
import { readCatalogPriceState } from './change-catalog-price';
import { readRuntimeCatalogPresentation } from './runtime-catalog-product-projections';
import { CatalogPriceConflictError } from './types';
import type {
  StripeCatalogEnvironment,
  StripeCatalogGateway,
  StripeCatalogPrice,
  StripeCatalogProductProjection,
} from './types';

export const catalogItemPublishSchema = z
  .object({
    operationId: z.uuid(),
    expectedRevision: z.number().int().positive(),
    cmsRevision: z.string().min(1).max(512),
    confirmLivePublication: z.boolean().default(false),
    retryPublication: z.boolean().default(false),
  })
  .strict();

export type CmsItemPublicationGateway = {
  checkRevision(record: RuntimeCatalogRecord, revision: string): Promise<void>;
  approve(
    record: RuntimeCatalogRecord,
    revision: string,
  ): Promise<{ projection: StripeCatalogProductProjection; sourceFingerprint: string }>;
  publish(record: RuntimeCatalogRecord, revision: string, sourceFingerprint: string): Promise<string>;
  publication(id: string, requestedRevision: string): Promise<'pending' | 'live' | 'failed'>;
};
type Dependencies = {
  environment: StripeCatalogEnvironment;
  catalog: StoreItemOptionRepository & RuntimeCatalogRepository;
  mappings: VariantStripeMappingRepository;
  journal: CatalogOperationRepository;
  gateway: Pick<StripeCatalogGateway, 'retrieveDefaultPrice' | 'updateProductProjection'>;
  cms: CmsItemPublicationGateway;
  now?: () => Date;
};

function matches(current: StripeCatalogPrice, projection: StripeCatalogProductProjection) {
  return (
    current.productName === projection.name &&
    (current.productDescription ?? '') === projection.description &&
    JSON.stringify(current.productImages) === JSON.stringify(projection.imageUrls) &&
    current.productTaxCode === projection.taxCode &&
    Object.entries(projection.metadata).every(([key, value]) => current.productMetadata[key] === value)
  );
}

export async function publishCatalogItem(deps: Dependencies, variant: string, actorEmail: string, input: unknown) {
  const command = catalogItemPublishSchema.parse(input);
  const variantId = parseVariantId(variant);
  if (deps.environment === 'prd' && !command.confirmLivePublication)
    throw new CatalogPriceConflictError('Confirm this live item publication.');
  const { retryPublication, ...intent } = command;
  const retained = await deps.journal.find(command.operationId);
  if (!retained) {
    const state = await readCatalogPriceState(deps, variantId);
    if (state.record.catalogRevision !== command.expectedRevision || state.record.catalogAvailability === 'retired')
      throw new CatalogPriceConflictError('Catalog revision changed.');
    await deps.cms.checkRevision(state.record, command.cmsRevision);
  }
  const existing = await deps.journal.begin({
    id: command.operationId,
    kind: 'item_publish',
    variantId,
    actorEmail,
    expectedRevision: command.expectedRevision,
    inputFingerprint: createStripeCatalogRequestShapeFingerprint({
      ...intent,
      variantId,
      environment: deps.environment,
    }),
  });
  let publicationStatus: 'pending' | 'live' | 'failed' | undefined;
  const response = (operation: CatalogOperation) => ({
    operationId: operation.id,
    variantId,
    status: operation.status,
    ...(operation.results.publicationId ? { publicationId: operation.results.publicationId } : {}),
    ...(publicationStatus ? { publicationStatus } : {}),
  });
  if (existing.status !== 'pending') return response(existing);
  const now = deps.now ?? (() => new Date());
  let operation = await deps.journal.claim(existing.id, now());
  if (!operation) return response(existing);
  const advance = async (step: Parameters<CatalogOperationRepository['advance']>[1], results = {}) => {
    const next = await deps.journal.advance(operation!, step, results, now());
    if (!next) throw new Error('Publication claim expired; resume the retained operation.');
    operation = next;
  };
  const requireLease = () => {
    if (!operation?.leaseUntil || operation.leaseUntil <= now().toISOString())
      throw new Error('Publication claim expired; resume the retained operation.');
  };
  try {
    const state = await readCatalogPriceState(deps, variantId);
    const { record, mapping, item } = state;
    const previous = readRuntimeCatalogPresentation(record, deps.environment);
    if (!previous || record.catalogRevision !== command.expectedRevision || record.catalogAvailability === 'retired')
      throw new CatalogPriceConflictError('Catalog identity or revision changed.');
    if (operation.step === 'started') {
      const approved = await deps.cms.approve(record, command.cmsRevision);
      if (!readRuntimeCatalogPresentation({ ...record, productProjection: approved.projection }, deps.environment))
        throw new CatalogPriceConflictError('Approved presentation is invalid.');
      await advance('artwork_approved', {
        cmsSourceId: record.cmsSourceId!,
        cmsRevision: command.cmsRevision,
        sourceFingerprint: approved.sourceFingerprint,
        productProjection: approved.projection,
        stripeProductId: mapping.stripeProductId!,
        stripePriceId: mapping.stripePriceId,
      });
    }
    const results = operation.results;
    const desired = readRuntimeCatalogPresentation(
      { ...record, productProjection: results.productProjection },
      deps.environment,
    );
    if (
      !desired ||
      results.cmsSourceId !== record.cmsSourceId ||
      results.stripeProductId !== mapping.stripeProductId ||
      results.stripePriceId !== mapping.stripePriceId ||
      !results.cmsRevision ||
      !results.sourceFingerprint
    )
      throw new CatalogPriceConflictError('Bound publication identity changed.');
    if (operation.step === 'artwork_approved') {
      if (!matches(state.current, desired)) {
        if (!matches(state.current, previous))
          throw new CatalogPriceConflictError('Product presentation changed externally.');
        requireLease();
        await deps.gateway.updateProductProjection(
          mapping.stripeProductId!,
          {
            projection: desired,
            stripeMetadata: createStripeCatalogMetadata(deps.environment, item),
          },
          createStripeCatalogMutationContext({
            action: 'update_product_projection',
            environment: deps.environment,
            variantId,
            identity: operation.id,
            requestShape: desired,
          }),
        );
        const verified = await readCatalogPriceState(deps, variantId);
        if (!matches(verified.current, desired))
          throw new CatalogPriceConflictError('Product presentation requires reconciliation.');
      }
      await advance('product_projected');
    }
    if (operation.step === 'product_projected') {
      requireLease();
      const revision = await deps.cms.publish(record, results.cmsRevision, results.sourceFingerprint);
      await advance('content_published', { publishedRevisionId: revision });
    }
    if (operation.step === 'content_published')
      await advance('publication_requested', { publicationId: crypto.randomUUID() });
    if (
      operation.step !== 'publication_requested' ||
      !operation.results.publicationId ||
      !operation.results.publishedRevisionId
    )
      throw new CatalogPriceConflictError('Invalid publication operation state.');
    requireLease();
    publicationStatus = await deps.cms.publication(
      operation.results.publicationId,
      operation.results.publishedRevisionId,
    );
    if (publicationStatus === 'failed' && retryPublication) {
      const next = await deps.journal.retryPublication(operation, crypto.randomUUID(), now());
      if (!next) throw new Error('Publication retry claim expired.');
      operation = next;
      publicationStatus = await deps.cms.publication(
        operation.results.publicationId!,
        operation.results.publishedRevisionId!,
      );
    }
    if (publicationStatus === 'live') {
      if (!(await deps.journal.completeItemPublication(operation, now())))
        await deps.journal.markNeedsReview(operation, 'revision_conflict', now());
    } else await deps.journal.release(operation);
    return response((await deps.journal.find(existing.id))!);
  } catch (error) {
    if (error instanceof CatalogPriceConflictError) {
      await deps.journal.markNeedsReview(operation, 'identity_conflict', now());
      return response((await deps.journal.find(existing.id))!);
    }
    throw error;
  }
}
