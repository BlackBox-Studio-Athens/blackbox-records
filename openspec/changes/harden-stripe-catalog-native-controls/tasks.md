## 1. Current-State Audit

- [ ] 1.1 Inspect `createStripeCatalogLookupKey()` and `createStripeCatalogMetadata()` and record the current lookup-key and metadata identity contract.
- [ ] 1.2 Inspect `CatalogReconciler.reconcileVariant()` candidate resolution and confirm it uses current Stripe list/retrieve paths by lookup key, metadata, and D1 mapping.
- [ ] 1.3 Inspect `StripeCatalogGatewayClient` create/update/archive paths and record every mutating Stripe API call plus its current idempotency context.
- [ ] 1.4 Inspect `scripts/stripe-catalog-verify.ts` report formatting and identify where safe correlation fields can be added without printing full provider IDs.
- [ ] 1.5 Inspect scheduled catalog verification logs and confirm UAT remains report-only with no Product/Price mutation path.
- [ ] 1.6 Inspect existing redaction helpers and report tests to reuse the current Stripe ID redaction policy.
- [ ] 1.7 Inspect active `stripe-dashboard-price-webhook-propagation` change before implementation and avoid duplicating its webhook propagation scope.

## 2. Stripe Identity and Orphan Detection

- [ ] 2.1 Add tests for canonical Price lookup key format `blackbox:{environment}:{storeItemSlug}:{variantId}` across UAT and PRD.
- [ ] 2.2 Add tests for required Product and Price metadata keys: `appEnv`, `sourceId`, `sourceKind`, `storeItemSlug`, and `variantId`.
- [ ] 2.3 Add tests for missing, malformed, and foreign-environment identity on Prices and Products.
- [ ] 2.4 Add tests proving `blackbox:sandbox:*` identity is reported as legacy or foreign drift during UAT verification, not accepted as current UAT catalog state.
- [ ] 2.5 Add a catalog verifier path that classifies BlackBox-owned active Prices outside the current expected Store Item catalog as owned-orphan drift.
- [ ] 2.6 Add a catalog verifier path that classifies active owned Products without a current expected Store Item as owned-orphan drift when ownership can be proven.
- [ ] 2.7 Ensure objects whose ownership cannot be proven are reported or ignored safely, but never mutated by cleanup apply.
- [ ] 2.8 Confirm deterministic Product IDs are not introduced for existing Products; document any fresh-create-only Product ID decision if implementation touches Product create inputs.
- [ ] 2.9 Keep current-state reconciliation authority on Stripe list/retrieve paths; if Stripe Search is added, constrain it to diagnostics, drift discovery, or backfill.
- [ ] 2.10 Add a regression check that catalog Price creation uses an existing Product ID when one has been resolved and does not send `product_data` accidentally.
- [ ] 2.11 Add a regression check that any future `default_price_data` Product create path is classified as combined Product/Price creation and still applies normal identity/idempotency checks.

## 3. Idempotency and Mutation Safety

- [ ] 3.1 Extract or expose one shared catalog idempotency key builder enough to unit test it without broad rewrites.
- [ ] 3.2 Add tests proving the same logical catalog mutation produces the same idempotency key.
- [ ] 3.3 Add tests proving changed amount, currency, Product Projection, repair target, or action purpose changes the idempotency key identity.
- [ ] 3.4 Add tests for child Stripe mutation contexts such as Product create/update, Price create/update, restore, and lookup-key release.
- [ ] 3.5 Add a 255-character length guard for generated Stripe idempotency keys.
- [ ] 3.6 Add a request-shape fingerprint over the Stripe write parameters that define each logical Product/Price mutation.
- [ ] 3.7 Confirm retry behavior still searches existing Prices by lookup key/metadata before creating a new Product/Price.
- [ ] 3.8 Confirm scheduled verification cannot mutate Stripe even though idempotency helpers exist.
- [ ] 3.9 Document that Stripe idempotency is retry protection, not long-term audit storage, actor attribution, or an independent-run lock.
- [ ] 3.10 Decide whether Stripe SDK retry behavior remains manual/implicit or becomes explicitly configured; document the decision.
- [ ] 3.11 Add tests or diagnostics for request ID and replay-status capture when Stripe exposes them.

