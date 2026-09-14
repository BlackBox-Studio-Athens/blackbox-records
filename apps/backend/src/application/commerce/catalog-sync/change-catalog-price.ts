import { z } from 'zod';
import { parseStripePriceId, parseVariantId } from '../../../domain/commerce';
import type {
  CatalogOperation,
  CatalogOperationRepository,
  RuntimeCatalogRepository,
  StoreItemOptionRepository,
  VariantStripeMappingRepository,
} from '../../../domain/commerce/repositories/spi';
import {
  createStripeCatalogLookupKey,
  createStripeCatalogMetadata,
  createStripeCatalogMutationContext,
} from './catalog-identifiers';
import { createRuntimeCatalogProductProjectionReader } from './runtime-catalog-product-projections';
import { createStoreOfferPriceFromCatalogPrice } from './money';
import { CatalogPriceConflictError, STORE_OFFER_FRESHNESS_MS } from './types';
import type { StripeCatalogEnvironment, StripeCatalogGateway, StripeCatalogPriceChangeGateway } from './types';

const amount = z.number().int().min(1).max(99_999_999);
export const catalogPriceChangeSchema = z
  .object({
    operationId: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/),
    expectedRevision: z.number().int().positive(),
    confirmLivePriceChange: z.boolean().default(false),
    price: z
      .discriminatedUnion('kind', [
        z.object({ kind: z.literal('fixed'), currencyCode: z.literal('EUR'), amountMinor: amount }).strict(),
        z
          .object({
            kind: z.literal('pay_what_you_want'),
            currencyCode: z.literal('EUR'),
            minimumAmountMinor: amount,
            presetAmountMinor: amount,
            maximumAmountMinor: amount,
          })
          .strict(),
      ])
      .refine(
        (price) =>
          price.kind === 'fixed' ||
          (price.minimumAmountMinor <= price.presetAmountMinor && price.presetAmountMinor <= price.maximumAmountMinor),
      ),
  })
  .strict();

type Dependencies = {
  environment: StripeCatalogEnvironment;
  catalog: StoreItemOptionRepository & RuntimeCatalogRepository;
  mappings: VariantStripeMappingRepository;
  journal: CatalogOperationRepository;
  gateway: Pick<StripeCatalogGateway, 'retrieveDefaultPrice'> & StripeCatalogPriceChangeGateway;
  now?: () => Date;
};

