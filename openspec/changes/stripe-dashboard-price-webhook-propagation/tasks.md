## 1. Current-State Audit

- [ ] 1.1 Inspect `apps/backend/src/interfaces/http/routes/register-stripe-webhook-routes.ts` and confirm raw-body signature verification still happens before any JSON parsing.
- [ ] 1.2 Inspect `apps/backend/src/interfaces/http/routes/stripe-webhook-acknowledgement.ts` and record current catalog event handling, duplicate event behavior, variant identity parsing, and retry/failure behavior.
- [ ] 1.3 Inspect `apps/backend/src/interfaces/http/routes/stripe-webhook-services.ts` and confirm webhook reconciliation uses `CatalogReconciler` with Prisma repositories and `createStripeCatalogGateway()`.
- [ ] 1.4 Inspect `apps/backend/src/application/commerce/catalog-sync/catalog-reconciler.ts` and record current behavior for active Price resolution, mapping updates, snapshot updates, Product Projection drift, and `ambiguous_active_price`.
- [ ] 1.5 Inspect `apps/backend/src/application/commerce/checkout/read-store-offer.ts` and `start-checkout` flow to confirm Store Offer read and checkout start both reconcile before returning buyable state.
- [ ] 1.6 Inspect `apps/web/src/components/store/StoreOfferPriceDisplay.tsx` and public checkout API code to identify any same-session cache that could hide a just-changed price.
- [ ] 1.7 Inspect D1 schema and decide whether `StripeCatalogWebhookEvent` needs processing status fields or whether success-after-work recording is enough for retry-safe idempotency.
- [ ] 1.8 Confirm UAT persistent Stripe webhook endpoint and event set are already covered by `pnpm stripe:webhooks:verify --env uat`, or record the exact setup gap.
- [ ] 1.9 Inspect `scripts/stripe-catalog-verify.ts` and any `expectedPrices` path to identify where generated Desired Price currently acts as amount/currency authority.

## 2. Catalog Reconciler Behavior

- [ ] 2.1 Add or extend catalog reconciler tests for a Dashboard-created replacement Price that becomes the only active Price for a variant.
- [ ] 2.2 Add a test where lookup-key transfer selects the replacement Price and updates `VariantStripeMapping`.
- [ ] 2.3 Add a test where complete app identity metadata selects the replacement Price when lookup key is missing or stale.
- [ ] 2.4 Add a test where the old Price remains active beside the replacement Price and reconciliation reports `ambiguous_active_price`.
- [ ] 2.5 Add a test where the replacement Price has wrong `storeItemSlug`, `variantId`, Product Environment, or invalid currency policy and checkout fails closed.
- [ ] 2.6 Add a test where `StoreOfferSnapshot` has the old amount/currency/Price ID and apply mode updates the snapshot to the replacement Price.
- [ ] 2.7 Add a test where Product Projection drift is reported separately from clean Price Authority replacement.
- [ ] 2.8 Verify `CatalogReconciler` does not import Dashboard-edited Product name, image, description, or tax code into repo content.
- [ ] 2.9 Keep local mock `price_mock_*` behavior intact and isolated from real UAT/PRD Price Authority.
- [ ] 2.10 Add a test where a valid Dashboard replacement Price intentionally differs from stale generated Desired Price and day-to-day reconciliation accepts Stripe Price Authority.
- [ ] 2.11 Add a test where explicit promotion/apply mode still detects generated Desired Price drift when that mode is intentionally selected.

## 3. Stripe Catalog Webhook Processing

- [ ] 3.1 Add tests for signed `price.created` and `price.updated` events that identify a known variant and trigger `reconcileCatalogVariant()`.
- [ ] 3.2 Add tests for `product.updated` events that identify affected Store Item variants and trigger reconciliation.
- [ ] 3.3 Add tests for duplicate Stripe catalog event IDs returning success without a second reconciliation mutation only when the prior event processing status succeeded.
- [ ] 3.4 Add tests for events with no variant identity returning ignored success and redacted logs.
- [ ] 3.5 Add tests proving event payload amounts are not copied directly into D1; reconciliation must read/list current Stripe state.
- [ ] 3.6 Add tests for out-of-order catalog events resolving to current Stripe state after each event.
- [ ] 3.7 Add tests or route behavior for transient Stripe/D1 reconciliation failure returning a retryable non-2xx response and leaving the event retryable.
- [ ] 3.8 Ensure webhook logs include safe event type, outcome, retryable status, safe reason, `storeItemSlug` when available, and `variantId` when available.
- [ ] 3.9 Ensure webhook logs never include raw webhook body, signing secret, full Price ID, full Product ID, or full endpoint ID.
- [ ] 3.10 Add tests for `appEnv` or environment-scoped lookup-key mismatch returning ignored success with no D1 mutation.
- [ ] 3.11 Add tests for malformed `variantId` or malformed identity payload returning ignored non-retryable success with redacted logs.
- [ ] 3.12 If status fields are needed, add the D1 migration, Prisma model changes, repository tests, and generated Prisma client update for webhook event processing status.

## 4. Store Offer and Checkout Freshness

