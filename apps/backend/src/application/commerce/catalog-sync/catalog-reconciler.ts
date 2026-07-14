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
    const expectedPrice = options.expectedPrice ? normalizeExpectedPrice(options.expectedPrice) : null;

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

    if (resolvedPrice && expectedPrice && issues.length === 0 && !matchesExpectedPrice(resolvedPrice, expectedPrice)) {
      actions.push(createArchivePriceAction(this.dependencies.environment, storeItem.variantId, resolvedPrice.priceId));
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
        createCatalogPriceMutationIdentity(expectedPrice, options.productProjection ?? null),
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

    if (!resolvedPrice && expectedPrice && issues.length === 0) {
      const repairIdentity =
        activeMatches.length === 0 ? createPriceRepairMutationIdentity(mappedPrice, mapping, snapshot) : null;
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
        createCatalogPriceMutationIdentity(expectedPrice, options.productProjection ?? null, repairIdentity),
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
      if (!resolvedPrice.active) {
        issues.push(createIssue(storeItem, 'inactive_price', 'Resolved Stripe Price is inactive.'));
      }

      if (!resolvedPrice.productActive) {
        issues.push(createIssue(storeItem, 'inactive_product', 'Resolved Stripe Product is inactive.'));
      }

      if (!matchesCatalogIdentity(resolvedPrice, storeItem, this.dependencies.environment, lookupKey)) {
        issues.push(createIssue(storeItem, 'wrong_variant_identity', 'Resolved Stripe Price metadata is wrong.'));
      }

      if (!expectedPrice && resolvedPrice.currencyCode?.toUpperCase() !== PRICE_AUTHORITY_CURRENCY_CODE) {
        issues.push(
          createIssue(
            storeItem,
            'wrong_currency',
            `Expected ${PRICE_AUTHORITY_CURRENCY_CODE}; Stripe has ${resolvedPrice.currencyCode ?? 'unknown'}.`,
          ),
        );
      }

      if (expectedPrice) {
        for (const priceIssue of findExpectedPriceIssues(resolvedPrice, expectedPrice)) {
          issues.push(createIssue(storeItem, priceIssue.code, priceIssue.detail));
        }
      }

      if (resolvedPrice.lookupKey === null) {
        const lookupKeyContext = createMutationContext(
          this.dependencies.environment,
          storeItem.variantId,
          'repair_lookup_key',
          resolvedPrice.priceId,
          {
            lookupKey,
            stripePriceId: resolvedPrice.priceId,
            transferLookupKey: true,
          },
        );
        actions.push({
          kind: 'repair_lookup_key',
          lookupKey,
          stripePriceId: resolvedPrice.priceId,
          ...createMutationEvidence(lookupKeyContext),
        });
      }

      if (mapping?.stripePriceId !== resolvedPrice.priceId) {
        actions.push({ kind: 'update_mapping', stripePriceId: resolvedPrice.priceId });
      }

      if (!hasMetadata(resolvedPrice.metadata, metadata) || !hasMetadata(resolvedPrice.productMetadata, metadata)) {
        const metadataContext = createMutationContext(
          this.dependencies.environment,
          storeItem.variantId,
          'update_stripe_metadata',
          resolvedPrice.priceId,
          {
            metadata,
            priceId: resolvedPrice.priceId,
          },
        );
        actions.push({
          kind: 'update_stripe_metadata',
          stripePriceId: resolvedPrice.priceId,
          ...createMutationEvidence(metadataContext),
        });
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

          if (resolvedPrice.productId && options.applyProductProjection !== false) {
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
          snapshot.stripeLookupKey !== lookupKey ||
          snapshot.freshUntil.getTime() <= now.getTime())
      ) {
        actions.push({ kind: 'update_snapshot' });
      }

      if (snapshot && snapshot.freshUntil.getTime() <= now.getTime()) {
        issues.push(createIssue(storeItem, 'snapshot_stale', 'Store Offer snapshot is stale.'));
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
    const expectedVariantIds = input.expectedPrices
      ? new Set(input.expectedPrices.keys())
      : new Set(storeItems.map((item) => item.variantId));
    const ownedObjectDriftIssues = await this.findOwnedObjectDriftIssues(expectedVariantIds);
    const apply = input.apply && !hasBlockingCatalogIssue(ownedObjectDriftIssues);
    const results = await this.verifyCatalogSequentially(storeItems, {
      ...input,
      apply,
    });
    const issues = [...results.flatMap((result) => result.issues), ...ownedObjectDriftIssues];

    return {
      dryRun: !apply,
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
    const requirePriceAuthority = input.expectedPrices ? input.expectedPrices.has(storeItem.variantId) : true;

    return this.reconcileVariant(storeItem, {
      apply: input.apply,
      expectedPrice,
      productProjection: input.expectedProductProjections?.get(storeItem.variantId) ?? null,
      requirePriceAuthority,
      now: input.now,
    });
  }

  private async findOwnedObjectDriftIssues(expectedVariantIds: Set<string>): Promise<CatalogSyncIssue[]> {
    const [ownedPrices, ownedProducts] = await Promise.all([
      this.dependencies.stripeCatalog.listOwnedPrices(this.dependencies.environment),
      this.dependencies.stripeCatalog.listOwnedProducts(this.dependencies.environment),
    ]);
    const issues: CatalogSyncIssue[] = [];

    for (const price of ownedPrices) {
      const identity = readPriceCatalogIdentity(price);
      const code = classifyOwnedObjectIdentity(identity, expectedVariantIds, this.dependencies.environment, 'price');

      if (code) {
        issues.push(createOwnedObjectIssue(identity, code, `Stripe Price ${redactStripeObjectId(price.priceId)}`));
      }
    }

    for (const product of ownedProducts) {
      const identity = readMetadataCatalogIdentity(product.metadata) ?? emptyCatalogIdentity();
      const code = classifyOwnedObjectIdentity(identity, expectedVariantIds, this.dependencies.environment, 'product');

      if (code) {
        issues.push(
          createOwnedObjectIssue(identity, code, `Stripe Product ${redactStripeObjectId(product.productId)}`),
        );
      }
    }

    return issues;
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
        const archivedPrice = await this.dependencies.stripeCatalog.archivePrice(
          action.stripePriceId,
          mutationContextFromAction(action),
        );
        applyMutationResponseEvidence(action, archivedPrice);
      } else if (action.kind === 'repair_lookup_key') {
        this.assertCatalogMutationAllowed(storeItem, lookupKey, resolvedPrice, action.kind);
        const updatedPrice = await this.dependencies.stripeCatalog.updatePriceLookupKey(
          resolvedPrice.priceId,
          action.lookupKey,
          mutationContextFromAction(action),
        );
        applyMutationResponseEvidence(action, updatedPrice);
      } else if (action.kind === 'update_mapping') {
        await this.dependencies.variantStripeMappings.save({
          stripePriceId: resolvedPrice.priceId,
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
      } else if (action.kind === 'update_stripe_metadata') {
        this.assertCatalogMutationAllowed(storeItem, lookupKey, resolvedPrice, action.kind);
        const updatedPrice = await this.dependencies.stripeCatalog.updatePriceMetadata(
          resolvedPrice.priceId,
          createStripeCatalogMetadata(this.dependencies.environment, storeItem),
          mutationContextFromAction(action),
        );
        applyMutationResponseEvidence(action, updatedPrice);
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

function matchesExpectedPrice(price: StripeCatalogPrice, expectedPrice: StripeCatalogExpectedPrice): boolean {
  return findExpectedPriceIssues(price, expectedPrice).length === 0;
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

function findExpectedPriceIssues(
  price: StripeCatalogPrice,
  expectedPrice: StripeCatalogExpectedPrice,
): Array<{ code: CatalogSyncIssue['code']; detail: string }> {
  const issues: Array<{ code: CatalogSyncIssue['code']; detail: string }> = [];

  if (price.priceKind !== expectedPrice.kind) {
    issues.push({
      code: 'wrong_price_kind',
      detail: `Expected ${describeExpectedPriceKind(expectedPrice)}; Stripe has ${price.priceKind}.`,
    });
  }

  if (price.currencyCode?.toUpperCase() !== expectedPrice.currencyCode.toUpperCase()) {
    issues.push({
      code: 'wrong_currency',
      detail: `Expected ${expectedPrice.currencyCode}; Stripe has ${price.currencyCode ?? 'unknown'}.`,
    });
  }

  if (expectedPrice.kind === 'fixed') {
    if (price.amountMinor !== expectedPrice.amountMinor) {
      issues.push({
        code: 'wrong_amount',
        detail: `Expected ${expectedPrice.amountMinor}; Stripe has ${price.amountMinor ?? 'unknown'}.`,
      });
    }
    return issues;
  }

  if (
    price.customUnitAmount?.minimumAmountMinor !== expectedPrice.minimumAmountMinor ||
    price.customUnitAmount?.presetAmountMinor !== expectedPrice.presetAmountMinor ||
    price.customUnitAmount?.maximumAmountMinor !== expectedPrice.maximumAmountMinor
  ) {
    issues.push({
      code: 'wrong_custom_amount',
      detail: `Expected ${describeExpectedCustomAmount(expectedPrice)}; Stripe has ${describeCustomUnitAmount(
        price.customUnitAmount,
      )}.`,
    });
  }

  return issues;
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
      'wrong_price_kind',
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

type CatalogObjectIdentity = {
  appEnv: string | null;
  appEnvs: string[];
  malformed: boolean;
  proven: boolean;
  storeItemSlug: string;
  variantId: string;
};

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

function createArchivePriceAction(
  environment: StripeCatalogEnvironment,
  variantId: string,
  stripePriceId: StripeCatalogPrice['priceId'],
): Extract<CatalogSyncAction, { kind: 'archive_price' }> {
  const context = createMutationContext(environment, variantId, 'archive_price', stripePriceId, {
    active: false,
    stripePriceId,
  });

  return {
    kind: 'archive_price',
    stripePriceId,
    ...createMutationEvidence(context),
  };
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

function applyMutationResponseEvidence(action: CatalogSyncAction, price: StripeCatalogPrice): void {
  Object.assign(action, {
    requestId: price.requestId ?? null,
    replayed: price.idempotentReplayed ?? null,
  });
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

function describeExpectedPriceKind(price: StripeCatalogExpectedPrice): string {
  return price.kind === 'fixed' ? 'fixed' : 'pay_what_you_want';
}

function describeExpectedCustomAmount(
  price: Extract<StripeCatalogExpectedPrice, { kind: 'pay_what_you_want' }>,
): string {
  return `min=${price.minimumAmountMinor},preset=${price.presetAmountMinor},max=${price.maximumAmountMinor}`;
}

function describeCustomUnitAmount(amount: StripeCatalogPrice['customUnitAmount']): string {
  return amount
    ? `min=${amount.minimumAmountMinor ?? 'unknown'},preset=${amount.presetAmountMinor ?? 'unknown'},max=${
        amount.maximumAmountMinor ?? 'unknown'
      }`
    : 'none';
}

function createPriceRepairMutationIdentity(
  price: StripeCatalogPrice | null,
  mapping: { stripePriceId: string } | null,
  snapshot: { priceActive: boolean; productActive: boolean; stripePriceId: string } | null,
): string | null {
  if (price) {
    return [
      'replace_price_v2',
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

function readPriceCatalogIdentity(price: StripeCatalogPrice): CatalogObjectIdentity {
  return mergeCatalogIdentities([
    readLookupKeyCatalogIdentity(price.lookupKey),
    readMetadataCatalogIdentity(price.metadata),
    readMetadataCatalogIdentity(price.productMetadata),
  ]);
}

function readLookupKeyCatalogIdentity(lookupKey: string | null): CatalogObjectIdentity | null {
  if (!lookupKey?.startsWith('blackbox:')) {
    return null;
  }

  const parts = lookupKey.split(':');
  const appEnv = parts[1] ?? null;
  const storeItemSlug = parts[2] || 'unknown';
  const variantId = parts[3] || 'unknown';

  return {
    appEnv,
    appEnvs: appEnv ? [appEnv] : [],
    malformed: parts.length !== 4 || !appEnv || !parts[2] || !parts[3],
    proven: true,
    storeItemSlug,
    variantId,
  };
}

function readMetadataCatalogIdentity(metadata: Record<string, string>): CatalogObjectIdentity | null {
  if (
    !metadata.appEnv &&
    !metadata.sourceId &&
    !metadata.sourceKind &&
    !metadata.storeItemSlug &&
    !metadata.variantId
  ) {
    return null;
  }

  return {
    appEnv: metadata.appEnv ?? null,
    appEnvs: metadata.appEnv ? [metadata.appEnv] : [],
    malformed:
      !metadata.appEnv || !metadata.sourceId || !metadata.sourceKind || !metadata.storeItemSlug || !metadata.variantId,
    proven: true,
    storeItemSlug: metadata.storeItemSlug || 'unknown',
    variantId: metadata.variantId || 'unknown',
  };
}

function mergeCatalogIdentities(identities: Array<CatalogObjectIdentity | null>): CatalogObjectIdentity {
  const provenIdentities = identities.filter((identity): identity is CatalogObjectIdentity =>
    Boolean(identity?.proven),
  );
  const primary = provenIdentities[0];
  const storeItemSlugs = new Set(
    provenIdentities.map((identity) => identity.storeItemSlug).filter(isKnownIdentityValue),
  );
  const variantIds = new Set(provenIdentities.map((identity) => identity.variantId).filter(isKnownIdentityValue));

  return {
    appEnv: primary?.appEnv ?? null,
    appEnvs: [...new Set(provenIdentities.flatMap((identity) => identity.appEnvs))],
    malformed:
      provenIdentities.some((identity) => identity.malformed) || storeItemSlugs.size > 1 || variantIds.size > 1,
    proven: provenIdentities.length > 0,
    storeItemSlug: primary?.storeItemSlug ?? 'unknown',
    variantId: primary?.variantId ?? 'unknown',
  };
}

function isKnownIdentityValue(value: string): boolean {
  return value !== 'unknown';
}

function emptyCatalogIdentity(): CatalogObjectIdentity {
  return {
    appEnv: null,
    appEnvs: [],
    malformed: false,
    proven: false,
    storeItemSlug: 'unknown',
    variantId: 'unknown',
  };
}

function classifyOwnedObjectIdentity(
  identity: CatalogObjectIdentity,
  knownVariants: Set<string>,
  environment: StripeCatalogEnvironment,
  objectKind: 'price' | 'product',
): CatalogSyncIssue['code'] | null {
  if (!identity.proven) {
    return null;
  }

  if (identity.malformed) {
    return 'malformed_catalog_identity';
  }

  if (identity.appEnvs.includes('sandbox')) {
    return 'legacy_environment_identity';
  }

  if (identity.appEnvs.some((appEnv) => appEnv !== environment)) {
    return 'foreign_environment_identity';
  }

  if (!knownVariants.has(identity.variantId)) {
    return objectKind === 'price' ? 'owned_orphan_price' : 'owned_orphan_product';
  }

  return null;
}

function createOwnedObjectIssue(
  identity: CatalogObjectIdentity,
  code: CatalogSyncIssue['code'],
  objectLabel: string,
): CatalogSyncIssue {
  return {
    code,
    detail: `${objectLabel} has ${code.replaceAll('_', ' ')}.`,
    driftCategory: classifyCatalogSyncIssue(code),
    storeItemSlug: identity.storeItemSlug,
    variantId: identity.variantId,
  };
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
