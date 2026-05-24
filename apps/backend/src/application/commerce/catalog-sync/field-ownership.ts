export type CatalogDriftCategory =
  | 'catalog_identity'
  | 'd1_readiness'
  | 'paid_order_state'
  | 'price_authority'
  | 'product_projection'
  | 'store_offer_snapshot';

export type CatalogFieldOwner =
  | 'd1_operator'
  | 'repo_app'
  | 'repo_astro'
  | 'repo_product_projection'
  | 'stripe_checkout_events'
  | 'stripe_price_authority'
  | 'worker_reconciliation';

export type CatalogFieldSyncDirection =
  | 'd1_to_store_offer'
  | 'repo_to_d1_and_stripe_identity'
  | 'repo_to_storefront'
  | 'repo_to_stripe_product'
  | 'stripe_checkout_events_to_d1'
  | 'stripe_price_to_d1_store_offer'
  | 'stripe_price_plus_d1_to_browser';

export type CatalogMutationPolicy =
  | 'operator_managed_d1'
  | 'provider_event_reconciliation'
  | 'repo_deploy_only'
  | 'sandbox_apply_only'
  | 'worker_reconcile_only';

export type CatalogVerificationPolicy =
  | 'catalog_projection_check'
  | 'checkout_order_reconciliation_check'
  | 'd1_readiness_check'
  | 'price_authority_check'
  | 'product_projection_check'
  | 'store_offer_snapshot_check';

export type CatalogFieldGroup =
  | 'availability_and_stock'
  | 'paid_order_state'
  | 'repo_store_item_identity'
  | 'store_offer_snapshot'
  | 'storefront_editorial_presentation'
  | 'stripe_price_authority'
  | 'stripe_product_projection';

export type CatalogFieldOwnership = {
  driftCategory: CatalogDriftCategory;
  fieldGroup: CatalogFieldGroup;
  fields: readonly string[];
  mutationPolicy: CatalogMutationPolicy;
  owner: CatalogFieldOwner;
  syncDirection: CatalogFieldSyncDirection;
  verificationPolicy: CatalogVerificationPolicy;
};

export const catalogFieldOwnershipMatrix: readonly CatalogFieldOwnership[] = [
  {
    driftCategory: 'catalog_identity',
    fieldGroup: 'repo_store_item_identity',
    fields: ['storeItemSlug', 'variantId', 'sourceKind', 'sourceId'],
    mutationPolicy: 'repo_deploy_only',
    owner: 'repo_app',
    syncDirection: 'repo_to_d1_and_stripe_identity',
    verificationPolicy: 'catalog_projection_check',
  },
  {
    driftCategory: 'product_projection',
    fieldGroup: 'storefront_editorial_presentation',
    fields: ['title', 'subtitle', 'summary', 'image', 'imageAlt', 'storePath', 'checkoutPath'],
    mutationPolicy: 'repo_deploy_only',
    owner: 'repo_astro',
    syncDirection: 'repo_to_storefront',
    verificationPolicy: 'catalog_projection_check',
  },
  {
    driftCategory: 'product_projection',
    fieldGroup: 'stripe_product_projection',
    fields: ['productName', 'productDescription', 'productImages', 'productMetadata', 'taxCode'],
    mutationPolicy: 'sandbox_apply_only',
    owner: 'repo_product_projection',
    syncDirection: 'repo_to_stripe_product',
    verificationPolicy: 'product_projection_check',
  },
  {
    driftCategory: 'price_authority',
    fieldGroup: 'stripe_price_authority',
    fields: ['stripePriceId', 'lookupKey', 'amountMinor', 'currencyCode', 'priceActive', 'productActive'],
    mutationPolicy: 'sandbox_apply_only',
    owner: 'stripe_price_authority',
    syncDirection: 'stripe_price_to_d1_store_offer',
    verificationPolicy: 'price_authority_check',
  },
  {
    driftCategory: 'd1_readiness',
    fieldGroup: 'availability_and_stock',
    fields: ['availabilityStatus', 'canBuy', 'quantity', 'onlineQuantity'],
    mutationPolicy: 'operator_managed_d1',
    owner: 'd1_operator',
    syncDirection: 'd1_to_store_offer',
    verificationPolicy: 'd1_readiness_check',
  },
  {
    driftCategory: 'store_offer_snapshot',
    fieldGroup: 'store_offer_snapshot',
    fields: ['snapshotAmountMinor', 'snapshotCurrencyCode', 'snapshotStripePriceId', 'freshUntil', 'syncedAt'],
    mutationPolicy: 'worker_reconcile_only',
    owner: 'worker_reconciliation',
    syncDirection: 'stripe_price_plus_d1_to_browser',
    verificationPolicy: 'store_offer_snapshot_check',
  },
  {
    driftCategory: 'paid_order_state',
    fieldGroup: 'paid_order_state',
    fields: ['checkoutSessionId', 'stripePaymentIntentId', 'orderStatus', 'paidAt', 'notPaidAt', 'needsReviewAt'],
    mutationPolicy: 'provider_event_reconciliation',
    owner: 'stripe_checkout_events',
    syncDirection: 'stripe_checkout_events_to_d1',
    verificationPolicy: 'checkout_order_reconciliation_check',
  },
] as const;

export const catalogProjectionFieldGroups = [
  'repo_store_item_identity',
  'storefront_editorial_presentation',
  'stripe_product_projection',
  'stripe_price_authority',
  'availability_and_stock',
  'store_offer_snapshot',
] as const satisfies readonly CatalogFieldGroup[];

export function findCatalogFieldOwnership(fieldGroup: CatalogFieldGroup): CatalogFieldOwnership | null {
  return catalogFieldOwnershipMatrix.find((entry) => entry.fieldGroup === fieldGroup) ?? null;
}

export function assertCompleteCatalogFieldOwnership(): void {
  const missingGroups = catalogProjectionFieldGroups.filter((fieldGroup) => !findCatalogFieldOwnership(fieldGroup));

  if (missingGroups.length > 0) {
    throw new Error(`Catalog Field Ownership is missing: ${missingGroups.join(', ')}`);
  }

  for (const entry of catalogFieldOwnershipMatrix) {
    if (!entry.owner || !entry.syncDirection || !entry.mutationPolicy || !entry.verificationPolicy) {
      throw new Error(`Catalog Field Ownership entry is incomplete: ${entry.fieldGroup}`);
    }

    if (entry.fields.length === 0) {
      throw new Error(`Catalog Field Ownership entry has no fields: ${entry.fieldGroup}`);
    }
  }
}
