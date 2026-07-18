import type {
  StoreItemOptionRecord,
  StoreOfferSnapshotRecord,
  VariantStripeMappingRecord,
} from '../../../domain/commerce/repositories/spi';
import type { StripePriceId } from '../../../domain/commerce';
import type { CatalogDriftCategory } from './field-ownership';

export type StripeCatalogEnvironment = 'local' | 'prd' | 'uat';

export type StoreOfferPrice = {
  currencyCode: string;
  display: string;
} & (
  | {
      amountMinor: number;
      kind: 'fixed';
    }
  | {
      kind: 'pay_what_you_want';
      maximumAmountMinor: number;
      minimumAmountMinor: number;
      presetAmountMinor: number;
    }
);

export type StripeCatalogPriceKind = StoreOfferPrice['kind'];

export type StripeCatalogCustomUnitAmount = {
  maximumAmountMinor: number | null;
  minimumAmountMinor: number | null;
  presetAmountMinor: number | null;
};

export type StripeCatalogPrice = {
  active: boolean;
  amountMinor: number | null;
  currencyCode: string | null;
  customUnitAmount: StripeCatalogCustomUnitAmount | null;
  idempotentReplayed?: boolean | null;
  lookupKey: string | null;
  metadata: Record<string, string>;
  priceKind: StripeCatalogPriceKind;
  productActive: boolean;
  productDescription: string | null;
  productId: string | null;
  productImages: string[];
  productMetadata: Record<string, string>;
  productName: string | null;
  productTaxCode: string | null;
  priceId: StripePriceId;
  requestId?: string | null;
};

export type StripeCatalogProduct = {
  active: boolean;
  idempotentReplayed?: boolean | null;
  metadata: Record<string, string>;
  name: string | null;
  productId: string;
  requestId?: string | null;
};

export type StripeCatalogExpectedPrice = {
  currencyCode: string;
  revision?: string;
} & (
  | {
      amountMinor: number;
      kind: 'fixed';
    }
  | {
      kind: 'pay_what_you_want';
      maximumAmountMinor: number;
      minimumAmountMinor: number;
      presetAmountMinor: number;
    }
);

export type DesiredPrice = {
  currencyCode: string;
  revision: string;
} & (
  | {
      amountMinor: number;
      kind: 'fixed';
    }
  | {
      kind: 'pay_what_you_want';
      maximumAmountMinor: number;
      minimumAmountMinor: number;
      presetAmountMinor: number;
    }
);

export type StripeCatalogProductProjection = {
  description: string;
  imageUrls: string[];
  metadata: Record<string, string>;
  name: string;
  taxCode: string | null;
};

export type DesiredCatalogEnvironment = Extract<StripeCatalogEnvironment, 'prd' | 'uat'>;

export type DesiredCatalogAvailability = 'published' | 'retired' | 'withheld';

export type DesiredCatalogEntry = {
  availability: DesiredCatalogAvailability;
  desiredPrice: DesiredPrice | null;
  productProjection: StripeCatalogProductProjection;
  sourceId: string;
  sourceKind: StoreItemOptionRecord['sourceKind'];
  stockInitialization: {
    initialOnlineQuantity: number | null;
  };
  storeItemSlug: string;
  targetEnvironments: DesiredCatalogEnvironment[];
  variantId: string;
};

export type DesiredCatalogState = {
  entries: DesiredCatalogEntry[];
  revision: string;
};

export type ProviderCatalogState = {
  environment: DesiredCatalogEnvironment;
  entries: Array<{
    activePriceCount: number;
    storeItemSlug: string;
    variantId: string;
  }>;
};

export type PromotionRun = {
  artifactCommitSha: string;
  environment: DesiredCatalogEnvironment;
  runId: string;
  sourceCommitSha: string;
};

export type PromotionEvidence = PromotionRun & {
  status: 'failed' | 'not_configured' | 'passed' | 'skipped' | 'superseded';
  summary: string;
};

export type StripeCatalogGateway = {
  archivePrice(priceId: StripePriceId, context?: StripeCatalogMutationContext): Promise<StripeCatalogPrice>;
  createCatalogPrice(
    input: StripeCatalogPriceCreateInput,
    context?: StripeCatalogMutationContext,
  ): Promise<StripeCatalogPrice>;
  listOwnedPrices(environment: StripeCatalogEnvironment): Promise<StripeCatalogPrice[]>;
  listOwnedProducts(environment: StripeCatalogEnvironment): Promise<StripeCatalogProduct[]>;
  listPricesByLookupKey(lookupKey: string): Promise<StripeCatalogPrice[]>;
  listPricesByMetadata(metadata: StripeCatalogIdentityMetadata): Promise<StripeCatalogPrice[]>;
  retrievePrice(priceId: StripePriceId): Promise<StripeCatalogPrice | null>;
  updatePriceLookupKey(
    priceId: StripePriceId,
    lookupKey: string,
    context?: StripeCatalogMutationContext,
  ): Promise<StripeCatalogPrice>;
  updatePriceMetadata(
    priceId: StripePriceId,
    metadata: StripeCatalogIdentityMetadata,
    context?: StripeCatalogMutationContext,
  ): Promise<StripeCatalogPrice>;
  updateProductProjection(
    productId: string,
    input: StripeCatalogProductProjectionUpdateInput,
    context?: StripeCatalogMutationContext,
  ): Promise<StripeCatalogProduct>;
};

