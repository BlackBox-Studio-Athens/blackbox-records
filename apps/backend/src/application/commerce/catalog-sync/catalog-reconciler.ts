import type {
  StoreItemOptionRecord,
  StoreItemOptionRepository,
  StoreOfferSnapshotRepository,
  VariantStripeMappingRepository,
} from '../../../domain/commerce/repositories/spi';
import { createStripeCatalogLookupKey, createStripeCatalogMetadata, redactStripeObjectId } from './catalog-identifiers';
import type {
  CatalogSyncAction,
  CatalogSyncIssue,
  CatalogSyncRunResult,
  CatalogSyncVariantResult,
  StripeCatalogExpectedPrice,
  StripeCatalogGateway,
  StripeCatalogPrice,
  StripeCatalogEnvironment,
  StripeCatalogProductProjection,
} from './types';

const STORE_OFFER_FRESHNESS_MS = 24 * 60 * 60 * 1_000;
const MAX_CATALOG_ITEMS = 500;

export class CatalogDriftError extends Error {
  public constructor(message = 'Checkout catalog needs review before payment can start.') {
    super(message);
    this.name = 'CatalogDriftError';
  }
}

export type CatalogReconcilerDependencies = {
  environment: StripeCatalogEnvironment;
  storeItems: StoreItemOptionRepository;
  storeOfferSnapshots: StoreOfferSnapshotRepository;
  stripeCatalog: StripeCatalogGateway;
  variantStripeMappings: VariantStripeMappingRepository;
};

export type ReconcileCatalogVariantOptions = {
  apply: boolean;
  expectedPrice?: StripeCatalogExpectedPrice | null;
  now?: Date;
  productProjection?: StripeCatalogProductProjection | null;
  requirePriceAuthority?: boolean;
};

export class CatalogReconciler {
  public constructor(private readonly dependencies: CatalogReconcilerDependencies) {}

