## 1. Planning and Completed Prerequisites

- [x] 1.1 Create `design.md`, reconcile proposal/spec/tasks, and strict-validate the complete planning graph.
- [x] 1.2 Record archived `site-performance-program` and its accepted measurement commits.
- [x] 1.3 Record archived `align-cloudflare-environment-names` and its accepted environment proof.
- [x] 1.4 Record archived Decap redesign and accepted editorial proof.
- [x] 1.5 Record archived Holding Page/domain handoff and verified rollback evidence.
- [x] 1.6 Record archived operator Access/JWT allow-and-deny proof.
- [x] 1.7 Record archived production-control refactor and independent-control proof.
- [x] 1.8 Record the completed Sveltia migration, exact-commit UAT/PRD deployments, hosted smoke, and designated-account no-publish acceptance as the current editorial prerequisite.

## 2. Non-Stripe Readiness

- [x] 2.1 Build one exact commit, run the bundle graph check, and store raw performance output under ignored `.codex-artifacts/runtime-performance/<commit>/`.
- [x] 2.2 Run the documented desktop cold, mobile stress, wide scroll, mobile scroll, and legacy Store/Distro profiles.
- [ ] 2.3 Use Browser Use to verify Store rendering, first/repeat traversal, navigation, overlays, player lifecycle, mobile layout, accessibility, and console cleanliness.
- [x] 2.4 Verify one listing-price projection request per Store activation, zero per-card Store Offer reads, and zero Store 5xx responses.
- [x] 2.5 Record a no-action result when gates pass, or plan, fix, validate, and archive one bounded performance child for a reproducible application-attributable failure.
- [ ] 2.6 Implement and locally validate `fix-stripe-checkout-creation`, `fix-paid-order-reconciliation`, and `make-operator-stock-writes-atomic`; record focused regressions for all six code findings before hosted commerce acceptance. Atomic-stock correction archival uses accepted local D1/browser proof; its protected PRD acceptance remains task 4.9. Provider-dependent acceptance and archival remain section 3 work.
- [ ] 2.7 Inventory public selling information and obtain approved shipping timing/rates, return/refund process, support contact, and privacy wording; publish missing information with accessible Store/checkout/footer links and Browser Use proof. Do not invent business or legal terms. Shared local VAT/delivery evidence: [child evidence](../greek-vat-and-shipping-charges/evidence.md); external acceptance remains open.
- [ ] 2.8 Complete `greek-vat-and-shipping-charges` using the 2026-09-11 decisions: current Stripe account seller/business authority, existing prices inclusive of VAT, Stripe Tax, verified Stripe-connected fiscal/filing services and manual Greek BOX NOW at €2.50 Small / €3.50 Medium gross selected by measured cart packing. Local work may use synthetic fixtures; actual account configuration, packing and fiscal/myDATA/filing coverage must be evidenced before acceptance. Reuse the child's proof for 2.7, 2.9 and 3.8; verify advertised receipts and fiscal delivery rather than assuming Dashboard defaults.
- [ ] 2.9 Write the manual operations runbook: paid/review/failed-delivery checks, Greek BOX NOW destination/shipment handoff, duplicate-safe dispatch recording, Dashboard refunds, and returned-stock reconciliation, with an owner for each step. Shared local VAT/delivery evidence: [child evidence](../greek-vat-and-shipping-charges/evidence.md); external acceptance remains open.

## 3. New Stripe Account Test-Mode Closure

- [ ] 3.1 Obtain new-account test access, approved secret-store credentials, and approved UAT email recipients before any paid test can trigger delivery; keep secrets, private recipients, and full Stripe IDs out of Git.
- [ ] 3.2 Complete, strict-validate, sync, and archive `stabilize-store-listing-prices` against the new account's test mode.
- [ ] 3.3 On one corrected UAT commit, prove provider-valid expiry, accepted/rejected custom-Price carts, and reservation settlement/expiry/replay; include paid-reconciliation corrections and link shared evidence once. Reference the atomic-stock local D1 operator/checkout race proof; protected staff flows are PRD-only and belong to 4.9.
- [ ] 3.4 Prove differing billing/shipping, delayed confirmation, failed webhook resend, and durable shortage review on that tree; exercise immediate delivery and controlled scheduled recovery only with approved recipients.
- [ ] 3.5 Complete the remaining `add-paid-order-delivery-outbox` delivery-kind, idempotency, and recovery acceptance using the shared proof; rerun only missing or affected checks.
- [ ] 3.6 Strict-validate, sync, and archive provider-dependent checkout-creation work, then reservations, then the outbox after each change's evidence passes; reference the locally accepted atomic-stock archive. Archival does not require another payment or deployment of unchanged code.
- [ ] 3.7 Strict-validate, sync, and archive `fix-paid-order-reconciliation` after the shared reservation/outbox proof; link the accepted evidence and single manual exception procedure.
- [ ] 3.8 Rehearse the complete new-account test purchase and manual fulfillment/refund handoff with approved recipients and test data; verify advertised totals, receipt behavior, dispatch record, and returned-stock procedure without claiming a physical shipment was tested unless one was actually performed. Shared local VAT/delivery evidence: [child evidence](../greek-vat-and-shipping-charges/evidence.md); external acceptance remains open.

