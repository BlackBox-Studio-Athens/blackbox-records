## 1. Current-State Audit

- [x] 1.1 Inspect `apps/backend/src/interfaces/http/routes/register-stripe-webhook-routes.ts` and confirm raw-body signature verification still happens before any JSON parsing.
- [x] 1.2 Inspect `apps/backend/src/interfaces/http/routes/stripe-webhook-acknowledgement.ts` and record current catalog event handling, duplicate event behavior, variant identity parsing, and retry/failure behavior.
- [x] 1.3 Inspect `apps/backend/src/interfaces/http/routes/stripe-webhook-services.ts` and confirm webhook reconciliation uses `CatalogReconciler` with Prisma repositories and `createStripeCatalogGateway()`.
- [x] 1.4 Inspect `apps/backend/src/application/commerce/catalog-sync/catalog-reconciler.ts` and record current behavior for active Price resolution, mapping updates, snapshot updates, Product Projection drift, and `ambiguous_active_price`.
- [x] 1.5 Inspect `apps/backend/src/application/commerce/checkout/read-store-offer.ts` and `start-checkout` flow to confirm Store Offer read and checkout start both reconcile before returning buyable state.
- [x] 1.6 Inspect `apps/web/src/components/store/StoreOfferPriceDisplay.tsx` and public checkout API code to identify any same-session cache that could hide a just-changed price.
- [x] 1.7 Inspect D1 schema and decide whether `StripeCatalogWebhookEvent` needs processing status fields or whether success-after-work recording is enough for retry-safe idempotency.
- [x] 1.8 Confirm UAT persistent Stripe webhook endpoint and event set are already covered by `pnpm stripe:webhooks:verify --env uat`, or record the exact setup gap.
  - Verified 2026-07-10: one enabled test-mode account endpoint covers all six catalog events, the UAT Worker webhook secret is present, and the committed UAT cron is configured. Deployed-cron verification was unavailable because Cloudflare account/token environment variables were absent.
- [x] 1.9 Inspect `scripts/stripe-catalog-verify.ts` and any `expectedPrices` path to identify where generated Desired Price currently acts as amount/currency authority.

## 2. Catalog Reconciler Behavior

- [x] 2.1 Add or extend catalog reconciler tests for a Dashboard-created replacement Price that becomes the only active Price for a variant.
- [x] 2.2 Add a test where lookup-key transfer selects the replacement Price and updates `VariantStripeMapping`.
- [x] 2.3 Add a test where complete app identity metadata selects the replacement Price when lookup key is missing or stale.
- [x] 2.4 Add a test where the old Price remains active beside the replacement Price and reconciliation reports `ambiguous_active_price`.
- [x] 2.5 Add a test where the replacement Price has wrong `storeItemSlug`, `variantId`, Product Environment, or invalid currency policy and checkout fails closed.
- [x] 2.6 Add a test where `StoreOfferSnapshot` has the old amount/currency/Price ID and apply mode updates the snapshot to the replacement Price.
- [x] 2.7 Add a test where Product Projection drift is reported separately from clean Price Authority replacement.
- [x] 2.8 Verify `CatalogReconciler` does not import Dashboard-edited Product name, image, description, or tax code into repo content.
- [x] 2.9 Keep local mock `price_mock_*` behavior intact and isolated from real UAT/PRD Price Authority.
- [x] 2.10 Add a test where a valid Dashboard replacement Price intentionally differs from stale generated Desired Price and day-to-day reconciliation accepts Stripe Price Authority.
- [x] 2.11 Add a test where explicit promotion/apply mode still detects generated Desired Price drift when that mode is intentionally selected.

## 3. Stripe Catalog Webhook Processing

- [x] 3.1 Add tests for signed `price.created` and `price.updated` events that identify a known variant and trigger `reconcileCatalogVariant()`.
- [x] 3.2 Add tests for `product.updated` events that identify affected Store Item variants and trigger reconciliation.
- [x] 3.3 Add tests for duplicate Stripe catalog event IDs returning success without a second reconciliation mutation only when the prior event processing status succeeded.
- [x] 3.4 Add tests for events with no variant identity returning ignored success and redacted logs.
- [x] 3.5 Add tests proving event payload amounts are not copied directly into D1; reconciliation must read/list current Stripe state.
- [x] 3.6 Add tests for out-of-order catalog events resolving to current Stripe state after each event.
- [x] 3.7 Add tests or route behavior for transient Stripe/D1 reconciliation failure returning a retryable non-2xx response and leaving the event retryable.
- [x] 3.8 Ensure webhook logs include safe event type, outcome, retryable status, safe reason, `storeItemSlug` when available, and `variantId` when available.
- [x] 3.9 Ensure webhook logs never include raw webhook body, signing secret, full Price ID, full Product ID, or full endpoint ID.
- [x] 3.10 Add tests for `appEnv` or environment-scoped lookup-key mismatch returning ignored success with no D1 mutation.
- [x] 3.11 Add tests for malformed `variantId` or malformed identity payload returning ignored non-retryable success with redacted logs.
- [x] 3.12 If status fields are needed, add the D1 migration, Prisma model changes, repository tests, and generated Prisma client update for webhook event processing status.
  - Follow-up migration `0011_keep_legacy_stripe_catalog_webhook_events_retryable.sql` reclassifies legacy rows with unknown completion outcome as failed/retryable instead of trusting the former record-before-work success state.

