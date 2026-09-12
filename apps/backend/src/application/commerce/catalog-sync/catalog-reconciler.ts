import type {
  StoreItemOptionRecord,
  StoreItemOptionRepository,
  StoreOfferSnapshotRepository,
  VariantStripeMappingRepository,
} from '../../../domain/commerce/repositories/spi';
import {
  createStripeCatalogLookupKey,
  createStripeCatalogMetadata,
  createStripeCatalogMutationContext,
  createStripeCatalogRequestShapeFingerprint,
  redactStripeObjectId,
} from './catalog-identifiers';
import type {
  CatalogSyncAction,
  CatalogSyncIssue,
  CatalogSyncRunResult,
  CatalogSyncVariantResult,
  StripeCatalogExpectedPrice,
  StripeCatalogGateway,
  StripeCatalogPrice,
  StripeCatalogEnvironment,
  StripeCatalogMutationContext,
  StripeCatalogProduct,
  StripeCatalogProductProjection,
} from './types';
import { createStoreOfferPriceFromCatalogPrice } from './money';

const STORE_OFFER_FRESHNESS_MS = 24 * 60 * 60 * 1_000;
const MAX_CATALOG_ITEMS = 500;
const PRICE_AUTHORITY_CURRENCY_CODE = 'EUR';

export class CatalogDriftError extends Error {
  public constructor(message = 'Checkout catalog needs review before payment can start.') {
    super(message);
    this.name = 'CatalogDriftError';
  }
}

export type CatalogReconcilerDependencies = {
  creationMutationScope?: string | null;
  environment: StripeCatalogEnvironment;
  storeItems: StoreItemOptionRepository;
  storeOfferSnapshots: StoreOfferSnapshotRepository;
  stripeCatalog: StripeCatalogGateway;
  variantStripeMappings: VariantStripeMappingRepository;
};

export type ReconcileCatalogVariantOptions = {
  apply: boolean;
  applyProductProjection?: boolean;
  expectedPrice?: StripeCatalogExpectedPrice | null;
  now?: Date;
  productProjection?: StripeCatalogProductProjection | null;
};

export class CatalogReconciler {
  public constructor(private readonly dependencies: CatalogReconcilerDependencies) {}

