## Context

BlackBox already separates editorial Store Item content from buyable commerce state. Decap and Astro content own product presentation, while Stripe Prices and D1 Store Offer snapshots own browser-safe checkout price/readiness. The current backend has useful seams already in place:

- `/api/stripe/webhooks` verifies Stripe signatures with `STRIPE_WEBHOOK_SECRET`.
- `STRIPE_CATALOG_WEBHOOK_EVENT_TYPES` already includes `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, and `price.deleted`.
- `acknowledgeVerifiedStripeWebhookEvent()` records catalog event IDs through `StripeCatalogWebhookEventRepository`, derives `variantId` from metadata or lookup key, deduplicates retries, and calls `reconcileCatalogVariant()`.
- `createStripeWebhookServices()` wires `CatalogReconciler` with `PrismaStoreItemOptionRepository`, `PrismaStoreOfferSnapshotRepository`, `PrismaVariantStripeMappingRepository`, and `createStripeCatalogGateway()`.
- `CatalogReconciler.reconcileVariant()` already resolves active matching Prices by lookup key and metadata, updates mappings/snapshots when `apply: true`, fails on ambiguous active Prices, and detects stale or mismatched snapshots.
- `readStoreOffer()` already reconciles before returning a browser-safe price and checkout readiness.
- `StoreOfferPriceDisplay` already reads the public Store Offer API instead of rendering static Astro prices.

Stripe's current model fits this boundary: Price amounts are not edited in-place through the API; amount changes use a new Price, lookup-key transfer or metadata preservation, and stale Price deactivation. Stripe webhooks are signed, may arrive more than once, and may arrive out of order, so the handler must deduplicate event IDs and reconcile current Stripe state instead of trusting event payload order.

### Research pass: comparable e-shop patterns

- Stripe's documented Price model treats replacement Prices, lookup keys, metadata, archived Prices, and signed webhooks as the native tools for this workflow.
- Shopify's platform pattern is similar at the boundary level: product and variant pricing are commerce-admin/API concerns, while webhooks notify downstream systems that their read models need to update.
- Medusa and Saleor both model pricing as commerce-domain state with events/subscribers or webhooks for downstream propagation, not as CMS-owned editorial copy.
- The shared best practice across those systems is to treat webhook payloads as notifications, make handlers idempotent, and reconcile current commerce state before mutating local read models.

## Goals / Non-Goals

**Goals:**

- Make Stripe Dashboard the operator price-change surface for UAT and, after PRD opens, PRD.
- Let restricted Stripe users change an item price without repository edits, Decap changes, or static deploys.
- Dynamically propagate Stripe Price changes to D1 `VariantStripeMapping` and `StoreOfferSnapshot`.
- Make the public storefront read the new price from the Worker Store Offer path.
- Keep checkout start fail-closed and revalidated against the active Stripe Price.
- Provide clear operator proof that a price change reached Stripe, webhook delivery, D1, public Store Offer, and checkout readiness.
- Keep all diagnostics redacted: no secrets, no full Stripe object IDs, no raw provider payload dumps.

**Non-Goals:**

- Adding a Decap price field.
- Letting Astro content, browser state, or committed JSON own authoritative price.
- Building a custom price-management UI in this slice.
- Replacing Stripe-hosted Checkout or existing Store Offer APIs.
- Creating a queue or Durable Object for catalog events before the current low-volume synchronous path proves insufficient.
- Opening PRD live checkout or live provider mutation before the explicit PRD-open gate.

## Decisions

### Use Stripe Dashboard as the price editor

Operators change prices in Stripe Product catalog using restricted Stripe accounts. The runbook must require a replacement Price for amount changes, not an in-place amount edit:

1. Open the Product for the Store Item variant.
2. Add a new Price with the intended amount/currency.
3. Preserve or transfer the deterministic lookup key.
4. Preserve app identity metadata: `appEnv`, `sourceId`, `sourceKind`, `storeItemSlug`, and `variantId`.
5. Archive or deactivate the old Price.
6. Wait for webhook propagation or run catalog verification.

Rationale: This matches Stripe's Price model and keeps Price Authority in Stripe. It also avoids a new privileged app surface.

Implementation note: Stripe has no Product-catalog-only built-in team role. The least-broad built-in candidate is Support Specialist, but it still has broader payment/customer permissions and must be assigned only to the isolated UAT Stripe Sandbox, never to the live parent account. Before handoff, a colleague login must prove that this scoped role can create replacement Prices, preserve app identity metadata, and archive the stale Price. If Dashboard role limits block lookup-key transfer, complete metadata-only identity is sufficient: current-state reconciliation atomically assigns the canonical lookup key when it finds exactly one active metadata-identified Price. Decap remains out of scope for Price Authority.

Alternative considered: add `desired_price` to Decap and let GitHub Actions mutate Stripe. Rejected for this slice because it creates a second price-editing surface and requires a promotion approval workflow before it is safe.

### Keep Desired Price out of day-to-day price authority

Generated Desired Price data remains useful for environment-scoped catalog promotion and verification context, but it must not fight a valid Dashboard replacement Price during normal operations. Day-to-day Store Offer reads, checkout start, webhook reconciliation, and UAT catalog verification should treat the current unambiguous Stripe replacement Price as Price Authority unless an explicit promotion/apply mode is selected.

Rationale: Without this separation, a valid Dashboard price change could be reported as `wrong_amount` or `wrong_currency` against stale generated expected-price data, or worse, repaired back to the old amount.

Alternative considered: keep generated Desired Price as the single permanent source of amount/currency truth. Rejected because the requested operator workflow is Stripe Dashboard price editing without repository or Decap access.

### Keep webhook processing on the existing route and reconciler

The implementation should deepen the existing route rather than add another endpoint:

```text
Stripe Product/Price event
  -> /api/stripe/webhooks
  -> verify signature from raw body
  -> record event ID with processing status
  -> derive Product Environment and variantId from metadata or lookup key
  -> CatalogReconciler.reconcileVariant(storeItem, { apply: true })
  -> mark event succeeded only after reconciliation succeeds
  -> update VariantStripeMapping and StoreOfferSnapshot
  -> storefront Store Offer read returns new price