- [ ] 4.1 Add Store Offer API tests proving a replacement Stripe Price is reflected in `/api/store/items/:storeItemSlug` after webhook or read-time reconciliation.
- [ ] 4.2 Add Store Offer API tests proving ambiguous or missing active Price returns non-buyable catalog-drift state.
- [ ] 4.3 Confirm Store Offer API responses keep `Cache-Control: no-store` or equivalent Worker API Freshness headers.
- [ ] 4.4 Add checkout-start tests proving the resolved current Stripe Price is used after a replacement Price update.
- [ ] 4.5 Add checkout-start tests proving stale `StoreCart` price snapshots cannot create Checkout Sessions at the old price.
- [ ] 4.6 Add checkout-start tests proving ambiguous active Prices reject checkout and create no Stripe Checkout Session.
- [ ] 4.7 Review `StoreOfferPriceDisplay` module-level cache; either prove checkout/item detail rereads current Store Offer or adjust the cache to avoid stale same-session price display after navigation.
- [ ] 4.8 Keep UI states browser-safe: pending price copy while loading, checkout-unavailable copy on failed Store Offer read, no fallback static amount.

## 5. Operator Tooling and Docs

- [ ] 5.1 Update `docs/catalog-promotion.md` or `docs/stripe-sandbox-uat.md` with the supported Stripe Dashboard price-change workflow.
- [ ] 5.2 Document exact operator checklist: create replacement Price, preserve lookup key or app metadata, archive stale active Price, verify UAT.
- [ ] 5.3 Document required app identity metadata fields: `appEnv`, `sourceId`, `sourceKind`, `storeItemSlug`, and `variantId`.
- [ ] 5.4 Document Decap boundary: editors can change item information and page copy, not checkout price, Stripe IDs, D1 IDs, stock, or provider mutation controls.
- [ ] 5.5 Document least-privilege Stripe account guidance and prove in UAT that the chosen restricted role can create replacement Prices, preserve metadata, and transfer or repair lookup keys.
- [ ] 5.6 Add troubleshooting for missing metadata, duplicate active Prices, wrong currency, webhook signature failure, stale Store Offer snapshots, and PRD-disabled state.
- [ ] 5.7 Update `stripe:webhooks:verify` or its docs if current output does not clearly cover catalog events needed for price propagation.
- [ ] 5.8 Ensure all new diagnostics redact Stripe object IDs, endpoint IDs, API errors, and secrets according to existing redaction policy.
- [ ] 5.9 Document the researched platform pattern: CMS edits presentation, Stripe/commerce owns Price Authority, webhooks update local read models, and reconciliation is current-state based.

## 6. UAT Proof Path

- [ ] 6.1 Run `pnpm stripe:webhooks:verify --env uat` and record redacted result in local notes or change evidence without committing secrets.
- [ ] 6.2 In Stripe test mode, create a replacement Price for one safe UAT Store Item variant with correct app metadata or lookup key.
- [ ] 6.3 Archive or deactivate the stale matching Price so only one active Price identifies the variant.
- [ ] 6.4 Observe Worker logs for a safe `catalog_reconciled` webhook outcome for `price.created` or `price.updated`.
- [ ] 6.5 Read the public Store Offer endpoint for the item and confirm the updated display price and checkout readiness.
- [ ] 6.6 Run `pnpm stripe:catalog:verify --env uat` in day-to-day verification mode and confirm the valid Dashboard replacement Price is not rejected because generated Desired Price is stale.
- [ ] 6.7 Run the relevant UAT Stripe smoke path and confirm hosted Checkout displays the updated amount/currency before payment submission.
- [ ] 6.8 Repair the UAT test catalog back to the intended accepted test price if the manual replacement Price was diagnostic-only.
- [ ] 6.9 Simulate or observe a failed webhook reconciliation followed by Stripe retry and confirm the event is not skipped as an already-processed duplicate.

## 7. PRD Gate and Safety

- [ ] 7.1 Confirm price propagation tooling reports PRD as disabled, not configured, or readiness-only while `PRD_OPEN_GATE` is absent.
- [ ] 7.2 Confirm no implementation path mutates Stripe live mode, PRD D1, live checkout state, or PRD runtime webhook read models before the PRD-open gate.
- [ ] 7.3 Document the PRD go-live checklist for later: PRD webhook endpoint, PRD Worker `STRIPE_WEBHOOK_SECRET`, PRD Stripe restricted users, PRD catalog verification, and PRD smoke evidence.
- [ ] 7.4 Ensure UAT evidence cannot be presented as PRD price propagation acceptance.
- [ ] 7.5 Add tests or config assertions proving PRD catalog webhook delivery is no-mutation/readiness-only before `PRD_OPEN_GATE=open`.

## 8. Validation

- [ ] 8.1 Run targeted backend catalog-sync tests.
- [ ] 8.2 Run targeted backend webhook route/acknowledgement tests.
- [ ] 8.3 Run targeted Store Offer and checkout tests.
- [ ] 8.4 Run targeted web Store Offer price display tests if frontend cache behavior changes.
- [ ] 8.5 Run `pnpm test:unit`.
- [ ] 8.6 Run `pnpm check`.
- [ ] 8.7 Run `pnpm build`.
- [ ] 8.8 Run `pnpm openspec -- validate stripe-dashboard-price-webhook-propagation --type change --strict`.
- [ ] 8.9 Run `pnpm openspec -- validate --all --strict`.
