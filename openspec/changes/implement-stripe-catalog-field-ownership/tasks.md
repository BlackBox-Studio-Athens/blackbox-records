## 1. Catalog Ownership Audit

- [x] 1.1 Inventory current Store Item projection sources in `apps/web/src/lib/catalog-data.ts`, `apps/web/src/lib/store-page-data.ts`, `apps/web/src/lib/item-availability.ts`, and content collections.
- [x] 1.2 Inventory current D1 commerce rows and seed paths for `StoreItemOption`, `ItemAvailability`, `Stock`, `VariantStripeMapping`, and `StoreOfferSnapshot`.
- [x] 1.3 Inventory current Stripe catalog sync code in `scripts/stripe-catalog-contract.ts`, `scripts/stripe-catalog-verify.ts`, and `apps/backend/src/application/commerce/catalog-sync/**`.
- [x] 1.4 Record the current buyable, unavailable, and future-buyable Store Item variants that sandbox alignment must classify.
- [x] 1.5 Define the first implementation's production mutation policy as sandbox-only provider mutation with production dry-run/reporting only.

## 2. Field Ownership Contract

- [x] 2.1 Add a typed field ownership matrix that declares owner, sync direction, mutation policy, and verification policy for catalog field groups.
- [x] 2.2 Add unit tests that fail when a catalog projection field lacks an owner or allowed sync direction.
- [x] 2.3 Update project terminology/docs to use `Catalog Field Ownership`, `Product Projection`, `Price Authority`, and `Sandbox Catalog Alignment` consistently.
- [x] 2.4 Ensure diagnostics distinguish Product Projection drift from Price Authority drift.

## 3. Product Projection Model

- [x] 3.1 Replace the single hardcoded `stripeCatalogStoreItemContracts` entry with a generated catalog projection for all current Store Item variants.
- [x] 3.2 Add a small explicit override source only for fields that cannot be safely derived from content.
- [x] 3.3 Include Product Projection fields: Stripe Product name, description, images, metadata, and optional tax code.
- [x] 3.4 Validate Product image URLs as stable absolute public URLs before they can be sent to Stripe.
- [x] 3.5 Keep expected sandbox amount/currency separate from Product Projection so repo content does not become Price Authority.
- [x] 3.6 Add tests for generated projection coverage, release/distro variants, unavailable variants, invalid images, and redacted diagnostics.

## 4. Stripe Catalog Gateway and Reconciler

- [x] 4.1 Extend Stripe catalog gateway types to read Product fields needed for projection drift detection.
- [x] 4.2 Add a Product update operation that writes only allowed Product Projection fields and metadata.
- [x] 4.3 Add idempotency keys for Stripe Product/Price mutation calls.
- [x] 4.4 Extend the reconciler to plan Product Projection actions separately from Price Authority actions.
- [x] 4.5 Keep Price reconciliation fail-closed for missing, inactive, wrong-identity, wrong-currency, wrong-amount, or ambiguous active Prices.
- [x] 4.6 Ensure sandbox apply can create/update sandbox Products and sandbox Prices only through explicit `--env sandbox --apply`.
- [x] 4.7 Ensure production apply is rejected until a separate production go-live gate explicitly allows it.

## 5. Webhook and Scheduled Reconciliation

- [x] 5.1 Add D1-backed replay safety for Stripe catalog webhook events using Stripe `event.id` and catalog object identity.
- [x] 5.2 Update catalog webhook handling to retrieve or resolve current Stripe Product/Price state before updating D1.
- [x] 5.3 Add duplicate and out-of-order catalog event tests.
- [x] 5.4 Keep scheduled catalog verification as the full-catalog backstop and report Product Projection drift separately from Price Authority drift.
- [x] 5.5 Confirm `pnpm stripe:webhooks:verify --env sandbox` remains the persistent endpoint readiness gate.

## 6. Catalog Verification and Apply UX

- [x] 6.1 Extend `pnpm stripe:catalog:verify --env sandbox` report sections for ownership, Product Projection, Price Authority, D1 readiness, Store Offer snapshots, and webhook readiness.
- [x] 6.2 Keep dry-run mode mutation-free for Stripe Products, Stripe Prices, D1 mappings, snapshots, repo files, and evidence files.
- [x] 6.3 Add `--apply` action reporting that shows planned and completed actions with redacted provider IDs.
- [x] 6.4 Add missing credential classification so local runs fail clearly without printing secrets.
- [x] 6.5 Ensure full Stripe object IDs, webhook endpoint IDs, API error payloads, `sk_`, `whsec_`, `price_`, and `prod_` values are redacted.

## 7. Store Offer and Checkout Integration

- [x] 7.1 Ensure Store Offer reads reconcile Product Projection and Price Authority before returning checkout-ready browser state.
- [x] 7.2 Ensure checkout start revalidates current Price Authority and refuses stale browser cart snapshots.
- [x] 7.3 Ensure hosted Checkout line items still use resolved Stripe Price IDs only from Worker/D1 authority.
- [x] 7.4 Add tests proving a Stripe Price replacement updates Worker Store Offer price without Astro content changes.
- [x] 7.5 Add tests proving Product Projection drift blocks sandbox acceptance until resolved.

