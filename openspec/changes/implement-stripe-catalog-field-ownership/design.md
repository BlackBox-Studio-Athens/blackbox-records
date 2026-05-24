## Context

BlackBox Records now has the core pieces for Stripe-backed checkout:

- Static Astro content owns editorial store pages, images, routing, and app identifiers.
- D1 owns `StoreItemOption`, `ItemAvailability`, `Stock`, `VariantStripeMapping`, and `StoreOfferSnapshot`.
- Stripe owns Product and Price objects used by hosted Checkout.
- The Worker owns public Store Offer reads, checkout creation, webhook acknowledgement, and scheduled catalog verification.

The completed catalog-sync slice made Stripe Price state the buyable price authority and added Store Offer reconciliation before display and checkout. The remaining gap is broader: the repo has not defined every catalog field's owner, it only has one hardcoded catalog contract, and Stripe Product presentation fields such as name, description, and images are not yet projected from repo-owned catalog data. Calling this "sync" without a field contract would invite unsafe two-way behavior.

This design keeps the integration small and explicit. It does not introduce a general bidirectional sync engine. It adds a catalog field ownership contract and extends the existing verifier/reconciler so each field moves in exactly one permitted direction.

## Goals / Non-Goals

**Goals:**

- Define the source of truth for every catalog field that affects storefront display, Stripe-hosted Checkout display, checkout amount, stock, and order reconciliation.
- Project repo-owned product presentation fields to Stripe Product fields in sandbox apply mode.
- Keep Stripe Price amount, currency, active status, lookup key, and price identity as Stripe-owned payment authority.
- Expand catalog verification from a single variant to all current buyable Store Item variants.
- Add tests that prove both sync directions:
  - Stripe Price replacement updates Worker Store Offer state.
  - Repo product presentation changes update Stripe Product fields in sandbox apply mode.
- Keep commands dry-run by default, environment-explicit, sandbox-only for provider mutations, and redacted.
- Make webhook processing replay-safe enough for catalog events without adding a new queue service in the first slice.

**Non-Goals:**

- Fully bidirectional Stripe/Product CMS sync.
- Production Stripe catalog mutation before production go-live readiness explicitly permits it.
- Letting Astro content or browser state edit Stripe Price amounts.
- Importing Stripe Dashboard Product edits back into repo content.
- Replacing hosted Stripe Checkout with Payment Element, embedded Checkout, Payment Links, or inline prices.
- Building a generic product information management system.

## Decisions

### Field ownership is explicit and checked

Define a small `CatalogFieldOwnership` contract used by tests, docs, and verifier output. The matrix should cover at least:

| Field group                                                                 | Owner                       | Direction                                     |
| --------------------------------------------------------------------------- | --------------------------- | --------------------------------------------- |
| `storeItemSlug`, `variantId`, `sourceKind`, `sourceId`                      | repo/app                    | repo/D1 -> Stripe metadata and lookup keys    |
| storefront title, subtitle, image, route, editorial copy                    | repo/Astro                  | repo -> storefront                            |
| Stripe Product `name`, `description`, `images`, metadata, optional tax code | repo projection             | repo -> Stripe Product                        |
| Stripe Price amount, currency, active status, ID, lookup key                | Stripe                      | Stripe -> D1 Store Offer                      |
| availability and stock                                                      | D1/operator                 | D1 -> Store Offer/checkout                    |
| Store Offer snapshot                                                        | Worker reconciliation       | Stripe Price + D1 -> browser-safe Store Offer |
| paid order state                                                            | Worker order reconciliation | Stripe checkout events -> D1                  |

Alternative considered: mark Stripe Product as fully Stripe-owned. Rejected because hosted Checkout renders Product name/image from Stripe; if we leave that outside repo projection, the storefront and Stripe-hosted payment page can drift visually.

Alternative considered: make repo content own price too. Rejected because Stripe Price immutability and hosted Checkout amount authority make repo price edits unsafe for payment evidence.

### Product projection is repo-to-Stripe only

Extend the catalog projection so each buyable Store Item variant has a product projection:

- product identity: deterministic metadata and, when feasible, deterministic Product ID or metadata lookup
- Product fields: `name`, `description`, `images`, metadata, optional `tax_code`
- Price contract: expected current amount/currency for sandbox seeding only, not checkout authority

Dry-run reports Product drift. Sandbox apply updates allowed Product fields. Apply does not import Stripe Dashboard edits back into repo content. If a Dashboard edit changes a repo-owned Product field, verification reports drift and sandbox apply restores the repo projection.

Alternative considered: inline `price_data.product_data` during Checkout Session creation. Rejected for the main path because this hides Prices from the persistent Stripe product catalog and weakens the reusable Price/D1 mapping model already implemented.

### Price reconciliation stays Stripe-to-Worker

Keep the existing rule: amount changes mean replacement Stripe Prices, not updates to the old Price. Reconciliation resolves one unambiguous active Price by lookup key or metadata, updates `VariantStripeMapping` and `StoreOfferSnapshot`, and fails closed on ambiguity.