  public async reconcileVariant(
    storeItem: StoreItemOptionRecord,
    options: ReconcileCatalogVariantOptions,
  ): Promise<CatalogSyncVariantResult> {
    const now = options.now ?? new Date();
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
          taxBehavior: 'inclusive',
          amountMinor: snapshot.amountMinor,
          currencyCode: snapshot.currencyCode,
          customUnitAmount: null,
          lookupKey: snapshot.stripeLookupKey,
          metadata,
          priceKind: 'fixed',
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

    const mappedPrice =
      mapping && !mapping.stripeProductId
        ? await this.dependencies.stripeCatalog.retrievePrice(mapping.stripePriceId)
        : null;
    const productId = mapping?.stripeProductId ?? mappedPrice?.productId;
    const defaultPrice = productId ? await this.dependencies.stripeCatalog.retrieveDefaultPrice(productId) : null;
    const candidates = defaultPrice ? [defaultPrice] : [];
    const issues: CatalogSyncIssue[] = [];
    const actions: CatalogSyncAction[] = [];
    const expectedPrice =
      options.expectedPrice && this.dependencies.environment !== 'prd'
        ? normalizeExpectedPrice(options.expectedPrice)
        : null;

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

    if (
      !issues.some((issue) => issue.code === 'wrong_variant_identity') &&
      candidates.some((price) => hasCatalogIdentityConflict(price, storeItem, this.dependencies.environment, lookupKey))
    ) {
      issues.push(
        createIssue(storeItem, 'wrong_variant_identity', `Stripe Price identity signals disagree for ${lookupKey}.`),
      );
    }

    let resolvedPrice = defaultPrice;

    if (!resolvedPrice && !mapping && expectedPrice && issues.length === 0) {
      const priceInput = createCatalogPriceInput(
        storeItem,
        lookupKey,
        metadata,
        expectedPrice,
        options.productProjection,
      );
      const createContext = createMutationContext(
        this.dependencies.environment,
        storeItem.variantId,
        'create_catalog_price',
        createCatalogPriceMutationIdentity(expectedPrice, options.productProjection ?? null, null),
        priceInput,
        this.dependencies.creationMutationScope,
      );
      if (options.apply) {
        resolvedPrice = await this.dependencies.stripeCatalog.createCatalogPrice(priceInput, createContext);
        actions.push({ kind: 'create_catalog_price', ...createMutationEvidence(createContext, resolvedPrice) });
      } else {
        actions.push({ kind: 'create_catalog_price', ...createMutationEvidence(createContext) });
      }
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
      if (!createStoreOfferPriceFromCatalogPrice(resolvedPrice)) {
        issues.push(createIssue(storeItem, 'wrong_amount', 'Default Price has an unsupported amount configuration.'));
      }
      if (resolvedPrice.productTaxCode !== 'txcd_99999999') {
        issues.push(createIssue(storeItem, 'wrong_tax_code', 'Product must use the approved tangible-goods tax code.'));
      }
      if (resolvedPrice.taxBehavior !== 'inclusive') {
        issues.push(
          createIssue(
            storeItem,
            'wrong_tax_behavior',
            'Price must explicitly include VAT; use the approved replacement procedure.',
          ),
        );
      }
      if (!resolvedPrice.active) {
        issues.push(createIssue(storeItem, 'inactive_price', 'Resolved Stripe Price is inactive.'));
      }

      if (!resolvedPrice.productActive) {
        issues.push(createIssue(storeItem, 'inactive_product', 'Resolved Stripe Product is inactive.'));
      }

      if (!matchesCatalogIdentity(resolvedPrice, storeItem, this.dependencies.environment, lookupKey)) {
        issues.push(createIssue(storeItem, 'wrong_variant_identity', 'Resolved Stripe Price metadata is wrong.'));
      }

      if (resolvedPrice.currencyCode?.toUpperCase() !== PRICE_AUTHORITY_CURRENCY_CODE) {
        issues.push(
          createIssue(
            storeItem,
            'wrong_currency',
            `Expected ${PRICE_AUTHORITY_CURRENCY_CODE}; Stripe has ${resolvedPrice.currencyCode ?? 'unknown'}.`,
          ),
        );
      }

      if (mapping?.stripePriceId !== resolvedPrice.priceId || mapping?.stripeProductId !== resolvedPrice.productId) {
        actions.push({ kind: 'update_mapping', stripePriceId: resolvedPrice.priceId });
      }

      if (options.productProjection && options.applyProductProjection !== false) {
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
            const productContext = createMutationContext(
              this.dependencies.environment,
              storeItem.variantId,
              'update_product_projection',
              resolvedPrice.productId,
              {
                productId: resolvedPrice.productId,
                productProjection: options.productProjection,
                stripeMetadata: metadata,
              },
            );
            actions.push({
              kind: 'update_product_projection',
              productId: resolvedPrice.productId,
              ...createMutationEvidence(productContext),
            });
          }
        }
      }

      const snapshotAmountMinor = getStoreOfferSnapshotAmountMinor(resolvedPrice);
      if (
        snapshotAmountMinor !== undefined &&
        (!snapshot ||
          snapshot.amountMinor !== snapshotAmountMinor ||
          snapshot.currencyCode.toUpperCase() !== resolvedPrice.currencyCode?.toUpperCase() ||
          snapshot.stripePriceId !== resolvedPrice.priceId ||
          snapshot.stripeLookupKey !== lookupKey)
      ) {
        actions.push({ kind: 'update_snapshot' });
      }