  public async reconcileVariant(
    storeItem: StoreItemOptionRecord,
    options: ReconcileCatalogVariantOptions,
  ): Promise<CatalogSyncVariantResult> {
    const now = options.now ?? new Date();
    const requirePriceAuthority = options.requirePriceAuthority ?? true;
    const lookupKey = createStripeCatalogLookupKey(this.dependencies.environment, storeItem);
    const metadata = createStripeCatalogMetadata(this.dependencies.environment, storeItem);
    const [mapping, snapshot] = await Promise.all([
      this.dependencies.variantStripeMappings.findByVariantId(storeItem.variantId),
      this.dependencies.storeOfferSnapshots.findByVariantId(storeItem.variantId),
    ]);

    if (
      this.dependencies.environment === 'local' &&
      mapping?.stripePriceId.startsWith('price_mock_') &&
      snapshot &&
      snapshot.stripePriceId === mapping.stripePriceId
    ) {
      return {
        actions: [],
        issueCount: 0,
        issues: [],
        lookupKey,
        mapping,
        resolvedPrice: {
          active: snapshot.priceActive,
          amountMinor: snapshot.amountMinor,
          currencyCode: snapshot.currencyCode,
          lookupKey: snapshot.stripeLookupKey,
          metadata,
          priceId: snapshot.stripePriceId,
          productActive: snapshot.productActive,
          productDescription: null,
          productId: null,
          productImages: [],
          productMetadata: metadata,
          productName: null,
          productTaxCode: null,
        },
        snapshot,
        storeItem,
      };
    }

    if (!requirePriceAuthority) {
      return {
        actions: [],
        issueCount: 0,
        issues: [],
        lookupKey,
        mapping,
        resolvedPrice: null,
        snapshot,
        storeItem,
      };
    }

    const [lookupPrices, metadataPrices] = await Promise.all([
      this.dependencies.stripeCatalog.listPricesByLookupKey(lookupKey),
      this.dependencies.stripeCatalog.listPricesByMetadata(metadata),
    ]);
    const mappedPrice = mapping ? await this.dependencies.stripeCatalog.retrievePrice(mapping.stripePriceId) : null;
    const candidates = uniquePrices([...lookupPrices, ...metadataPrices, ...(mappedPrice ? [mappedPrice] : [])]);
    const issues: CatalogSyncIssue[] = [];
    const actions: CatalogSyncAction[] = [];

    if (mapping && isPlaceholderStripePriceId(mapping.stripePriceId, this.dependencies.environment)) {
      issues.push(createIssue(storeItem, 'placeholder_price_mapping', 'D1 points at a placeholder Stripe Price ID.'));
    }

    if (mappedPrice && !matchesCatalogIdentity(mappedPrice, storeItem, this.dependencies.environment, lookupKey)) {
      issues.push(
        createIssue(
          storeItem,
          'wrong_variant_identity',
          `Mapped Price ${redactStripeObjectId(mappedPrice.priceId)} does not identify this Store Item variant.`,
        ),
      );
    }

    const activeMatches = candidates.filter(
      (price) =>
        price.active &&
        price.productActive &&
        matchesCatalogIdentity(price, storeItem, this.dependencies.environment, lookupKey),
    );

    if (activeMatches.length > 1) {
      issues.push(
        createIssue(
          storeItem,
          'ambiguous_active_price',
          `Multiple active Prices match ${lookupKey}; archive or disambiguate the stale Price.`,
        ),
      );
    }

    let resolvedPrice = activeMatches.length === 1 ? activeMatches[0]! : null;

    if (
      resolvedPrice &&
      options.apply &&
      options.expectedPrice &&
      issues.length === 0 &&
      !matchesExpectedPrice(resolvedPrice, options.expectedPrice)
    ) {
      actions.push({ kind: 'archive_price', stripePriceId: resolvedPrice.priceId });
      resolvedPrice = await this.dependencies.stripeCatalog.createCatalogPrice(
        {
          amountMinor: options.expectedPrice.amountMinor,
          currencyCode: options.expectedPrice.currencyCode,
          lookupKey,
          metadata,
          productName: options.productProjection?.name ?? storeItem.storeItemSlug,
          productProjection: options.productProjection ?? null,
        },
        createMutationContext(
          this.dependencies.environment,
          storeItem.variantId,
          'create_catalog_price',
          createCatalogPriceMutationIdentity(options.expectedPrice, options.productProjection ?? null),
        ),
      );
      actions.push({ kind: 'create_catalog_price' });
    }

    if (!resolvedPrice && options.apply && options.expectedPrice && issues.length === 0) {
      const repairIdentity =
        activeMatches.length === 0 ? createPriceRepairMutationIdentity(mappedPrice, mapping, snapshot) : null;
      resolvedPrice = await this.dependencies.stripeCatalog.createCatalogPrice(
        {
          amountMinor: options.expectedPrice.amountMinor,
          currencyCode: options.expectedPrice.currencyCode,
          lookupKey,
          metadata,
          productName: options.productProjection?.name ?? storeItem.storeItemSlug,
          productProjection: options.productProjection ?? null,
        },
        createMutationContext(
          this.dependencies.environment,
          storeItem.variantId,
          'create_catalog_price',
          createCatalogPriceMutationIdentity(options.expectedPrice, options.productProjection ?? null, repairIdentity),
        ),
      );
      actions.push({ kind: 'create_catalog_price' });
    }

    if (!resolvedPrice) {
      issues.push(
        createIssue(
          storeItem,
          'missing_price',
          `No unambiguous active Stripe Price matches ${lookupKey}. ${describePriceCandidates(
            candidates,
            storeItem,
            this.dependencies.environment,
            lookupKey,
            metadata,
          )}`,
        ),
      );
    }

    if (resolvedPrice) {
      if (!resolvedPrice.active) {
        issues.push(createIssue(storeItem, 'inactive_price', 'Resolved Stripe Price is inactive.'));
      }

      if (!resolvedPrice.productActive) {
        issues.push(createIssue(storeItem, 'inactive_product', 'Resolved Stripe Product is inactive.'));
      }

      if (!matchesCatalogIdentity(resolvedPrice, storeItem, this.dependencies.environment, lookupKey)) {
        issues.push(createIssue(storeItem, 'wrong_variant_identity', 'Resolved Stripe Price metadata is wrong.'));
      }

      if (options.expectedPrice && resolvedPrice.amountMinor !== options.expectedPrice.amountMinor) {
        issues.push(
          createIssue(
            storeItem,
            'wrong_amount',
            `Expected ${options.expectedPrice.amountMinor}; Stripe has ${resolvedPrice.amountMinor ?? 'unknown'}.`,
          ),
        );
      }

      if (
        options.expectedPrice &&
        resolvedPrice.currencyCode?.toUpperCase() !== options.expectedPrice.currencyCode.toUpperCase()
      ) {
        issues.push(
          createIssue(
            storeItem,
            'wrong_currency',
            `Expected ${options.expectedPrice.currencyCode}; Stripe has ${resolvedPrice.currencyCode ?? 'unknown'}.`,
          ),
        );
      }

      if (mapping?.stripePriceId !== resolvedPrice.priceId) {
        actions.push({ kind: 'update_mapping', stripePriceId: resolvedPrice.priceId });
      }

      if (!hasMetadata(resolvedPrice.metadata, metadata) || !hasMetadata(resolvedPrice.productMetadata, metadata)) {
        actions.push({ kind: 'update_stripe_metadata', stripePriceId: resolvedPrice.priceId });
      }

      if (options.productProjection) {
        const productProjectionIssues = findProductProjectionIssues(
          resolvedPrice,
          createExpectedStripeProductProjection(metadata, options.productProjection),
        );

        if (productProjectionIssues.length > 0) {
          issues.push(
            createIssue(
              storeItem,
              'product_projection_mismatch',
              `Stripe Product projection differs: ${productProjectionIssues.join(', ')}.`,
            ),
          );

          if (resolvedPrice.productId) {
            actions.push({ kind: 'update_product_projection', productId: resolvedPrice.productId });
          }
        }
      }

      if (
        !snapshot ||
        snapshot.amountMinor !== resolvedPrice.amountMinor ||
        snapshot.currencyCode.toUpperCase() !== resolvedPrice.currencyCode?.toUpperCase() ||
        snapshot.stripePriceId !== resolvedPrice.priceId ||
        snapshot.stripeLookupKey !== lookupKey ||
        snapshot.freshUntil.getTime() <= now.getTime()
      ) {
        actions.push({ kind: 'update_snapshot' });
      }

      if (snapshot && snapshot.freshUntil.getTime() <= now.getTime()) {
        issues.push(createIssue(storeItem, 'snapshot_stale', 'Store Offer snapshot is stale.'));
      }

      if (
        snapshot &&
        (snapshot.amountMinor !== resolvedPrice.amountMinor ||
          snapshot.currencyCode.toUpperCase() !== resolvedPrice.currencyCode?.toUpperCase() ||
          snapshot.stripePriceId !== resolvedPrice.priceId)
      ) {
        issues.push(createIssue(storeItem, 'snapshot_mismatch', 'Store Offer snapshot differs from Stripe Price.'));
      }
    }

    if (options.apply && resolvedPrice && canApplyCatalogActions(issues)) {
      await this.applyActions(storeItem, lookupKey, resolvedPrice, actions, now, options.productProjection ?? null);
    }

    return {
      actions,
      issueCount: issues.length,
      issues,
      lookupKey,
      mapping,
      resolvedPrice,
      snapshot,
      storeItem,
    };
  }

