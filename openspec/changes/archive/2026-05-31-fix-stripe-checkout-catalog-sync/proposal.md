## Why

The sandbox checkout smoke now reproduces a live mismatch: the storefront presents Disintegration at `€28.00`, but hosted Stripe Checkout resolves the mapped test Price at `€10.00` and exposes only `Card` on the payment surface. The paid return page also showed a full transient status card before the final success screen. These block trustworthy UAT because Astro content, D1 mapping state, Stripe catalog state, hosted Checkout payment methods, and checkout-return UX can drift without a failing acceptance signal.

## What Changes

- Make Stripe Prices the only authority for buyable amount, currency, active Price identity, and checkout readiness; Astro content remains editorial only.
- Fix the Disintegration sandbox Stripe Price mapping so hosted Checkout charges the current Worker Store Offer amount.
- Add a Worker-owned Store Offer path that lets the storefront show browser-safe price/availability from synced Stripe/D1 authority and fail closed when that authority cannot be confirmed.
- Add catalog verification and reconciliation paths that compare Astro-owned app identifiers, D1 `VariantStripeMapping` rows, and Stripe Products/Prices by metadata or lookup key before checkout evidence is accepted.
- Verify the UAT sandbox Worker uses the intended Stripe Payment Method Configuration and that Stripe-hosted Checkout exposes the expected dynamic payment surface for the documented browser/country/currency context.
- Remove or fail any fallback Stripe test seeding path that silently creates placeholder `€10.00` Prices for storefront items.
- Keep checkout return loading visually quiet so the final success screen is the first meaningful paid-return surface.
- Keep Stripe object IDs, secrets, and account-specific evidence out of committed docs while preserving redacted smoke evidence paths.

## Capabilities

### New Capabilities

- `stripe-catalog-sync`: Defines how Store Items, backend sellable variants, D1 mappings, and Stripe Products/Prices stay aligned without exposing Stripe IDs to the browser or committed docs.

### Modified Capabilities

- `commerce-checkout`: Hosted Checkout must match the Worker-authoritative Store Offer price, use the approved Payment Method Configuration, and avoid duplicate paid-return visual surfaces.
- `tooling-validation`: Stripe sandbox smoke tests must assert hosted Checkout amount and UAT payment-method surface before payment submission.

## Impact

- `scripts/smoke-stripe-sandbox.ts` and its node test coverage.
- Stripe sandbox Product/Price setup, Payment Method Configuration setup, and local ignored Stripe test seed state.
- Worker public Store Offer reads, checkout start path, Stripe catalog reconciliation, D1 `VariantStripeMapping`, and any future catalog sync command or CI gate.
- Astro store item content/data paths that currently expose temporary price fixtures.
- Checkout return UI and unit coverage.
- OpenSpec baseline expectations for checkout, catalog authority, and validation evidence.
