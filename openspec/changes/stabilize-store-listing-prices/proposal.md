## Why

The UAT Worker expires Store Offer snapshots by time, then tries to refresh the whole catalog through a scheduled Stripe scan that repeatedly reaches Cloudflare's 50-subrequest limit. This turns valid Stripe prices into `Price unavailable`, while pay-what-you-want Prices are also rejected because they have no fixed amount.

## What Changes

- Stop treating snapshot age as listing-price validity; an active, structurally valid snapshot remains displayable until a real catalog change replaces it.
- Present a valid pay-what-you-want snapshot as `Pay what you want` instead of `Price unavailable`.
- Remove the Worker full-catalog scheduled verification/refresh path and its cron trigger. Reuse existing per-variant Stripe webhooks, authoritative Store Offer reads, checkout reconciliation, and manual verification as recovery paths.
- Add one supported manual repair selector for a single `storeItemSlug`; normal recovery never scans or mutates unrelated items.
- Make normal catalog promotion create an initial Price only when a variant has no valid Stripe Price Authority. It must preserve a valid existing Price even when generated Desired Price data differs.
- Keep whole-catalog reset as a separate, explicit UAT-only operation.
- Hold a catalog-affecting static deployment until every visible Store Item has a ready listing-price record, so a new card cannot publish before its initial offer exists.
- Add focused regression coverage for old snapshots, pay-what-you-want presentation, one-item webhook isolation, non-destructive new-item promotion, and deploy readiness.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-listing-price-presentation`: Listing snapshots no longer expire by elapsed time, pay-what-you-want is a ready presentation, and listing projection no longer depends on scheduled renewal.
- `stripe-catalog-sync`: Existing per-variant webhook/read/checkout/manual reconciliation replaces the failing full-catalog scheduled Worker path.
- `stripe-catalog-field-ownership`: Generated Desired Price becomes first-publication input for missing Price Authority, not permission for normal promotion to replace a valid existing Stripe Price.
- `static-site-and-deployment`: Catalog-affecting frontend deployment waits for complete ready listing-price coverage for the same published Store Item set.
- `project-language`: `Desired Price` and `Catalog Promotion` terms distinguish first publication from day-to-day Stripe Price Authority changes.

## Impact

- Store listing projection and tests under `apps/backend/src/application/commerce/readers/` and `apps/backend/test/application/commerce/readers/`
- Catalog reconciliation and verification under `apps/backend/src/application/commerce/catalog-sync/`, `scripts/stripe-catalog-verify.ts`, and their tests
- Worker scheduled entrypoint, scheduled verification module, cron configuration, and cron-assuming verification in `apps/backend/src/index.ts`, `apps/backend/src/interfaces/scheduled/`, `apps/backend/wrangler.jsonc`, and `scripts/verify-stripe-webhook-endpoints.ts`
- Existing Stripe catalog webhook, Store Offer read, and checkout paths, reused without a new service or queue
- Catalog artifact/promotion and static deployment workflows under `.github/workflows/`
- Overlapping active OpenSpec change `automate-cms-catalog-promotion`, whose proposal, design, `catalog-promotion-automation`, `commerce-checkout`, and `project-language` Desired Price replacement rules must be reconciled before implementation
- Store/catalog operating docs and hosted UAT verification evidence