```

Rationale: The route, allowed event list, dedupe repository, identity parsing, and reconciler already exist. Reusing them is the shortest safe path and keeps checkout and manual verification using the same resolution logic.

Alternative considered: create a separate `/api/stripe/catalog-webhooks` endpoint. Rejected because it duplicates signature configuration and creates endpoint drift risk.

### Treat catalog webhooks as a statusful event inbox

`StripeCatalogWebhookEvent` should become the idempotency ledger for event processing, not a queue. Duplicate suppression must apply only to events already marked succeeded. If reconciliation fails after the event is recorded, the event must remain retryable through a pending/failed status or equivalent success-after-work recording strategy, so Stripe's retry can reconcile again.

Rationale: The current record-before-reconcile shape can accidentally swallow a retry if Stripe or D1 fails after the event ID is stored. Statusful processing keeps webhook delivery idempotent without introducing Cloudflare Queues or Durable Objects in v1.

Alternative considered: acknowledge Stripe immediately and process all catalog events asynchronously through a queue. Rejected for v1 because catalog volume is tiny and synchronous retry semantics are enough once failed attempts stay retryable.

### Reconcile current Stripe state, not event payload state

Catalog webhook events should be treated as change notifications. After recording the event, the Worker must resolve the current active Product/Price candidates through `CatalogReconciler`, using lookup key, metadata, and any existing D1 mapping. The event payload is useful for object kind, object ID, event ID, and identity hints only.

Rationale: Stripe events may be duplicated or delivered out of order. Current-state reconciliation prevents stale event payloads from overwriting newer Price state.

Alternative considered: directly copy `event.data.object.unit_amount` into D1. Rejected because it trusts event order and bypasses existing ambiguity checks.

### Require environment-scoped event identity

Webhook processing must confirm that event identity matches the Worker's Product Environment before reconciliation mutates D1. A matching `appEnv` metadata value or deterministic environment-scoped lookup key can satisfy this. Events with malformed variant identity or mismatched environment identity should be acknowledged as ignored, logged with redacted context, and left to manual/scheduled verification if they represent real drift.

Rationale: UAT and PRD must never reconcile each other's Price events, especially once live mode opens.

Alternative considered: derive only `variantId` and reconcile in the receiving environment. Rejected because identical variant IDs can exist across Product Environments.

### Fail closed on ambiguous or missing active Prices

If more than one active Price identifies the same variant, if no active Price can be resolved, or if identity metadata is wrong, the reconciler must not pick a Price. It should report catalog drift, leave checkout disabled or paused for that variant, and require operator repair.

Rationale: Wrong price is worse than temporarily disabled checkout.

Alternative considered: pick the newest active Price. Rejected because a Dashboard mistake could silently charge the wrong amount.

### Let Store Offer reads recover from missed webhooks

Webhook propagation is near-real-time convenience, not the only correctness path. Public Store Offer reads and checkout start should continue to call `CatalogReconciler.reconcileVariant()` before returning a buyable price or creating checkout. The scheduled catalog verifier and manual `pnpm stripe:catalog:verify --env uat` remain backstops.

Rationale: Stripe retries webhooks, but delivery still depends on endpoint configuration and Worker availability. Existing read/start reconciliation gives shoppers a safe result even when a webhook was delayed.

Alternative considered: trust D1 snapshots until scheduled verification. Rejected because it can show stale prices longer than needed.

### Keep catalog webhook work synchronous for v1

For this low-volume shop, the v1 implementation should keep the current synchronous route shape: verify, record processing attempt, reconcile, mark succeeded, return 200 on success. If reconciliation fails due to transient provider or D1 failure, leave the event retryable and return a non-2xx response so Stripe retries. Do not add a queue, Durable Object, or background worker yet.

Rationale: The catalog event volume is tiny, and synchronous retry semantics are simpler and observable. Stripe recommends quick acknowledgement and async processing at scale, but this repo already has dedupe plus scheduled/read-time backstops; adding queue infrastructure now is not justified.

Upgrade trigger: if webhook route duration, provider latency, or concurrent event volume creates timeout/retry noise, move reconciliation to `executionCtx.waitUntil()` or a Cloudflare Queue with explicit event status fields.

### Harden frontend freshness without polling

Store item cards and checkout surfaces should keep reading price from `/api/store/items/:storeItemSlug`. The Worker response must stay `Cache-Control: no-store` for price/readiness data. Browser components should avoid long-lived module-level caching that survives a user action after a price change; at minimum, checkout and item detail views must reread Store Offer when opened or when checkout starts.

Rationale: The storefront does not need real-time websockets for a small catalog. A page refresh, navigation, or checkout intent should see current Worker state.

Alternative considered: push live price updates to open browser tabs. Rejected as unnecessary until operators need same-tab live refresh.

### Separate UAT and PRD acceptance

UAT propagation can be proved now against Stripe test mode, UAT Worker, and UAT D1. PRD propagation must remain disabled or readiness-only until `PRD_OPEN_GATE=open` exists and the production-readiness change approves live checkout and live provider mutation. This applies to runtime webhook handling too: before the gate, PRD webhook delivery may verify signatures and report readiness, but it must not mutate PRD D1 or live Stripe state.

Rationale: A live Price update can affect real shoppers. The environment model already requires PRD-disabled behavior before go-live.

## Risks / Trade-offs

- [Risk] Operator creates a new Price but forgets lookup key or metadata. -> Mitigation: webhook ignores unknown identity, catalog verification reports missing Price, Store Offer read fails closed, and docs require metadata/lookup-key checklist.
- [Risk] Operator leaves two active Prices matching one variant. -> Mitigation: `CatalogReconciler` reports `ambiguous_active_price` and checkout remains unavailable for that variant until one Price is archived.
- [Risk] Generated Desired Price still reflects the previous amount after a valid Dashboard price change. -> Mitigation: day-to-day verification treats Desired Price as promotion context only unless explicit promotion/apply mode is selected.
- [Risk] Stripe event arrives before related Product/Price state is fully visible through API reads. -> Mitigation: return retryable failure only for transient provider errors, and keep manual/scheduled verification as backstop.
- [Risk] Event ID is recorded before reconciliation and then the attempt fails. -> Mitigation: add processing status or success-after-work recording so duplicates skip only after a prior success.
- [Risk] UAT and PRD share variant IDs but differ by Product Environment. -> Mitigation: require `appEnv` or environment-scoped lookup-key match before D1 mutation.
- [Risk] Deleted Price events may not carry metadata. -> Mitigation: treat deletion payloads as hints; rely on `price.updated` for archive/deactivation and verification/read-time reconciliation for recovery.
- [Risk] Webhook endpoint secret is wrong. -> Mitigation: `stripe:webhooks:verify` checks endpoint configuration and Worker secret presence, and UAT smoke proves delivery.
- [Risk] Storefront module-level price-read cache shows stale price inside one already-open browser session. -> Mitigation: checkout start revalidates; implementation should clear or bypass the cache on checkout/item detail entry if stale-session visibility matters.
- [Risk] Synchronous reconciliation times out under provider slowness. -> Mitigation: Stripe retries failed webhook responses; move to `waitUntil` or Queue only if measured route duration requires it.
- [Risk] PRD is accidentally updated before approval. -> Mitigation: preserve PRD-open gate and product-environment mutation policy checks in verification and promotion.

## Migration Plan

1. Audit current catalog webhook route, reconciler, Store Offer reads, and checkout start to confirm all price paths share the same `CatalogReconciler` logic.
2. Add or migrate webhook event storage so a catalog event is skipped only after a succeeded processing status; failed/pending attempts remain retryable.
3. Split Desired Price handling so Dashboard day-to-day reconciliation treats current Stripe Price Authority as accepted, while explicit promotion/apply mode can still compare against generated Desired Price.
4. Add focused tests for Stripe Dashboard replacement-Price scenarios in `CatalogReconciler`:
   - one new active Price replaces old inactive Price
   - lookup-key transfer selects new Price
   - metadata-only identity selects new Price
   - two active matching Prices fail closed
   - stale/mismatched `StoreOfferSnapshot` updates on apply
   - valid Dashboard amount differs from stale generated Desired Price without being classified as wrong amount in day-to-day mode
5. Add webhook acknowledgement tests for:
   - signed `price.created` or `price.updated` event records event ID and reconciles variant
   - duplicate succeeded event returns success without double reconciliation
   - failed first attempt can be retried and reconciled
   - missing, malformed, or environment-mismatched variant identity returns ignored success and redacted log
   - reconciler failure returns retryable route failure
6. Add persistence tests for `StripeCatalogWebhookEventRepository` if duplicate/status behavior is not already covered enough.
7. Add public Store Offer tests proving a changed Stripe Price becomes the returned browser-safe price after reconciliation.
8. Add checkout tests proving checkout start uses the new active Stripe Price and rejects stale or ambiguous mappings.
9. Add PRD-disabled runtime tests proving catalog webhook delivery cannot mutate PRD D1 or live Stripe state before the PRD-open gate.
10. Update operator docs:

- restricted Stripe account role guidance
- exact price-change checklist
- lookup-key transfer or metadata-only fallback
- UAT proof commands
- troubleshooting for missing metadata, duplicate active Prices, webhook signature failure, and stale Store Offer snapshots

11. Run UAT validation:

- `pnpm stripe:webhooks:verify --env uat`
- create/replace one test-mode Price in Stripe Dashboard
- confirm webhook log outcome `catalog_reconciled`
- read `/api/store/items/:storeItemSlug`
- run `pnpm stripe:catalog:verify --env uat`
- run the relevant UAT checkout smoke

12. Leave PRD docs and runtime webhook handling in readiness-only/no-mutation mode until PRD-open gate exists.

Rollback:

- If a Stripe price change is wrong, create/activate the intended Price and archive the wrong active Price; do not edit Astro content.
- If propagation is broken, run `pnpm stripe:catalog:verify --env uat --apply` after reviewing dry-run output, then rerun Store Offer read and smoke.
- If checkout must stop immediately, use the existing checkout pause path for the affected `variantId`.

## Remaining Validation and Open Questions

- Confirm through an actual colleague login that sandbox-scoped Support Specialist access can create replacement Prices, add the required metadata, and archive the stale Price. Do not broaden access if the candidate role is insufficient.
- Record whether that role can transfer lookup keys in Dashboard. Lookup-key transfer is not required for the supported path because metadata-only identity now triggers guarded, atomic lookup-key repair.
- Should same-tab storefront price display refresh after a Dashboard price change without reload? Current recommendation is no; checkout revalidation covers correctness.
- Should PRD use the same webhook endpoint route as UAT after go-live, or separate endpoint/secrets by live account policy? Current environment model expects separate PRD Worker secret configuration.
