## 1. Reproduction and Smoke Coverage

- [x] 1.1 Add `checkout_surface` to `scripts/smoke-stripe-sandbox.ts` so hosted Checkout amount and payment method labels are asserted before payment submission.
- [x] 1.2 Cover the new smoke surface parsing and failure classification in `apps/backend/test/scripts/stripe-sandbox-smoke.test.ts`.
- [x] 1.3 Run the deployed sandbox surface smoke and capture failing evidence for Disintegration (`€10.00` observed, only `Card` visible).
- [x] 1.4 Re-run `checkout_surface` after fixes and require hosted Checkout to show the Store Offer amount plus at least one expected dynamic payment option.

## 2. Stripe Price and Mapping Fix

- [x] 2.1 Inspect sandbox D1 `VariantStripeMapping` for `variant_barren-point_standard` and retrieve the linked Stripe Product/Price with Stripe CLI or SDK without printing secrets.
- [x] 2.2 Confirm the canonical Disintegration `storeItemSlug`, `variantId`, amount, currency, Product metadata, and deterministic Price lookup key for sandbox.
- [x] 2.3 Create or select the correct sandbox Stripe Price for Disintegration at the Worker Store Offer amount and currency, archiving or bypassing the stale `€10.00` Price.
- [x] 2.4 Update sandbox D1 and ignored local Stripe test seed state so Disintegration maps to the corrected Price.
- [x] 2.5 Remove or fail the fallback path that silently creates `€10.00` Prices for real storefront items.
- [x] 2.6 Add unit coverage for the corrected seed/sync behavior.

## 3. Stripe-Owned Store Offer Authority

- [x] 3.1 Remove buyable price authority from Astro-facing item data; keep Astro-owned content to editorial fields, routes, artwork, and app-owned identifiers.
- [x] 3.2 Implement the Worker Store Offer read path so storefront price display and checkout readiness come from Stripe Price plus D1 mapping authority.
- [x] 3.3 Add Store Offer freshness handling: stale or missing D1 snapshots trigger reconciliation or return a non-buyable catalog-drift state.
- [x] 3.4 Revalidate the active Stripe Price during checkout start before creating the Checkout Session; fail closed on missing or ambiguous active Price matches.
- [x] 3.5 Update storefront/store item/checkout UI tests so displayed buyable prices come from Worker Store Offer data, not Astro fixture price fields.

## 4. Catalog Sync and Reconciliation Guard

- [x] 4.1 Implement shared Stripe catalog reconciliation that resolves variants by `storeItemSlug`, `variantId`, metadata, and deterministic lookup key.
- [x] 4.2 Implement `stripe:catalog:verify` as a dry-run command that compares Store Items, D1 mappings, Store Offer snapshots, and Stripe Products/Prices.
- [x] 4.3 Add explicit `--apply` support only for environment-scoped sandbox catalog/D1 updates after dry-run validation is green.
- [x] 4.4 Make verification fail on missing, inactive, wrong-amount, wrong-currency, wrong-variant, ambiguous active Price, stale Store Offer, or placeholder Stripe Price mappings.
- [x] 4.5 Keep full Stripe object IDs and secrets out of committed output while still producing actionable local/operator diagnostics.
- [x] 4.6 Add Stripe catalog webhook handling for `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, and `price.deleted`.
- [x] 4.7 Add scheduled full catalog verification as a backstop for missed Stripe catalog events or manual Dashboard edits.
- [x] 4.8 Cover manual verify/apply, webhook-triggered reconciliation, scheduled verification, and redaction behavior with focused tests.

## 5. Payment Method Configuration and UAT Dynamic Payments

- [x] 5.1 Verify the intended sandbox `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` with `pnpm stripe:payment-methods:verify` using the selected environment credentials.
- [x] 5.2 Ensure the deployed UAT sandbox Worker receives the intended Payment Method Configuration binding before checkout creation.
- [x] 5.3 Define the accepted UAT dynamic payment contract: browser, country, amount, currency, enabled candidate payment methods, and visible labels expected in hosted Checkout.
- [x] 5.4 Make `checkout_surface` accept environment-scoped expected payment method labels and fail when the documented non-card labels are absent.
- [x] 5.5 Use hosted Checkout smoke evidence to distinguish unsupported browser wallet eligibility from an actual card-only configuration regression.
- [x] 5.6 Document the accepted sandbox dynamic payment surface and any browser/context constraints in the change evidence.

## 6. Checkout Return UX

- [x] 6.1 Verify the extra screen before the paid confirmation is the initial `loading` return state, not a second success layer.
- [x] 6.2 Suppress the full visual loading/recovery card while checkout return state is still resolving.
- [x] 6.3 Add unit coverage so initial resolution stays visually quiet and recovery actions only render after a non-final state is known.

## 7. Validation

- [x] 7.1 Run `pnpm --filter @blackbox/backend exec vitest run --config vitest.node.config.ts test/scripts/stripe-sandbox-smoke.test.ts`.
- [x] 7.2 Run `pnpm --filter @blackbox/web exec vitest run src/components/store/CheckoutReturnStatus.test.tsx`.
- [x] 7.3 Run `pnpm stripe:catalog:verify --env sandbox`.
- [x] 7.4 Run `pnpm stripe:payment-methods:verify` for the UAT sandbox environment.
- [x] 7.5 Run `pnpm smoke:stripe-sandbox -- --scenario checkout_surface --screenshots always --timeout-ms 60000`.
- [x] 7.6 Run `pnpm smoke:stripe-sandbox -- --scenario happy_path_paid` with a matching `stripe listen` webhook listener.
- [x] 7.7 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`.
- [x] 7.8 Run `openspec validate fix-stripe-checkout-catalog-sync --type change --strict` and `openspec validate --all --strict`.