## 4. Reports, Logs, and Forensics Handles

- [ ] 4.1 Extend catalog dry-run output with planned action kind, Product Environment, `storeItemSlug`, `variantId`, lookup key, and safe drift classification.
- [ ] 4.2 Extend catalog apply output with action kind, Product Environment, `storeItemSlug`, `variantId`, lookup key, idempotency key or stable idempotency hash, request ID when available, replay status when available, and redacted Stripe IDs when available.
- [ ] 4.3 Add owned-orphan summary counts to catalog verification reports.
- [ ] 4.4 Add report tests proving secrets, raw provider payloads, full `prod_...`, full `price_...`, full `evt_...`, and full webhook endpoint IDs are omitted or redacted.
- [ ] 4.5 Add scheduled verification log tests or assertions for summary drift counts by Product Environment without per-healthy-variant log spam.
- [ ] 4.6 Ensure report output gives maintainers enough handles to search Stripe Workbench request logs and Events.
- [ ] 4.7 Keep local evidence files ignored if any full provider IDs are needed for one-off operator proof.

## 5. Operator Documentation

- [ ] 5.1 Update `docs/stripe-sandbox-uat.md` with a Stripe Workbench/Event forensics runbook for unexpected Product/Price recreation.
- [ ] 5.2 Document exact fields to capture before cleanup: timestamp, event type, redacted Product/Price ID, lookup key, metadata identity, `api_version`, `request.id`, `request.idempotency_key`, API key label when visible, source, endpoint, method, IP when visible, and status.
- [ ] 5.3 Document Stripe Events API 30-day full-payload access limit and the need to keep local ignored evidence/report exports for older investigations.
- [ ] 5.4 Document that Stripe Search is diagnostic/backfill tooling and does not replace current-state checkout reconciliation.
- [ ] 5.5 Document that Product IDs stay Stripe-generated for existing catalog objects unless a future full recreate explicitly adopts deterministic Product IDs.
- [ ] 5.6 Document cleanup order: verify dry-run, capture forensics fields, classify ownership/environment, apply cleanup only to confirmed owned objects, rerun verification.
- [ ] 5.7 Cross-link the active Dashboard price-change/webhook propagation docs so operators do not confuse price replacement with orphan cleanup.
- [ ] 5.8 Document Workbench starting filters for catalog recreation incidents: `POST /v1/products`, `POST /v1/prices`, `product.created`, `price.created`, `product.*`, and `price.*`.

## 6. UAT Proof Path

- [ ] 6.1 Run `pnpm stripe:catalog:verify --env uat` and confirm the report includes current expected catalog state and no provider mutations.
- [ ] 6.2 Create or identify a harmless UAT-owned orphan in Stripe test mode only if needed for proof, then verify owned-orphan reporting.
- [ ] 6.3 Use Stripe Workbench or Dashboard Events to locate the related event/request and confirm report fields are enough for correlation.
- [ ] 6.4 Run cleanup dry-run and confirm it refuses unclassified or foreign-environment objects.
- [ ] 6.5 Run cleanup apply only after reviewed dry-run output and only in UAT Stripe test mode.
- [ ] 6.6 Rerun `pnpm stripe:catalog:verify --env uat` and confirm current active catalog only.
- [ ] 6.7 Probe at least one UAT Store Offer endpoint and confirm checkout readiness still comes from current Stripe/D1 state.

## 7. Validation

- [ ] 7.1 Run targeted backend catalog-sync tests.
- [ ] 7.2 Run targeted Stripe catalog gateway/report formatter tests.
- [ ] 7.3 Run targeted scheduled catalog verification tests.
- [ ] 7.4 Run any docs or redaction tests added by this change.
- [ ] 7.5 Run `pnpm test:unit`.
- [ ] 7.6 Run `pnpm check`.
- [ ] 7.7 Run `pnpm build`.
- [ ] 7.8 Run `pnpm openspec -- validate harden-stripe-catalog-native-controls --type change --strict`.
- [ ] 7.9 Run `pnpm openspec -- validate --all --strict`.
