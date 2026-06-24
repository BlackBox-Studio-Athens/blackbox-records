import type {
  StoreItemOptionRecord,
  StoreOfferSnapshotRecord,
  VariantStripeMappingRecord,
} from '../../../domain/commerce/repositories/spi';
import type { StripePriceId } from '../../../domain/commerce';
import type { CatalogDriftCategory } from './field-ownership';

export type StripeCatalogEnvironment = 'local' | 'prd' | 'uat';

export type StoreOfferPrice = {
  amountMinor: number;
  currencyCode: string;
  display: string;
};

export type StripeCatalogPrice = {
  active: boolean;
  amountMinor: number | null;
  currencyCode: string | null;
  lookupKey: string | null;
  metadata: Record<string, string>;
  productActive: boolean;
  productDescription: string | null;
  productId: string | null;
  productImages: string[];
  productMetadata: Record<string, string>;
  productName: string | null;
  productTaxCode: string | null;
  priceId: StripePriceId;
};

export type StripeCatalogExpectedPrice = {
  amountMinor: number;
  currencyCode: string;
  revision?: string;
};

export type DesiredPrice = {
  amountMinor: number;
  currencyCode: string;
  revision: string;
};

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
  listPricesByLookupKey(lookupKey: string): Promise<StripeCatalogPrice[]>;
  listPricesByMetadata(metadata: StripeCatalogIdentityMetadata): Promise<StripeCatalogPrice[]>;
  retrievePrice(priceId: StripePriceId): Promise<StripeCatalogPrice | null>;
  updatePriceMetadata(
    priceId: StripePriceId,
    metadata: StripeCatalogIdentityMetadata,
    context?: StripeCatalogMutationContext,
  ): Promise<StripeCatalogPrice>;
  updateProductProjection(
    productId: string,
    input: StripeCatalogProductProjectionUpdateInput,
    context?: StripeCatalogMutationContext,
  ): Promise<void>;
};

export type StripeCatalogIdentityMetadata = {
  appEnv: StripeCatalogEnvironment;
  sourceId: string;
  sourceKind: StoreItemOptionRecord['sourceKind'];
  storeItemSlug: string;
  variantId: string;
};

export type StripeCatalogPriceCreateInput = {
  amountMinor: number;
  currencyCode: string;
  lookupKey: string;
  metadata: StripeCatalogIdentityMetadata;
  productName: string;
  productProjection?: StripeCatalogProductProjection | null;
};

export type StripeCatalogProductProjectionUpdateInput = {
  projection: StripeCatalogProductProjection;
  stripeMetadata: StripeCatalogIdentityMetadata;
};

export type StripeCatalogMutationContext = {
  idempotencyKey: string;
};

export type CatalogSyncIssueCode =
  | 'ambiguous_active_price'
  | 'inactive_price'
  | 'inactive_product'
  | 'mapping_points_to_wrong_price'
  | 'missing_price'
  | 'placeholder_price_mapping'
  | 'product_projection_mismatch'
  | 'snapshot_mismatch'
  | 'snapshot_stale'
  | 'wrong_amount'
  | 'wrong_currency'
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
      kind: 'archive_price';
      stripePriceId: StripePriceId;
    }
  | {
      kind: 'create_catalog_price';
    }
  | {
      kind: 'update_mapping';
      stripePriceId: StripePriceId;
    }
  | {
      kind: 'update_product_projection';
      productId: string;
    }
  | {
      kind: 'update_snapshot';
    }
  | {
      kind: 'update_stripe_metadata';
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