      if (
        snapshot &&
        (snapshotAmountMinor === undefined ||
          snapshot.amountMinor !== snapshotAmountMinor ||
          snapshot.currencyCode.toUpperCase() !== resolvedPrice.currencyCode?.toUpperCase() ||
          snapshot.stripePriceId !== resolvedPrice.priceId)
      ) {
        issues.push(createIssue(storeItem, 'snapshot_mismatch', 'Store Offer snapshot differs from Stripe Price.'));
      }
    }

    const applicableActions = options.apply ? actions : [];

    if (applicableActions.length > 0 && resolvedPrice && canApplyCatalogActions(issues)) {
      await this.applyActions(
        storeItem,
        lookupKey,
        resolvedPrice,
        applicableActions,
        now,
        options.productProjection ?? null,
      );
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
      if (action.kind === 'update_mapping') {
        await this.dependencies.variantStripeMappings.save({
          stripePriceId: resolvedPrice.priceId,
          stripeProductId: resolvedPrice.productId,
          variantId: storeItem.variantId,
        });
      } else if (action.kind === 'update_snapshot' && resolvedPrice.currencyCode) {
        const amountMinor = getStoreOfferSnapshotAmountMinor(resolvedPrice);
        if (amountMinor === undefined) {
          continue;
        }

        await this.dependencies.storeOfferSnapshots.save({
          amountMinor,
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
      } else if (action.kind === 'update_product_projection' && productProjection) {
        this.assertCatalogMutationAllowed(storeItem, lookupKey, resolvedPrice, action.kind);
        const updatedProduct = await this.dependencies.stripeCatalog.updateProductProjection(
          action.productId,
          {
            projection: productProjection,
            stripeMetadata: createStripeCatalogMetadata(this.dependencies.environment, storeItem),
          },
          mutationContextFromAction(action),
        );
        applyProductMutationResponseEvidence(action, updatedProduct);
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
  const expectedMetadata = createStripeCatalogMetadata(environment, storeItem);
  const identitySignals = [
    {
      matches: price.lookupKey === lookupKey,
      present: Boolean(price.lookupKey),
    },
    {
      matches: hasMetadata(price.metadata, expectedMetadata),
      present: hasAnyMetadata(price.metadata, expectedMetadata),
    },
    {
      matches: hasMetadata(price.productMetadata, expectedMetadata),
      present: hasAnyMetadata(price.productMetadata, expectedMetadata),
    },
  ];
  const presentSignals = identitySignals.filter((signal) => signal.present);

  return presentSignals.length > 0 && presentSignals.every((signal) => signal.matches);
}

function hasCatalogIdentityConflict(
  price: StripeCatalogPrice,
  storeItem: StoreItemOptionRecord,
  environment: StripeCatalogEnvironment,
  lookupKey: string,
): boolean {
  const expectedMetadata = createStripeCatalogMetadata(environment, storeItem);
  const identitySignals = [
    {
      matches: price.lookupKey === lookupKey,
      present: Boolean(price.lookupKey),
    },
    {
      matches: hasMetadata(price.metadata, expectedMetadata),
      present: hasAnyMetadata(price.metadata, expectedMetadata),
    },
    {
      matches: hasMetadata(price.productMetadata, expectedMetadata),
      present: hasAnyMetadata(price.productMetadata, expectedMetadata),
    },
  ];

  return (
    identitySignals.some((signal) => signal.present && signal.matches) &&
    identitySignals.some((signal) => signal.present && !signal.matches)
  );
}

function hasMetadata(candidate: Record<string, string>, expected: Record<string, string>): boolean {
  return Object.entries(expected).every(([key, value]) => candidate[key] === value);
}

function hasAnyMetadata(candidate: Record<string, string>, expected: Record<string, string>): boolean {
  return Object.keys(expected).some((key) => key in candidate);
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
        `kind=${price.priceKind}`,
        `amount=${price.amountMinor ?? 'unknown'}`,
        `custom=${describeCustomUnitAmount(price.customUnitAmount)}`,
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

function normalizeExpectedPrice(expectedPrice: StripeCatalogExpectedPrice): StripeCatalogExpectedPrice {
  if ((expectedPrice as { kind?: string }).kind) {
    return expectedPrice;
  }

  return {
    ...expectedPrice,
    kind: 'fixed',
  } as StripeCatalogExpectedPrice;
}

function getStoreOfferSnapshotAmountMinor(price: StripeCatalogPrice): number | null | undefined {
  if (price.priceKind === 'pay_what_you_want') {
    return null;
  }

  return price.amountMinor ?? undefined;
}

export function hasBlockingCatalogIssue(issues: CatalogSyncIssue[]): boolean {
  return issues.some((issue) =>
    [
      'ambiguous_active_price',
      'foreign_environment_identity',
      'inactive_price',
      'inactive_product',
      'legacy_environment_identity',
      'malformed_catalog_identity',
      'missing_price',
      'owned_orphan_price',
      'owned_orphan_product',
      'placeholder_price_mapping',
      'product_projection_mismatch',
      'wrong_amount',
      'wrong_custom_amount',
      'wrong_currency',
      'wrong_tax_behavior',
      'wrong_tax_code',
      'wrong_price_kind',
      'wrong_variant_identity',
    ].includes(issue.code),
  );
}

export function classifyCatalogSyncIssue(code: CatalogSyncIssue['code']): CatalogSyncIssue['driftCategory'] {
  if (code === 'inactive_product' || code === 'product_projection_mismatch' || code === 'wrong_tax_code') {
    return 'product_projection';
  }

  if (code === 'mapping_points_to_wrong_price' || code === 'placeholder_price_mapping') {
    return 'd1_readiness';
  }

  if (code === 'snapshot_mismatch') {
    return 'store_offer_snapshot';
  }

  if (
    code === 'foreign_environment_identity' ||
    code === 'legacy_environment_identity' ||
    code === 'malformed_catalog_identity' ||
    code === 'owned_orphan_product' ||
    code === 'owned_orphan_price' ||
    code === 'wrong_variant_identity'
  ) {
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

function createCatalogPriceInput(
  storeItem: StoreItemOptionRecord,
  lookupKey: string,
  metadata: ReturnType<typeof createStripeCatalogMetadata>,
  expectedPrice: StripeCatalogExpectedPrice,
  productProjection: StripeCatalogProductProjection | null | undefined,
) {
  return {
    ...expectedPrice,
    currencyCode: expectedPrice.currencyCode,
    lookupKey,
    metadata,
    productName: productProjection?.name ?? storeItem.storeItemSlug,
    productProjection: productProjection ?? null,
  };
}

function createMutationContext(
  environment: StripeCatalogEnvironment,
  variantId: string,
  action: CatalogSyncAction['kind'],
  identity = 'new',
  requestShape: unknown,
  scope?: string | null,
): StripeCatalogMutationContext {
  return createStripeCatalogMutationContext({
    action,
    environment,
    identity,
    requestShape,
    scope,
    variantId,
  });
}

function mutationContextFromAction(
  action: Extract<
    CatalogSyncAction,
    {
      kind:
        | 'archive_price'
        | 'create_catalog_price'
        | 'repair_lookup_key'
        | 'update_product_projection'
        | 'update_stripe_metadata';
    }
  >,
): StripeCatalogMutationContext | undefined {
  return action.idempotencyKey && action.requestShapeFingerprint
    ? {
        idempotencyKey: action.idempotencyKey,
        requestShapeFingerprint: action.requestShapeFingerprint,
      }
    : undefined;
}

function createMutationEvidence(context: StripeCatalogMutationContext, price?: StripeCatalogPrice) {
  return {
    idempotencyKey: context.idempotencyKey,
    requestId: price?.requestId ?? null,
    requestShapeFingerprint: context.requestShapeFingerprint,
    replayed: price?.idempotentReplayed ?? null,
  };
}

function applyProductMutationResponseEvidence(action: CatalogSyncAction, product: StripeCatalogProduct): void {
  Object.assign(action, {
    requestId: product.requestId ?? null,
    replayed: product.idempotentReplayed ?? null,
  });
}

function createCatalogPriceMutationIdentity(
  expectedPrice: StripeCatalogExpectedPrice,
  productProjection: StripeCatalogProductProjection | null,
  repairIdentity: string | null = null,
): string {
  const baseIdentity = expectedPrice.revision
    ? `revision_${expectedPrice.revision}`
    : createStripeCatalogRequestShapeFingerprint({
        expectedPrice,
        currencyCode: expectedPrice.currencyCode.toUpperCase(),
        productProjection,
      });

  return repairIdentity ? `${baseIdentity}:${repairIdentity}` : baseIdentity;
}

function describeCustomUnitAmount(amount: StripeCatalogPrice['customUnitAmount']): string {
  return amount
    ? `min=${amount.minimumAmountMinor ?? 'unknown'},preset=${amount.presetAmountMinor ?? 'unknown'},max=${
        amount.maximumAmountMinor ?? 'unknown'
      }`
    : 'none';
}

function canApplyCatalogActions(issues: CatalogSyncIssue[]): boolean {
  return !issues.some((issue) => hasBlockingCatalogIssue([issue]) && !isRepairableCatalogApplyIssue(issue));
}

function isRepairableCatalogApplyIssue(issue: CatalogSyncIssue): boolean {
  return issue.code === 'product_projection_mismatch';
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
