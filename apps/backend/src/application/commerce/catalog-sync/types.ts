import type {
  StoreItemOptionRecord,
  StoreOfferSnapshotRecord,
  VariantStripeMappingRecord,
} from '../../../domain/commerce/repositories/spi';
import type { StripePriceId } from '../../../domain/commerce';

export type StripeCatalogEnvironment = 'local' | 'production' | 'sandbox';

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
  productId: string | null;
  productMetadata: Record<string, string>;
  priceId: StripePriceId;
};

export type StripeCatalogExpectedPrice = {
  amountMinor: number;
  currencyCode: string;
};

export type StripeCatalogGateway = {
  archivePrice(priceId: StripePriceId): Promise<StripeCatalogPrice>;
  createSandboxPrice(input: StripeCatalogPriceCreateInput): Promise<StripeCatalogPrice>;
  listPricesByLookupKey(lookupKey: string): Promise<StripeCatalogPrice[]>;
  listPricesByMetadata(metadata: StripeCatalogIdentityMetadata): Promise<StripeCatalogPrice[]>;
  retrievePrice(priceId: StripePriceId): Promise<StripeCatalogPrice | null>;
  updatePriceMetadata(priceId: StripePriceId, metadata: StripeCatalogIdentityMetadata): Promise<StripeCatalogPrice>;
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
};

export type CatalogSyncIssueCode =
  | 'ambiguous_active_price'
  | 'inactive_price'
  | 'inactive_product'
  | 'mapping_points_to_wrong_price'
  | 'missing_price'
  | 'placeholder_price_mapping'
  | 'snapshot_mismatch'
  | 'snapshot_stale'
  | 'wrong_amount'
  | 'wrong_currency'
  | 'wrong_variant_identity';

export type CatalogSyncIssue = {
  code: CatalogSyncIssueCode;
  detail: string;
  storeItemSlug: string;
  variantId: string;
};

export type CatalogSyncAction =
  | {
      kind: 'archive_price';
      stripePriceId: StripePriceId;
    }
  | {
      kind: 'create_sandbox_price';
    }
  | {
      kind: 'update_mapping';
      stripePriceId: StripePriceId;
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

export type CatalogSyncRunResult = {
  dryRun: boolean;
  environment: StripeCatalogEnvironment;
  issues: CatalogSyncIssue[];
  results: CatalogSyncVariantResult[];
};