The verifier may create sandbox Prices when `--apply` is explicit and the sandbox projection expects a buyable variant with no matching Price. That is a sandbox alignment operation, not proof that repo content owns price in production.

Alternative considered: make `stripe:catalog:verify --apply` always enforce repo amount/currency in every environment. Rejected because production price changes need a stronger go-live workflow and manual operational approval.

### Reuse the existing reconciler before adding queues

The first robust implementation should keep one reconciliation service behind four entry points:

- public Store Offer read
- checkout start
- Stripe catalog webhooks
- scheduled/manual catalog verification

Webhook handling should record catalog event processing with a D1 uniqueness boundary before or during processing, keyed by Stripe `event.id` and enough object identity to safely classify duplicate deliveries. The handler should retrieve current Stripe state when event payload order could be stale, then call the same reconciler. Cloudflare Queues remain a later hardening option if webhook processing grows beyond the current Worker request budget.

Alternative considered: introduce Cloudflare Queues immediately. Rejected for this slice because the catalog reconciliation workload is small, the repo already has a scheduled backstop, and adding queue bindings would increase setup/verification surface before the ownership model is proven.

### Testing uses layered proof, not only live Stripe

Use four layers:

1. Pure unit tests for ownership matrix, projection generation, conflict classification, redaction, and action planning.
2. Reconciler tests with fake Stripe catalog gateway and fake repositories for Price replacement, Product projection drift, duplicate active Prices, deleted Products, missing images, and stale snapshots.
3. Script tests for dry-run/apply behavior, sandbox-only mutation enforcement, idempotency keys, redacted output, and all-current-catalog coverage.
4. Operator/live checks for sandbox webhook endpoint, catalog dry-run/apply, Store Offer reads, and hosted Checkout amount/Product display smoke.

This gives fast deterministic coverage for most behavior while keeping live Stripe checks as proof of external setup, not the only test of the code.

### Sandbox alignment is all current buyable variants, not one fixture

Replace the single hardcoded contract with a catalog projection derived from current repo Store Items plus explicit commerce overrides where needed. Verification must fail if a buyable Store Item lacks D1 option/availability/stock rows or a Stripe Product/Price alignment path.

Keep sold-out or unavailable Store Items in the report, but only require Stripe Product/Price alignment for variants that are checkout-eligible under the sandbox policy.

Alternative considered: maintain a separate hand-written Stripe catalog manifest. Rejected as the primary source because it can drift from repo content. A small override file is acceptable only for fields that cannot be derived safely from content.

## Risks / Trade-offs

- [Risk] Product image URLs may not be absolute, stable, or publicly fetchable by Stripe. -> Mitigation: projection validation must reject non-absolute URLs and include a sandbox smoke that confirms hosted Checkout renders the expected Product.
- [Risk] Dashboard edits to repo-owned Product fields can be overwritten by sandbox apply. -> Mitigation: document field ownership, make dry-run explicit, and require apply confirmation by command flag.
- [Risk] Multiple active Prices can match one variant after manual Dashboard edits. -> Mitigation: fail closed with `catalog_drift` and require operator cleanup before checkout resumes.
- [Risk] Webhook events can arrive duplicated or out of order. -> Mitigation: D1 event uniqueness, current-state retrieval, idempotent upserts, and scheduled/manual full verification.
- [Risk] Full catalog alignment can expose incomplete D1 seed or stock state. -> Mitigation: split report sections into identity, Product projection, Price authority, availability/stock readiness, and live-provider proof.
- [Risk] Production mutation policy is not settled. -> Mitigation: keep provider mutations sandbox-only in this change and leave production go-live expansion to the existing readiness change.

## Migration Plan

1. Add field ownership terms and requirements.
2. Derive a catalog projection for every current Store Item and variant that may become buyable.
3. Extend Stripe catalog gateway/reconciler types to read/update Product fields separately from Price fields.
4. Add dry-run report sections for Product projection drift, Price authority drift, D1 readiness, and webhook readiness.
5. Add sandbox apply for Product projection updates and sandbox Price alignment.
6. Add webhook idempotency/replay safety for catalog events.
7. Align sandbox D1 rows and Stripe Products/Prices for all current buyable variants.
8. Run live sandbox verification and smoke evidence.

Rollback is fail-closed: disable apply usage, keep Store Offer reads and checkout start reconciliation, and use dry-run reports plus manual Stripe Dashboard cleanup to resolve any bad sandbox projection. No committed Stripe IDs or secrets are introduced.

## Open Questions

- Which unavailable Store Items should receive sandbox Stripe Products now versus only when they become buyable?
- Should Product IDs be deterministic where Stripe allows caller-supplied Product IDs, or should metadata lookup remain the identity mechanism?
- Which exact product description should Stripe Checkout use for releases and distro items when content has long editorial copy?
- Should production apply remain permanently manual, or should it become available behind a separate production go-live approval gate?