## 8. Sandbox Catalog Alignment

- [x] 8.1 Run a dry-run sandbox catalog verification and capture redacted drift categories.
- [x] 8.2 Apply sandbox Product Projection and Price/D1 alignment only after reviewing the dry-run plan.
- [x] 8.3 Rerun sandbox catalog dry-run and require zero blocking drift for checkout-eligible variants.
- [x] 8.4 Verify sandbox persistent webhook endpoint state with `pnpm stripe:webhooks:verify --env sandbox`.
- [x] 8.5 Run a sandbox Store Offer read or smoke that proves FE-visible price comes from Worker Store Offer.
- [x] 8.6 Run a hosted Checkout smoke that verifies amount/currency and Product name/image alignment without submitting payment.

## 9. Documentation and Operator Runbooks

- [x] 9.1 Update README and sandbox UAT docs with the field ownership model and command sequence.
- [x] 9.2 Document how operators make a price change: create replacement Price, move lookup key/metadata, archive stale Price, rerun verification.
- [x] 9.3 Document how operators make a product presentation change: update repo content/projection, run dry-run, apply sandbox, verify hosted Checkout.
- [x] 9.4 Document that Stripe Dashboard Product presentation edits are drift unless the repo projection is updated.
- [x] 9.5 Keep all docs and evidence redacted and free of secrets or full provider IDs.

## 10. Verification Gates

- [x] 10.1 Run targeted unit/script tests for field ownership, catalog projection, reconciler, webhooks, redaction, and smoke copy.
- [x] 10.2 Run `pnpm stripe:catalog:verify --env sandbox` when credentials exist.
- [x] 10.3 Run `pnpm stripe:webhooks:verify --env sandbox` when credentials exist.
- [x] 10.4 Run `pnpm smoke:stripe-sandbox -- --scenario checkout_surface` when sandbox alignment is ready.
- [x] 10.5 Run `pnpm smoke:stripe-sandbox -- --scenario happy_path_paid` when persistent webhook delivery is proven.
- [x] 10.6 Run `pnpm test:unit`.
- [x] 10.7 Run `pnpm check`.
- [x] 10.8 Run `pnpm build`.
- [x] 10.9 Run `openspec validate implement-stripe-catalog-field-ownership --type change --strict`.
- [x] 10.10 Run `openspec validate --all --strict`.

### Current live-gate evidence

- 2026-05-24: `pnpm stripe:catalog:verify --env sandbox` first reported one checkout-eligible Product Projection drift action for `disintegration-black-vinyl-lp` and zero Price Authority, D1 readiness, or Store Offer snapshot issues after non-checkout variants were kept report-only.
- 2026-05-24: `pnpm stripe:catalog:verify --env sandbox --apply` applied the reviewed sandbox Product Projection alignment.
- 2026-05-24: follow-up `pnpm stripe:catalog:verify --env sandbox` passed with 11 variants checked and zero Product Projection, Price Authority, D1 readiness, or Store Offer snapshot issues.
- 2026-05-24: `pnpm smoke:stripe-sandbox -- --scenario checkout_surface` passed with evidence at `.codex-artifacts/stripe-sandbox-smoke/20260524020245/checkout_surface/evidence.json`; the evidence shows Worker Store Offer display `EUR 28.00`, Checkout Session amount `2800`, currency `EUR`, matching Product name, and matching Product image.
- 2026-05-24: `pnpm stripe:webhooks:verify --env sandbox` reached the persistent endpoint but failed because the endpoint is missing required catalog event subscriptions: `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, and `price.deleted`.
- 2026-05-24: after manual Stripe endpoint event repair, `pnpm stripe:webhooks:verify --env sandbox` passed: the persistent sandbox endpoint is enabled, test-mode, uniquely matched, and covers the required Product and Price catalog events. Signing-secret match remains not provable through Stripe list/retrieve APIs.
- 2026-05-24: `pnpm stripe:catalog:verify --env sandbox` passed after endpoint repair with 11 variants checked and zero Product Projection, Price Authority, D1 readiness, or Store Offer snapshot issues.
- 2026-05-24: `pnpm smoke:stripe-sandbox -- --scenario happy_path_paid` created a paid, complete Stripe Checkout Session with matching amount/currency/Product projection, but failed because the sandbox D1 `CheckoutOrder` remained `pending_payment`; evidence is at `.codex-artifacts/stripe-sandbox-smoke/20260524102502/happy_path_paid/evidence.json`.
- 2026-05-24: follow-up Stripe API inspection found the matching `checkout.session.completed` event still had `pending_webhooks = 1`, so persistent webhook delivery or signing-secret match is not proven.
- 2026-05-24: after the sandbox Worker `STRIPE_WEBHOOK_SECRET` was updated from the persistent Stripe endpoint, `pnpm smoke:stripe-sandbox -- --scenario happy_path_paid` passed with evidence at `.codex-artifacts/stripe-sandbox-smoke/20260524103358/happy_path_paid/evidence.json`; the evidence shows a paid `CheckoutOrder`, Checkout Session amount `2800`, currency `EUR`, matching Product name, and matching Product image.
