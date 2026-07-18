## 1. Reconcile OpenSpec Contracts

- [x] 1.1 Update active `automate-cms-catalog-promotion` proposal and design so Desired Price is first-publication bootstrap input and normal promotion preserves valid existing Price Authority.
- [x] 1.2 Update that change's `catalog-promotion-automation`, `commerce-checkout`, and `project-language` deltas to remove existing-price replacement requirements while preserving coordinated promotion, reset separation, and deploy sequencing.
- [x] 1.3 Validate both OpenSpec changes and confirm no remaining requirement says normal promotion replaces a valid existing Price because generated Desired Price differs.

## 2. Make Listing Prices State-Based

- [x] 2.1 Add reader regression tests proving an old active fixed-price snapshot remains ready, a valid null-amount pay-what-you-want snapshot returns `Pay what you want`, and inactive or malformed snapshots remain unavailable.
- [x] 2.2 Update `readStoreListingPrices` to ignore `freshUntil`, keep fixed-price validation, and map the existing valid null-amount invariant to ready pay-what-you-want presentation.
- [x] 2.3 Add reconciler tests proving elapsed time alone creates neither `snapshot_stale` nor `update_snapshot`, while real Price identity, amount, currency, or active-state mismatch still repairs or fails closed.
- [x] 2.4 Remove time-only freshness decisions from `CatalogReconciler`; keep the existing `freshUntil` column populated as compatibility data and add no D1 migration.

## 3. Replace Scheduled Recovery with Targeted Recovery

- [x] 3.1 Add catalog-verifier argument tests for `--store-item <storeItemSlug>`, including malformed and unknown slug rejection without provider mutation.
- [x] 3.2 Implement targeted catalog verification/apply by selecting one Store Item before reconciliation; prove apply cannot inspect or mutate unrelated variants and keep deliberate full-catalog verification read-only by default.
- [x] 3.3 Remove `runScheduledCatalogVerification`, the Worker `scheduled` handler, schedule-specific tests, and the UAT `17 */6 * * *` cron trigger.
- [x] 3.4 Remove the cron-presence assertion/report field from `scripts/verify-stripe-webhook-endpoints.ts` and update `stripe-webhook-endpoints-verify` tests while preserving webhook endpoint/configuration validation.
- [x] 3.5 Update catalog operations documentation to use Stripe Dashboard plus webhook for normal price changes and targeted verification for repair.

## 4. Make New-Item Promotion Non-Destructive

- [x] 4.1 Add reconciler tests proving Desired Price creates a Price when no valid Price Authority exists but does not archive, create, reactivate, replace, or flag amount drift for one valid existing Price.
- [x] 4.2 Remove normal expected-price replacement behavior from `CatalogReconciler` while preserving identity, environment, active-state, supported-currency/kind, ambiguity, Product Projection, D1 mapping, and snapshot validation.
- [x] 4.3 Add a two-item promotion regression test: publish missing item B, assert its initial Price is created, and assert existing item A keeps the same Price identity and amount.
- [x] 4.4 Keep explicit UAT reset separate and prove its post-reset bootstrap can recreate missing Prices without exposing reset to normal promotion or PRD.

## 5. Gate Catalog Publication on Hosted Readiness

- [x] 5.1 Extend the existing catalog-promotion verification path to compare generated canonical Store Item slugs with hosted `/api/store/listing-prices`, accepting both fixed and pay-what-you-want ready records and reporting only app-owned failing slugs.
- [x] 5.2 Make catalog promotion the sole static-deploy owner for commits that change the visible Store Item set; make the independent `pages.yml` push path skip those commits while preserving normal non-catalog deploys.
- [x] 5.3 Wire hosted readiness after target Worker/catalog preparation and before catalog promotion invokes static deployment.
- [x] 5.4 Add workflow/script tests proving the independent push path cannot race catalog promotion, missing/duplicate/non-ready records block static deployment, and successful readiness does not mutate Stripe or D1.

## 6. Validate and Prove UAT Behavior

- [x] 6.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final tree.
- [x] 6.2 Run OpenSpec validation for `stabilize-store-listing-prices` and the reconciled `automate-cms-catalog-promotion` change.
- [x] 6.3 Deploy the UAT Worker before the UAT static site and verify every canonical published Store Item slug has one ready hosted listing record, including `Pay what you want` records.
- [x] 6.4 Use Browser Use to verify `/store/` has no false `Price unavailable` state and keeps genuine invalid/missing offers non-price.
- [ ] 6.5 Prove one Stripe Dashboard replacement Price updates only its target variant, then prove one new-item promotion leaves an existing variant's Stripe Price identity unchanged; record redacted evidence.
- [x] 6.6 Confirm the deployed UAT Worker has no catalog cron trigger and Cloudflare no longer records the former 50-subrequest scheduled failure after the old schedule window passes.
