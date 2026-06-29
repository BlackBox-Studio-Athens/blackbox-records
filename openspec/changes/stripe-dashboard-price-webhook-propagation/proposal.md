## Why

BlackBox needs a safe way for operators to change item prices without turning Decap or Astro content into checkout price authority. The best fit for the current architecture is to let restricted Stripe Dashboard users change Prices, then make the deployed Worker propagate those changes into D1 Store Offers and the storefront through signed Stripe catalog webhooks.

## What Changes

- Define the operator price-change workflow as Stripe-first: create a replacement Stripe Price for a known Store Item variant, preserve app-owned identity metadata or lookup key, archive/deactivate the stale Price, and let reconciliation update D1.
- Harden Stripe catalog webhook handling so `product.*` and `price.*` events dynamically reconcile current Stripe state into `VariantStripeMapping` and `StoreOfferSnapshot`, with event processing status that only treats successful reconciliations as completed.
- Require webhook processing to resolve current Stripe Product/Price state instead of trusting event ordering or event payload snapshots.
- Adopt the common e-commerce ownership pattern: commerce systems own price, CMS/editorial systems own presentation, and event/webhook propagation keeps read models fresh.
- Make storefront price display rely on Worker Store Offer reads with cache-safe freshness, so browser-visible prices update without an Astro content edit or static site deploy.
- Keep checkout start as the final authority check: it must revalidate the active Stripe Price and fail closed when webhook propagation or Store Offer snapshots are stale or ambiguous.
- Add operator diagnostics for price-change propagation: webhook endpoint verification, catalog verification, Store Offer read checks, and redacted drift reporting.
- Document the least-privilege operating model: restricted Stripe accounts for price changes now; no Decap price fields in this slice.
- Preserve UAT-first rollout and PRD-disabled gates. PRD live price propagation remains unavailable until the PRD-open gate approves live provider mutation and live checkout.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `stripe-catalog-sync`: Expand requirements for Dashboard-created replacement Prices, webhook reconciliation, current-state resolution, environment identity, ambiguity handling, idempotent event processing status, and D1 Store Offer propagation.
- `stripe-catalog-field-ownership`: Clarify that Stripe Dashboard users may change Price Authority fields only through replacement Prices, Desired Price is promotion/apply input rather than day-to-day authority, and repo-owned Product Projection fields remain one-way from repo to Stripe Products.
- `commerce-checkout`: Require dynamic storefront price refresh through Worker Store Offers and final checkout revalidation after Stripe-side price changes.
- `tooling-validation`: Add verification requirements for price-change propagation checks, webhook delivery proof, catalog drift reporting, and redacted diagnostics.

## Impact

- Worker webhook route and Stripe signature verification path under `apps/backend/src`.
- Catalog reconciliation application services under `apps/backend/src/application/commerce/catalog-sync/**`.
- D1 persistence seams for `VariantStripeMapping` and `StoreOfferSnapshot`.
- Public Store Offer API under `/api/store/items/:storeItemSlug` and browser components that render price.
- Stripe webhook endpoint verification and catalog verification scripts.
- UAT and later PRD operator docs for price changes, webhook troubleshooting, and acceptance evidence.
- Tests for webhook replay safety, Price ambiguity, stale Store Offer recovery, storefront refresh, checkout revalidation, and redaction.