  public async verifyBuyableCatalog(input: {
    apply: boolean;
    expectedPrices?: Map<string, StripeCatalogExpectedPrice>;
    expectedProductProjections?: Map<string, StripeCatalogProductProjection>;
    now?: Date;
  }): Promise<CatalogSyncRunResult> {
    const storeItems = await this.dependencies.storeItems.search(null, MAX_CATALOG_ITEMS);
    const results = await this.verifyCatalogSequentially(storeItems, input);
    const issues = results.flatMap((result) => result.issues);

    return {
      dryRun: !input.apply,
      environment: this.dependencies.environment,
      issues,
      results,
    };
  }

  private async verifyCatalogSequentially(
    storeItems: StoreItemOptionRecord[],
    input: {
      apply: boolean;
      expectedPrices?: Map<string, StripeCatalogExpectedPrice>;
      expectedProductProjections?: Map<string, StripeCatalogProductProjection>;
      now?: Date;
    },
  ): Promise<CatalogSyncVariantResult[]> {
    const results: CatalogSyncVariantResult[] = [];

    for (const storeItem of storeItems) {
      results.push(await this.verifyCatalogStoreItem(storeItem, input));
      await sleep(500);
    }

    return results;
  }

  private verifyCatalogStoreItem(
    storeItem: StoreItemOptionRecord,
    input: {
      apply: boolean;
      expectedPrices?: Map<string, StripeCatalogExpectedPrice>;
      expectedProductProjections?: Map<string, StripeCatalogProductProjection>;
      now?: Date;
    },
  ): Promise<CatalogSyncVariantResult> {
    const expectedPrice = input.expectedPrices?.get(storeItem.variantId) ?? null;

    return this.reconcileVariant(storeItem, {
      apply: input.apply,
      expectedPrice,
      productProjection: input.expectedProductProjections?.get(storeItem.variantId) ?? null,
      requirePriceAuthority: Boolean(expectedPrice),
      now: input.now,
    });
  }

