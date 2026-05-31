## Why

The current Stripe catalog work prevents stale prices from becoming checkout authority, but it does not yet define a complete field-level ownership contract for product presentation fields, Stripe Price changes, or catalogue-wide sandbox alignment. Without that boundary, "sync" can drift into unsafe bidirectional behavior, unclear conflict resolution, and weak tests that only prove one item or one direction.

This change turns the catalog sync model into an explicit, testable ownership system: repo-owned product presentation fields project to Stripe Products, Stripe-owned Price state projects back to Worker Store Offers, and every path fails closed when ownership or alignment is ambiguous.

## What Changes

- Define a field-level ownership matrix for Store Item identity, editorial presentation, Stripe Product presentation fields, Stripe Price authority, Store Offer snapshots, stock/availability, and paid order state.
- Extend catalog verification from a single buyable variant contract to catalogue-wide sandbox projection and drift detection.
- Add an explicit product projection path that can update allowed Stripe Product fields from repo-owned catalog data without changing Stripe Price amounts from Astro content.
- Keep Stripe Price reconciliation one-way from Stripe to Worker/D1 Store Offer state, using replacement Prices for amount changes.
- Add conflict and loop prevention rules so Stripe Dashboard product edits do not overwrite repo-owned product fields and repo content edits do not mutate Stripe-owned price authority.
- Add test and smoke coverage for both directions:
  - Stripe Price change updates Worker Store Offer/checkout readiness.
  - Repo-owned product image/title/description changes are projected to Stripe Product in sandbox apply mode.
- Keep all catalog commands dry-run by default, environment-scoped, redacted, and sandbox-only for mutating provider state until production go-live explicitly expands scope.
- No breaking browser API changes are intended.

## Capabilities

### New Capabilities

- `stripe-catalog-field-ownership`: Defines field-level source-of-truth boundaries, sync direction, conflict policy, and allowed Stripe Product/Price mutations for the catalog.

### Modified Capabilities

- `commerce-checkout`: Clarifies that checkout display and creation consume Worker Store Offers derived from Stripe Price authority and repo-owned product projection, not browser or Astro price fixtures.
- `tooling-validation`: Adds catalog projection verification, sandbox apply proof, redaction expectations, and live/operator validation gates.
- `project-language`: Adds canonical terms for Catalog Field Ownership, Product Projection, Price Authority, Store Offer Snapshot, Catalog Drift, and Sandbox Catalog Alignment.

## Impact

- `scripts/stripe-catalog-contract.ts`
- `scripts/stripe-catalog-verify.ts`
- `scripts/verify-stripe-webhook-endpoints.ts`
- `apps/backend/src/application/commerce/catalog-sync/**`
- `apps/backend/src/infrastructure/stripe/**`
- `apps/backend/src/interfaces/http/routes/stripe-webhook-*`
- `apps/backend/src/interfaces/scheduled/catalog-verification.ts`
- `apps/backend/prisma/**`
- `apps/web/src/lib/catalog-data.ts`
- `apps/web/src/lib/store-page-data.ts`
- Store item content under `apps/web/src/content/**`
- Sandbox UAT docs, README readiness wording, and Stripe smoke runner evidence output
- Unit tests, script tests, and sandbox smoke/live validation gates