// actorEmail comes from the verified operator context, separately from the strict browser command.
export async function changeCatalogPrice(deps: Dependencies, variant: string, actorEmail: string, input: unknown) {
  const command = catalogPriceChangeSchema.parse(input);
  const variantId = parseVariantId(variant);
  if (deps.environment === 'prd' && !command.confirmLivePriceChange)
    throw new CatalogPriceConflictError('This live price change requires confirmation.');
  const context = createStripeCatalogMutationContext({
    action: 'create_catalog_price',
    environment: deps.environment,
    variantId,
    identity: command.operationId,
    requestShape: { ...command, variantId, environment: deps.environment },
  });
  const existing = await deps.journal.begin({
    id: command.operationId,
    kind: 'price_change',
    variantId,
    actorEmail,
    expectedRevision: command.expectedRevision,
    inputFingerprint: context.requestShapeFingerprint,
  });
  const response = (operation: CatalogOperation) => ({
    operationId: operation.id,
    variantId,
    status: operation.status,
  });
  if (existing.status !== 'pending') return response(existing);
  const now = deps.now ?? (() => new Date());
  let operation = await deps.journal.claim(existing.id, now());
  if (!operation) return response(existing);
  try {
    const item = await deps.catalog.findByVariantId(variantId);
    const record = item && (await deps.catalog.findByStoreItem(item));
    const projection = item && (await createRuntimeCatalogProductProjectionReader(deps.catalog).findByStoreItem(item));
    const mapping = await deps.mappings.findByVariantId(variantId);
    if (
      !item ||
      !record ||
      !projection ||
      !mapping?.stripeProductId ||
      record.catalogRevision !== command.expectedRevision
    )
      throw new CatalogPriceConflictError('Catalog identity or revision changed.');
    const metadata = createStripeCatalogMetadata(deps.environment, item);
    const leaseActive = () => operation?.leaseUntil && operation.leaseUntil > now().toISOString();
    if (operation.step === 'started') {
      const current = await deps.gateway.retrieveDefaultPrice(mapping.stripeProductId);
      if (
        !current ||
        current.priceId !== mapping.stripePriceId ||
        current.productId !== mapping.stripeProductId ||
        current.productTaxCode !== 'txcd_99999999' ||
        !current.active ||
        !current.productActive ||
        !createStoreOfferPriceFromCatalogPrice(current) ||
        Object.entries(metadata).some(
          ([key, value]) => current.metadata[key] !== value || current.productMetadata[key] !== value,
        )
      )
        throw new CatalogPriceConflictError('Current price requires reconciliation.');
      operation = await deps.journal.advance(
        operation,
        'validated',
        {
          stripeProductId: mapping.stripeProductId,
          previousStripePriceId: current.priceId,
        },
        now(),
      );
      if (!operation) return response((await deps.journal.find(existing.id))!);
    }
    if (
      operation.results.stripeProductId !== mapping.stripeProductId ||
      operation.results.previousStripePriceId !== mapping.stripePriceId
    )
      throw new CatalogPriceConflictError('Bound price changed.');
    const providerInput = {
      ...command.price,
      metadata,
      productName: projection.name,
      lookupKey: createStripeCatalogLookupKey(deps.environment, item),
      productId: mapping.stripeProductId,
      expectedDefaultPriceId: operation.results.previousStripePriceId!,
      operationId: operation.id,
    };
    if (operation.step === 'validated') {
      if (!leaseActive()) return response(operation);
      const replacement = await deps.gateway.createReplacementPrice(providerInput, context);
      operation = await deps.journal.advance(operation, 'price_bound', { stripePriceId: replacement.priceId }, now());
      if (!operation) return response((await deps.journal.find(existing.id))!);
    }
    if (!['price_bound', 'default_selected'].includes(operation.step) || !operation.results.stripePriceId)
      throw new CatalogPriceConflictError('Invalid price operation state.');
    if (!leaseActive()) return response(operation);
    // Revalidates the selected default on resumed operations as well as first selection.
    const selected = await deps.gateway.selectReplacementPrice(
      providerInput,
      parseStripePriceId(operation.results.stripePriceId),
      context,
    );
    if (operation.step === 'price_bound') {
      operation = await deps.journal.advance(operation, 'default_selected', {}, now());
      if (!operation) return response((await deps.journal.find(existing.id))!);
    }
    const syncedAt = now();
    const completed = await deps.journal.completePriceChange(
      operation,
      {
        variantId,
        storeItemSlug: item.storeItemSlug,
        stripePriceId: selected.priceId,
        stripeLookupKey: providerInput.lookupKey,
        amountMinor: selected.amountMinor,
        currencyCode: 'EUR',
        priceActive: selected.active,
        productActive: selected.productActive,
        syncedAt,
        freshUntil: new Date(syncedAt.getTime() + STORE_OFFER_FRESHNESS_MS),
      },
      command.price.kind,
      syncedAt,
    );
    if (!completed) await deps.journal.markNeedsReview(operation, 'revision_conflict', now());
    return response((await deps.journal.find(existing.id))!);
  } catch (error) {
    if (operation && error instanceof CatalogPriceConflictError) {
      await deps.journal.markNeedsReview(operation, 'identity_conflict', now());
      return response((await deps.journal.find(existing.id))!);
    }
    // Unknown provider/D1 acknowledgement failures retain the claim and phase for scoped retry.
    throw error;
  }
}