  private async applyActions(
    storeItem: StoreItemOptionRecord,
    lookupKey: string,
    resolvedPrice: StripeCatalogPrice,
    actions: CatalogSyncAction[],
    now: Date,
    productProjection: StripeCatalogProductProjection | null,
  ): Promise<void> {
    for (const action of actions) {
      if (action.kind === 'archive_price') {
        await this.dependencies.stripeCatalog.archivePrice(
          action.stripePriceId,
          createMutationContext(this.dependencies.environment, storeItem.variantId, action.kind, action.stripePriceId),
        );
      } else if (action.kind === 'update_mapping') {
        await this.dependencies.variantStripeMappings.save({
          stripePriceId: resolvedPrice.priceId,
          variantId: storeItem.variantId,
        });
      } else if (
        action.kind === 'update_snapshot' &&
        resolvedPrice.amountMinor !== null &&
        resolvedPrice.currencyCode
      ) {
        await this.dependencies.storeOfferSnapshots.save({
          amountMinor: resolvedPrice.amountMinor,
          currencyCode: resolvedPrice.currencyCode.toUpperCase(),
          freshUntil: new Date(now.getTime() + STORE_OFFER_FRESHNESS_MS),
          priceActive: resolvedPrice.active,
          productActive: resolvedPrice.productActive,
          storeItemSlug: storeItem.storeItemSlug,
          stripeLookupKey: lookupKey,
          stripePriceId: resolvedPrice.priceId,
          syncedAt: now,
          variantId: storeItem.variantId,
        });
      } else if (action.kind === 'update_stripe_metadata') {
        this.assertCatalogMutationAllowed(storeItem, lookupKey, resolvedPrice, action.kind);
        await this.dependencies.stripeCatalog.updatePriceMetadata(
          resolvedPrice.priceId,
          createStripeCatalogMetadata(this.dependencies.environment, storeItem),
          createMutationContext(this.dependencies.environment, storeItem.variantId, action.kind, resolvedPrice.priceId),
        );
      } else if (action.kind === 'update_product_projection' && productProjection) {
        this.assertCatalogMutationAllowed(storeItem, lookupKey, resolvedPrice, action.kind);
        await this.dependencies.stripeCatalog.updateProductProjection(
          action.productId,
          {
            projection: productProjection,
            stripeMetadata: createStripeCatalogMetadata(this.dependencies.environment, storeItem),
          },
          createMutationContext(this.dependencies.environment, storeItem.variantId, action.kind, action.productId),
        );
      }
    }
  }

