import { z } from 'zod';
import type { StoreOfferSnapshotState } from './store-offer-snapshot-repository';
import type { StoreItemOptionRecord, RuntimeCatalogRecord } from './store-item-option-repository';
import type { StripePriceId } from '../ids';

const identifier = z
  .string()
  .min(1)
  .max(128)
  .refine((value) => value === value.trim());
export const catalogOperationInputSchema = z
  .object({
    id: identifier,
    kind: z.enum(['item_setup', 'price_change']),
    inputFingerprint: z.string().regex(/^shape_v[0-9a-f]{32}$/),
    // Supplied by the verified operator context, never by browser input.
    actorEmail: z.email(),
    variantId: identifier,
    expectedRevision: z.number().int().nonnegative(),
  })
  .strict();
export const catalogOperationResultsSchema = z
  .object({
    cmsSourceId: identifier.optional(),
    stripeProductId: identifier.optional(),
    stripePriceId: identifier.optional(),
    previousStripePriceId: identifier.optional(),
    stockChangeId: identifier.optional(),
  })
  .strict();
export type CatalogOperationInput = z.infer<typeof catalogOperationInputSchema>;
export type CatalogOperationResults = z.infer<typeof catalogOperationResultsSchema>;
export type CatalogOperationStep =
  | 'started'
  | 'validated'
  | 'source_linked'
  | 'catalog_linked'
  | 'product_bound'
  | 'price_bound'
  | 'default_selected'
  | 'stock_initialized'
  | 'completed';
export type CatalogOperation = CatalogOperationInput & {
  step: CatalogOperationStep;
  status: 'pending' | 'completed' | 'needs_review';
  results: CatalogOperationResults;
  claimToken: string | null;
  leaseUntil: string | null;
  safeReason: string | null;
};

export interface CatalogOperationRepository {
  completeSetup(
    operation: CatalogOperation,
    presentation: Pick<RuntimeCatalogRecord, 'itemType' | 'priceKind' | 'productProjection'>,
    now?: Date,
  ): Promise<boolean>;
  bindSetupPrice(operation: CatalogOperation, priceId: StripePriceId, now?: Date): Promise<boolean>;
  linkSetupCatalog(
    operation: CatalogOperation,
    item: StoreItemOptionRecord,
    presentation: Pick<RuntimeCatalogRecord, 'itemType' | 'priceKind' | 'productProjection'>,
    now?: Date,
  ): Promise<boolean>;
  begin(input: CatalogOperationInput): Promise<CatalogOperation>;
  find(id: string): Promise<CatalogOperation | null>;
  claim(id: string, now?: Date): Promise<CatalogOperation | null>;
  advance(
    operation: CatalogOperation,
    nextStep: CatalogOperationStep,
    results?: CatalogOperationResults,
    now?: Date,
  ): Promise<CatalogOperation | null>;
  markNeedsReview(
    operation: CatalogOperation,
    reason: 'provider_outcome_unknown' | 'identity_conflict' | 'revision_conflict',
    now?: Date,
  ): Promise<boolean>;
  completePriceChange(
    operation: CatalogOperation,
    snapshot: StoreOfferSnapshotState,
    priceKind: 'fixed' | 'pay_what_you_want',
    now?: Date,
  ): Promise<boolean>;
}

export class CatalogOperationConflictError extends Error {}