## 4. Store Offer and Checkout Freshness

- [x] 4.1 Add Store Offer API tests proving a replacement Stripe Price is reflected in `/api/store/items/:storeItemSlug` after webhook or read-time reconciliation.
- [x] 4.2 Add Store Offer API tests proving ambiguous or missing active Price returns non-buyable catalog-drift state.
- [x] 4.3 Confirm Store Offer API responses keep `Cache-Control: no-store` or equivalent Worker API Freshness headers.
- [x] 4.4 Add checkout-start tests proving the resolved current Stripe Price is used after a replacement Price update.
- [x] 4.5 Add checkout-start tests proving stale `StoreCart` price snapshots cannot create Checkout Sessions at the old price.
- [x] 4.6 Add checkout-start tests proving ambiguous active Prices reject checkout and create no Stripe Checkout Session.
- [x] 4.7 Review `StoreOfferPriceDisplay` module-level cache; either prove checkout/item detail rereads current Store Offer or adjust the cache to avoid stale same-session price display after navigation.
- [x] 4.8 Keep UI states browser-safe: pending price copy while loading, checkout-unavailable copy on failed Store Offer read, no fallback static amount.

## 5. Operator Tooling and Docs

- [x] 5.1 Update `docs/catalog-promotion.md` or `docs/stripe-sandbox-uat.md` with the supported Stripe Dashboard price-change workflow.
- [x] 5.2 Document exact operator checklist: create replacement Price, preserve lookup key or app metadata, archive stale active Price, verify UAT.
- [x] 5.3 Document required app identity metadata fields: `appEnv`, `sourceId`, `sourceKind`, `storeItemSlug`, and `variantId`.
- [x] 5.4 Document Decap boundary: editors can change item information and page copy, not checkout price, Stripe IDs, D1 IDs, stock, or provider mutation controls.
- [x] 5.5 Document the practical UAT access model: the colleague uses the same existing Stripe business account and UAT Sandbox as the owner, no separate restricted-role proof is required, and metadata-only lookup-key repair remains the fallback.
- [x] 5.6 Add troubleshooting for missing metadata, duplicate active Prices, wrong currency, webhook signature failure, stale Store Offer snapshots, and PRD-disabled state.
- [x] 5.7 Update `stripe:webhooks:verify` or its docs if current output does not clearly cover catalog events needed for price propagation.
- [x] 5.8 Ensure all new diagnostics redact Stripe object IDs, endpoint IDs, API errors, and secrets according to existing redaction policy.
- [x] 5.9 Document the researched platform pattern: CMS edits presentation, Stripe/commerce owns Price Authority, webhooks update local read models, and reconciliation is current-state based.

## 6. UAT Proof Path

- [x] 6.1 Run `pnpm stripe:webhooks:verify --env uat` and record redacted result in local notes or change evidence without committing secrets.
  - Verified 2026-07-10: one enabled test-mode endpoint, all six catalog event types covered, UAT Worker webhook secret present, committed UAT cron present; no secret or full Stripe object ID was recorded.
- [x] 6.2 Using the same existing Stripe business account and UAT Sandbox as the owner, have the colleague confirm Sandbox/test mode and create a replacement Price for one safe Store Item variant with complete app metadata or the canonical lookup key.
  - Verified 2026-07-10: the colleague confirmed the Sandbox banner and created the `disintegration-black-vinyl-lp` replacement Price at 2900 EUR with complete app metadata; no live mutation or provider identifier was recorded.
- [x] 6.3 Archive or deactivate the stale matching Price so only one active Price identifies the variant.
  - Verified 2026-07-10: the stale 2800 EUR Price was archived before acceptance checks.