  private assertCatalogMutationAllowed(
    storeItem: StoreItemOptionRecord,
    lookupKey: string,
    resolvedPrice: StripeCatalogPrice,
    action: CatalogSyncAction['kind'],
  ): void {
    if (this.dependencies.environment !== 'prd') {
      return;
    }

    if (!matchesCatalogIdentity(resolvedPrice, storeItem, this.dependencies.environment, lookupKey)) {
      throw new Error(`Refusing production ${action}: resolved Stripe Price is not app-owned for ${lookupKey}.`);
    }

    if (action === 'update_product_projection' && !resolvedPrice.productId) {
      throw new Error(`Refusing production ${action}: resolved Stripe Product is missing for ${lookupKey}.`);
    }
  }
}

function matchesCatalogIdentity(
  price: StripeCatalogPrice,
  storeItem: StoreItemOptionRecord,
  environment: StripeCatalogEnvironment,
  lookupKey: string,
): boolean {
  return (
    price.lookupKey === lookupKey ||
    hasMetadata(price.metadata, createStripeCatalogMetadata(environment, storeItem)) ||
    hasMetadata(price.productMetadata, createStripeCatalogMetadata(environment, storeItem))
  );
}

function hasMetadata(candidate: Record<string, string>, expected: Record<string, string>): boolean {
  return Object.entries(expected).every(([key, value]) => candidate[key] === value);
}

function describePriceCandidates(
  candidates: StripeCatalogPrice[],
  storeItem: StoreItemOptionRecord,
  environment: StripeCatalogEnvironment,
  lookupKey: string,
  metadata: Record<string, string>,
): string {
  if (candidates.length === 0) {
    return 'Stripe returned 0 candidate Prices.';
  }

  const summaries = candidates
    .slice(0, 10)
    .map((price) =>
      [
        redactStripeObjectId(price.priceId),
        `active=${price.active}`,
        `productActive=${price.productActive}`,
        `amount=${price.amountMinor ?? 'unknown'}`,
        `currency=${price.currencyCode ?? 'unknown'}`,
        `lookup=${price.lookupKey === lookupKey ? 'match' : price.lookupKey ? 'other' : 'missing'}`,
        `priceMetadata=${hasMetadata(price.metadata, metadata) ? 'match' : 'missing'}`,
        `productMetadata=${hasMetadata(price.productMetadata, metadata) ? 'match' : 'missing'}`,
        `identity=${matchesCatalogIdentity(price, storeItem, environment, lookupKey) ? 'match' : 'missing'}`,
      ].join(','),
    );
  const truncatedCount = Math.max(0, candidates.length - summaries.length);
  const suffix = truncatedCount > 0 ? `; ${truncatedCount} more omitted` : '';

  return `Stripe returned ${candidates.length} candidate Price(s): ${summaries.join(' | ')}${suffix}.`;
}

function matchesExpectedPrice(price: StripeCatalogPrice, expectedPrice: StripeCatalogExpectedPrice): boolean {
  return (
    price.amountMinor === expectedPrice.amountMinor &&
    price.currencyCode?.toUpperCase() === expectedPrice.currencyCode.toUpperCase()
  );
}

export function hasBlockingCatalogIssue(issues: CatalogSyncIssue[]): boolean {
  return issues.some((issue) =>
    [
      'ambiguous_active_price',
      'inactive_price',
      'inactive_product',
      'missing_price',
      'placeholder_price_mapping',
      'product_projection_mismatch',
      'wrong_amount',
      'wrong_currency',
      'wrong_variant_identity',
    ].includes(issue.code),
  );
}

export function classifyCatalogSyncIssue(code: CatalogSyncIssue['code']): CatalogSyncIssue['driftCategory'] {
  if (code === 'inactive_product' || code === 'product_projection_mismatch') {
    return 'product_projection';
  }

  if (code === 'mapping_points_to_wrong_price' || code === 'placeholder_price_mapping') {
    return 'd1_readiness';
  }

  if (code === 'snapshot_mismatch' || code === 'snapshot_stale') {
    return 'store_offer_snapshot';
  }

  if (code === 'wrong_variant_identity') {
    return 'catalog_identity';
  }

  return 'price_authority';
}