## 4. Live Stripe and PRD Preparation While Checkout Is Closed

- [ ] 4.1 Prepare the PRD configuration and final-origin artifact settings while checkout and apex cutover remain closed; freeze the launch commit only after source/configuration/generation changes finish in 4.6.
- [ ] 4.2 Keep `PRD_LAUNCH_APPROVED` absent and `native_checkout_enabled=false`; verify capabilities report disabled and checkout creation rejects before provider work.
- [ ] 4.3 Create live Products/Prices, Payment Method Configuration, and the production webhook endpoint using API version `2026-08-26.dahlia`; store secrets only in approved stores.
- [ ] 4.4 Apply PRD D1 migrations and readiness seed, then configure live price mappings without copying UAT rows, test objects, synthetic stock, or UAT evidence.
- [ ] 4.5 Add the existing paid-delivery `*/15 * * * *` Cron explicitly to the PRD environment in `apps/backend/wrangler.jsonc`; configure Resend, Access trust, Worker bindings, checkout origins, and permanent Greece-only delivery. Reuse the current scheduled handler, bounded processor, and outbox.
- [ ] 4.6 Finish source/configuration/generation changes, pin catalog images to the reachable PRD asset host through the existing override, and record the accepted artifact SHA/environment. Run catalog promotion from that commit with `target=prd` and one applicable confirmation: workflow `confirm_live_catalog_changes=true` or direct CLI `--confirm-live-catalog-changes`.
- [ ] 4.7 Deploy that commit's Worker and static artifacts to technical PRD origins; verify final canonical metadata, reachable catalog/email images while the apex still serves Holding Page, the technical/apex return allowlist, catalog, webhook, D1, Access, Cron, and configuration with checkout closed.
- [ ] 4.8 Verify the committed and deployed PRD Cron configuration plus an observed scheduled invocation with correct PRD bindings; attach the same handler's controlled transient-failure recovery proof from UAT. Do not seed fake production paid orders or send unapproved emails; inspect actual live-smoke delivery only after 6.3 authorization.
- [ ] 4.9 After deploying the revision migration and matching Worker/staff code with checkout closed, use native Browser Use on `staff.blackboxrecordsathens.com` to prove Access allow/deny, an approved real-stock adjustment and recount, stale-recount 409 with retained count/notes, and explicit reassessment. Verify matching D1 audit entries and reference local D1 race/rollback evidence; do not manufacture production sales or synthetic stock. This protected PRD proof is required before launch sign-off despite the atomic-stock correction's local archival.

## 5. Exact-Tree Acceptance

- [ ] 5.1 Run `pnpm install --frozen-lockfile` and verify no incompatible peer or engine warnings.
- [ ] 5.2 Regenerate Prisma and OpenAPI/client artifacts twice and verify deterministic output.
- [ ] 5.3 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm audit:unused`, `pnpm audit:commerce-boundaries`, and `pnpm performance:bundles`.
- [ ] 5.4 Strict-validate every remaining active OpenSpec change, search for retired controls and stale origins, run `git diff --check`, and review the final worktree.
- [ ] 5.5 Use Browser Use on technical PRD origins for navigation, Store, disabled-checkout rejection, operator access, overlays, player, mobile layout, and console/network cleanliness. Reference UAT payment/reconciliation proof here; live payment, stock settlement, and delivery checks belong to 6.3 after approval.

## 6. Final Activation and Stability

- [ ] 6.1 Set `native_checkout_enabled=true` while launch approval remains absent and verify checkout stays closed.
- [ ] 6.2 Record completed pre-activation evidence, the prepared final-origin artifacts, and remaining live-smoke/public-routing checks; request the user's sole go/no-go decision.
- [ ] 6.3 After explicit approval, set `PRD_LAUNCH_APPROVED=true` for the accepted Worker code, record that configuration/deployment change, and run one bounded live checkout smoke through the technical return origin; verify actual payment, stock/order settlement, collected Greek shipping, and delivery state.
- [ ] 6.4 On smoke failure, set `native_checkout_enabled=false`, remove launch approval if needed, and leave the apex on the Holding Page.
- [ ] 6.5 On smoke success, repoint the apex from `holding` to the already-verified production artifact without code or generated-asset changes; verify public canonical URLs, checkout return routing, HTTPS, and `www` redirects.
- [ ] 6.6 Keep the Holding Page available as immediate rollback for at least 24 hours and record stability evidence.
- [ ] 6.7 After accepted stability, retire holding-only workflow/source/artifact/branch dependencies, remove holding `noindex` remnants, sync final specs, and archive this change.