- [x] 6.4 Observe Worker logs for a safe `catalog_reconciled` webhook outcome for `price.created` or `price.updated`.
  - Verified 2026-07-10: the operator observed the final safe `catalog_reconciled` outcome after replacement and archival.
- [x] 6.5 Read the public Store Offer endpoint for the item and confirm the updated display price and checkout readiness.
  - Verified 2026-07-10: the public Store Offer returned `€29.00`, 2900 EUR, `canCheckout=true`, and the expected Store Item/variant identity.
- [x] 6.6 Run `pnpm stripe:catalog:verify --env uat` in day-to-day verification mode and confirm the valid Dashboard replacement Price is not rejected because generated Desired Price is stale.
  - Verified 2026-07-10: the target variant reported `issues=0`, `drift=none`, and `actions=none`; Price Authority, D1 readiness, and Store Offer snapshots each reported 0 issues. The global nonzero exit remains limited to 34 unrelated legacy catalog-identity issues and 5 Product Projection mismatches.
- [x] 6.7 Run the relevant UAT Stripe smoke path and confirm hosted Checkout displays the updated amount/currency before payment submission.
  - Verified 2026-07-10: GitHub Actions run `29103834124` passed `checkout_surface` without payment submission; the Checkout Session projection expected and observed 2900 EUR.
  - For a diagnostic replacement amount, run `pnpm smoke:stripe-uat -- --scenario checkout_surface --expected-checkout-amount-minor <amount-minor>`, or dispatch `gh workflow run uat-smoke.yml --ref main -f expected_checkout_amount_minor=<amount-minor>` when credentialed CI is required. The hosted Session assertion follows the temporary Stripe-owned amount without changing generated Desired Price or the browser cart snapshot.
- [x] 6.8 Repair the UAT test catalog back to the intended accepted test price if the manual replacement Price was diagnostic-only.
  - Decision 2026-07-10: no repair needed. The accepted 2900 EUR replacement is valid current UAT Price Authority, not diagnostic-only state; reverting would add no acceptance evidence.
- [x] 6.9 Prove through automated acknowledgement and repository tests that a failed webhook reconciliation remains retryable and is not skipped as an already-processed duplicate.
  - Live failure injection is excluded from UAT acceptance because no safe deterministic provider-failure path exists; focused tests cover failed-first-attempt retry and late-failure protection for succeeded events.

## 7. PRD Gate and Safety

- [x] 7.1 Confirm price propagation tooling reports PRD as disabled, not configured, or readiness-only while `PRD_OPEN_GATE` is absent.
- [x] 7.2 Confirm no implementation path mutates Stripe live mode, PRD D1, live checkout state, or PRD runtime webhook read models before the PRD-open gate.
- [x] 7.3 Document the PRD go-live checklist for later: PRD webhook endpoint, PRD Worker `STRIPE_WEBHOOK_SECRET`, PRD Stripe restricted users, PRD catalog verification, and PRD smoke evidence.
- [x] 7.4 Ensure UAT evidence cannot be presented as PRD price propagation acceptance.
- [x] 7.5 Add tests or config assertions proving PRD catalog webhook delivery is no-mutation/readiness-only before `PRD_OPEN_GATE=open`.

## 8. Validation

- [x] 8.1 Run targeted backend catalog-sync tests.
- [x] 8.2 Run targeted backend webhook route/acknowledgement tests.
- [x] 8.3 Run targeted Store Offer and checkout tests.
- [x] 8.4 Run targeted web Store Offer price display tests if frontend cache behavior changes.
- [x] 8.5 Run `pnpm test:unit`.
- [x] 8.6 Run `pnpm check`.
- [x] 8.7 Run `pnpm build`.
- [x] 8.8 Run `pnpm openspec -- validate stripe-dashboard-price-webhook-propagation --type change --strict`.
- [x] 8.9 Run `pnpm openspec -- validate --all --strict`.

## 9. Metadata-Free Operator Flow

- [x] 9.1 Update OpenSpec to make the colleague workflow use the existing app-identified Product and forbid manual Price metadata, lookup-key, Stripe ID, or D1 ID entry.
- [ ] 9.2 Add a focused reconciler regression test proving a sole active replacement Price with empty Price metadata and no lookup key inherits complete Product identity and receives automatic Price identity repair.
- [ ] 9.3 Simplify the non-developer runbook to `Add another price`, make it default, archive the old Price, and leave advanced fields untouched.
- [ ] 9.4 Run the focused catalog reconciler test.
- [ ] 9.5 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final implementation tree.
- [ ] 9.6 Run strict change and all-spec OpenSpec validation.