export type StripeCatalogIdentityMetadata = {
  appEnv: StripeCatalogEnvironment;
  sourceId: string;
  sourceKind: StoreItemOptionRecord['sourceKind'];
  storeItemSlug: string;
  variantId: string;
};

export type StripeCatalogPriceCreateInput = {
  currencyCode: string;
  lookupKey: string;
  metadata: StripeCatalogIdentityMetadata;
  productName: string;
  productProjection?: StripeCatalogProductProjection | null;
} & (
  | {
      amountMinor: number;
      kind: 'fixed';
    }
  | {
      kind: 'pay_what_you_want';
      maximumAmountMinor: number;
      minimumAmountMinor: number;
      presetAmountMinor: number;
    }
);

export type StripeCatalogProductProjectionUpdateInput = {
  projection: StripeCatalogProductProjection;
  stripeMetadata: StripeCatalogIdentityMetadata;
};

export type StripeCatalogMutationContext = {
  idempotencyKey: string;
  requestShapeFingerprint: string;
};

export type CatalogSyncIssueCode =
  | 'ambiguous_active_price'
  | 'foreign_environment_identity'
  | 'inactive_price'
  | 'inactive_product'
  | 'legacy_environment_identity'
  | 'malformed_catalog_identity'
  | 'mapping_points_to_wrong_price'
  | 'missing_price'
  | 'owned_orphan_price'
  | 'owned_orphan_product'
  | 'placeholder_price_mapping'
  | 'product_projection_mismatch'
  | 'snapshot_mismatch'
  | 'wrong_amount'
  | 'wrong_custom_amount'
  | 'wrong_currency'
  | 'wrong_price_kind'
  | 'wrong_variant_identity';

export type CatalogSyncIssue = {
  code: CatalogSyncIssueCode;
  detail: string;
  driftCategory: CatalogDriftCategory;
  storeItemSlug: string;
  variantId: string;
};

export type CatalogSyncAction =
  | {
      idempotencyKey?: string;
      requestId?: string | null;
      requestShapeFingerprint?: string;
      kind: 'archive_price';
      replayed?: boolean | null;
      stripePriceId: StripePriceId;
    }
  | {
      idempotencyKey?: string;
      kind: 'create_catalog_price';
      requestId?: string | null;
      requestShapeFingerprint?: string;
      replayed?: boolean | null;
    }
  | {
      kind: 'update_mapping';
      stripePriceId: StripePriceId;
    }
  | {
      idempotencyKey?: string;
      kind: 'update_product_projection';
      productId: string;
      requestId?: string | null;
      requestShapeFingerprint?: string;
      replayed?: boolean | null;
    }
  | {
      idempotencyKey?: string;
      kind: 'repair_lookup_key';
      lookupKey: string;
      requestId?: string | null;
      requestShapeFingerprint?: string;
      replayed?: boolean | null;
      stripePriceId: StripePriceId;
    }
  | {
      kind: 'update_snapshot';
    }
  | {
      idempotencyKey?: string;
      kind: 'update_stripe_metadata';
      requestId?: string | null;
      requestShapeFingerprint?: string;
      replayed?: boolean | null;
      stripePriceId: StripePriceId;
    };

export type CatalogSyncVariantResult = {
  actions: CatalogSyncAction[];
  issueCount: number;
  issues: CatalogSyncIssue[];
  lookupKey: string;
  mapping: VariantStripeMappingRecord | null;
  resolvedPrice: StripeCatalogPrice | null;
  snapshot: StoreOfferSnapshotRecord | null;
  storeItem: StoreItemOptionRecord;
};

export type CatalogSyncAppliedAction = {
  actions: CatalogSyncAction[];
  lookupKey: string;
  storeItemSlug: string;
  variantId: string;
};

export type CatalogSyncRunResult = {
  appliedActions?: CatalogSyncAppliedAction[];
  dryRun: boolean;
  environment: StripeCatalogEnvironment;
  issues: CatalogSyncIssue[];
  results: CatalogSyncVariantResult[];
};