function createExpectedStripeProductProjection(
  metadata: ReturnType<typeof createStripeCatalogMetadata>,
  projection: StripeCatalogProductProjection,
): StripeCatalogProductProjection {
  return {
    ...projection,
    metadata: {
      ...projection.metadata,
      ...metadata,
    },
  };
}

function findProductProjectionIssues(
  price: StripeCatalogPrice,
  expectedProjection: StripeCatalogProductProjection,
): string[] {
  const issues: string[] = [];

  if (price.productName !== expectedProjection.name) {
    issues.push('name');
  }

  if ((price.productDescription ?? '') !== expectedProjection.description) {
    issues.push('description');
  }

  if (!sameStringList(price.productImages, expectedProjection.imageUrls)) {
    issues.push('images');
  }

  if (!hasMetadata(price.productMetadata, expectedProjection.metadata)) {
    issues.push('metadata');
  }

  if ((price.productTaxCode ?? null) !== expectedProjection.taxCode) {
    issues.push('tax_code');
  }

  return issues;
}

function sameStringList(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function createMutationContext(
  environment: StripeCatalogEnvironment,
  variantId: string,
  action: CatalogSyncAction['kind'],
  identity = 'new',
) {
  return {
    idempotencyKey: ['blackbox', 'catalog', environment, variantId, action, identity].join(':'),
  };
}

function createCatalogPriceMutationIdentity(
  expectedPrice: StripeCatalogExpectedPrice,
  productProjection: StripeCatalogProductProjection | null,
  repairIdentity: string | null = null,
): string {
  const baseIdentity = expectedPrice.revision
    ? `revision_${expectedPrice.revision}`
    : createStableShortHash(
        JSON.stringify({
          amountMinor: expectedPrice.amountMinor,
          currencyCode: expectedPrice.currencyCode.toUpperCase(),
          productProjection,
        }),
      );

  return repairIdentity ? `${baseIdentity}:${repairIdentity}` : baseIdentity;
}

function createPriceRepairMutationIdentity(
  price: StripeCatalogPrice | null,
  mapping: { stripePriceId: string } | null,
  snapshot: { priceActive: boolean; productActive: boolean; stripePriceId: string } | null,
): string | null {
  if (price) {
    return [
      'replace_price',
      price.priceId,
      price.active ? 'price_active' : 'price_inactive',
      price.productActive ? 'product_active' : 'product_inactive',
    ].join('_');
  }

  if (mapping) {
    return ['replace_mapping', mapping.stripePriceId].join('_');
  }

  if (snapshot) {
    return [
      'replace_snapshot',
      snapshot.stripePriceId,
      snapshot.priceActive ? 'price_active' : 'price_inactive',
      snapshot.productActive ? 'product_active' : 'product_inactive',
    ].join('_');
  }

  return null;
}

function createStableShortHash(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
  }

  return `v${(hash >>> 0).toString(36)}`;
}

function canApplyCatalogActions(issues: CatalogSyncIssue[]): boolean {
  return !issues.some((issue) => hasBlockingCatalogIssue([issue]) && !isRepairableCatalogApplyIssue(issue));
}

function isRepairableCatalogApplyIssue(issue: CatalogSyncIssue): boolean {
  return (
    issue.code === 'product_projection_mismatch' ||
    (issue.code === 'wrong_variant_identity' && issue.detail.startsWith('Mapped Price '))
  );
}

function isPlaceholderStripePriceId(value: string, environment: StripeCatalogEnvironment): boolean {
  return (
    (environment !== 'local' && value.startsWith('price_mock_')) ||
    value === 'price_replace_with_real_stripe_test_price'
  );
}

function createIssue(
  storeItem: StoreItemOptionRecord,
  code: CatalogSyncIssue['code'],
  detail: string,
): CatalogSyncIssue {
  return {
    code,
    detail,
    driftCategory: classifyCatalogSyncIssue(code),
    storeItemSlug: storeItem.storeItemSlug,
    variantId: storeItem.variantId,
  };
}

function uniquePrices(prices: StripeCatalogPrice[]): StripeCatalogPrice[] {
  return [...new Map(prices.map((price) => [price.priceId, price])).values()];
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
