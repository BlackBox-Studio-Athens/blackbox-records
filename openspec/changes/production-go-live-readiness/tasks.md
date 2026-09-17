## 1. Planning and Completed Prerequisites

- [x] 1.1 Create `design.md`, reconcile proposal/spec/tasks, and strict-validate the complete planning graph.
- [x] 1.2 Record archived `site-performance-program` and its accepted measurement commits.
- [x] 1.3 Record archived `align-cloudflare-environment-names` and its accepted environment proof.
- [x] 1.4 Record archived Decap redesign and accepted editorial proof.
- [x] 1.5 Record archived Holding Page/domain handoff and verified rollback evidence.
- [x] 1.6 Record archived operator Access/JWT allow-and-deny proof.
- [x] 1.7 Record archived production-control refactor and independent-control proof.
- [x] 1.8 Record Sveltia acceptance as historical evidence, superseded by completed EmDash cutover and accepted-snapshot publication. Current receipts are in `docs/cms-cutover.md`, `docs/content-publication.md` and the completed migration/publication change tasks; do not restore the retired editor or deploy path.

## 2. Non-Stripe Readiness

- [x] 2.1 Build one exact commit, run the bundle graph check, and store raw performance output under ignored `.codex-artifacts/runtime-performance/<commit>/`.
- [x] 2.2 Run the documented desktop cold, mobile stress, wide scroll, mobile scroll, and legacy Store/Distro profiles.
- [ ] 2.3 Use Browser Use to verify Store rendering, first/repeat traversal, navigation, overlays, player lifecycle, mobile layout, accessibility, and console cleanliness.
- [x] 2.4 Verify one listing-price projection request per Store activation, zero per-card Store Offer reads, and zero Store 5xx responses.
- [x] 2.5 Record a no-action result when gates pass, or plan, fix, validate, and archive one bounded performance child for a reproducible application-attributable failure.
- [x] 2.6 Reconcile implemented correction evidence: checkout creation and atomic stock are archived under `2026-09-09-*`; paid reconciliation records completed local correction/regression tasks. Preserve their actual validation limits and source references. Current account/provider checks remain section 3; protected PRD stock/order checks remain 4.9.
- [ ] 2.7 Accept approved selling/privacy content and its authorized publication through [complete-shopper-purchase-information](../complete-shopper-purchase-information/tasks.md) ([coverage and local verification](../complete-shopper-purchase-information/evidence.md)), the single implementation owner for seller/support, shipping timing, returns/refunds, privacy and Store/checkout/footer placement. Reuse its coverage and Browser Use proof instead of implementing these surfaces again. Rates and monetary acceptance remain with the VAT child: [shared evidence](../greek-vat-and-shipping-charges/evidence.md). Do not invent business or legal terms; external acceptance remains open.
- [ ] 2.8 Complete `greek-vat-and-shipping-charges` using the 2026-09-11 decisions: current Stripe account seller/business authority, existing prices inclusive of VAT, Stripe Tax, verified Stripe-connected fiscal/filing services and manual Greek BOX NOW at €2.50 Small / €3.50 Medium gross selected by measured cart packing. Local work may use synthetic fixtures; actual account configuration, packing and fiscal/myDATA/filing coverage must be evidenced before acceptance. Reuse the child's proof for 2.7, 2.9 and 3.8; verify advertised receipts and fiscal delivery rather than assuming Dashboard defaults.
- [ ] 2.9 Review the existing `docs/commerce-operations.md`, assign missing owners and rehearse paid/review/failed-delivery checks through Orders, manual BOX NOW handoff, duplicate-safe private dispatch recording, Dashboard refunds and returned-stock reconciliation through Stock. Do not create another runbook or imply Orders tracks dispatch. External operational/fiscal acceptance remains open.

## 3. New Stripe Account Test-Mode Closure

- [ ] 3.1 Obtain new-account test access, approved secret-store credentials, and approved UAT email recipients before any paid test can trigger delivery; keep secrets, private recipients, and full Stripe IDs out of Git.
- [ ] 3.2 Reuse archived `2026-09-10-stabilize-store-listing-prices` evidence and prove only missing/affected designated-account default-Price replacement and listing refresh behavior. Do not reopen or rearchive the completed change.
- [ ] 3.3 On one corrected UAT commit, prove provider-valid expiry, accepted/rejected custom-Price carts, and reservation settlement/expiry/replay; include paid-reconciliation corrections and link shared evidence once. Reference the atomic-stock local D1 operator/checkout race proof; protected staff flows are PRD-only and belong to 4.9.
- [ ] 3.4 Prove differing billing/shipping, delayed confirmation, failed webhook resend, and durable shortage review on that tree; exercise immediate delivery and controlled scheduled recovery only with approved recipients.
- [ ] 3.5 Reuse archived `2026-09-10-add-paid-order-delivery-outbox` proof for the implemented delivery kinds, leases and recovery; capture only missing/affected designated-account evidence through the current CommerceRuntime scheduled path.
- [x] 3.6 Record existing archives: `2026-09-09-fix-stripe-checkout-creation`, `2026-09-09-make-operator-stock-writes-atomic`, `2026-09-10-add-checkout-stock-reservations` and `2026-09-10-add-paid-order-delivery-outbox`. Their archival does not close remaining designated-account or PRD checks and requires no duplicate purchases.
- [ ] 3.7 Strict-validate, sync, and archive `fix-paid-order-reconciliation` after the shared reservation/outbox proof; link the accepted evidence and single manual exception procedure.
- [ ] 3.8 Rehearse the complete new-account test purchase and manual fulfillment/refund handoff with approved recipients and test data; verify advertised totals, receipt behavior, dispatch record, and returned-stock procedure without claiming a physical shipment was tested unless one was actually performed. Shared local VAT/delivery evidence: [child evidence](../greek-vat-and-shipping-charges/evidence.md); external acceptance remains open.

## 4. Live Stripe and PRD Preparation While Checkout Is Closed

- [ ] 4.1 Prepare the PRD configuration and final-origin artifact settings while checkout and apex cutover remain closed; freeze the launch commit only after source/configuration/generation changes finish in 4.6.
- [ ] 4.2 Keep `PRD_LAUNCH_APPROVED` absent and `native_checkout_enabled=false`; verify capabilities report disabled and checkout creation rejects before provider work.
- [ ] 4.3 Inventory existing live Product/default-Price bindings and secrets first; create or correct only missing approved resources through current Items/provider commands. Verify Payment Method Configuration, webhook and the application's pinned API version against the accepted candidate. Preserve live amounts and identities; store secrets only in approved stores.
- [ ] 4.4 Verify PRD runtime catalog, retained stock and migration inventory; apply only missing compatible migrations through the current release path. No routine readiness seed or repository-catalog overwrite: exceptional recovery requires its own reviewed plan and one-run confirmation. Never copy UAT runtime/provider state.
- [ ] 4.5 Verify existing PRD `*/5 * * * *` and UAT `*/15 * * * *` schedules, CommerceRuntime forwarding, Resend, Access trust, CMS/public renderer service bindings, checkout origins and Greece-only delivery. Preserve Free-tier/no-KV guards; add no scheduler or paid dependency.
- [ ] 4.6 Finish approved source/configuration changes and select reviewed PRD content revisions through Content/Items. Record code SHA, candidate run, accepted PRD snapshot identity/digest and runtime catalog readiness. Verify technical-origin media/image reachability without retired generated-catalog overrides. Any live catalog mutation retains separate one-run confirmation.
- [ ] 4.7 Promote the reviewed full `artifact_commit_sha` and successful `candidate_run_id` with `confirm_code_promotion=true`, consuming retained renderer, Pages gateway/assets and combined CMS Worker artifacts without rebuilding or detached staff deployment. Refresh expired/content-mismatched candidates through UAT. Verify canonical metadata, media, technical/apex returns, catalog, webhook, D1, Access and Cron with checkout closed; preserve the PRD content pointer and holding branch.
- [ ] 4.8 Verify the committed and deployed PRD Cron configuration plus an observed scheduled invocation with correct PRD bindings; attach the same handler's controlled transient-failure recovery proof from UAT. Do not seed fake production paid orders or send unapproved emails; inspect actual live-smoke delivery only after 6.3 authorization.
- [ ] 4.9 After deploying the revision migration and matching Worker/staff code with checkout closed, use native Browser Use on `staff.blackboxrecordsathens.com` to prove Access allow/deny, an approved real-stock adjustment and recount, stale-recount 409 with retained count/notes, and explicit reassessment. Verify matching D1 audit entries and reference local D1 race/rollback evidence; do not manufacture production sales or synthetic stock. This protected PRD proof is required before launch sign-off despite the atomic-stock correction's local archival.
- [ ] 4.10 Reuse recorded EmDash/publication acceptance and close any remaining editor-safety/publication-status acceptance relevant to the launch candidate. Verify protected Orders reads and Content/Items/Stock navigation, accepted-snapshot public identity, unpublished-draft privacy, no active legacy writer and measured Free-tier budget. Reuse task 4.9 Access proof; inspect populated PRD order details only when real authorized orders exist.

## 5. Exact-Tree Acceptance

- [ ] 5.1 Run `pnpm install --frozen-lockfile` and verify no incompatible peer or engine warnings.
- [ ] 5.2 Regenerate Prisma and OpenAPI/client artifacts twice and verify deterministic output.
- [ ] 5.3 Run `pnpm validate`, `pnpm validate:editor`, required Local publication checks, `pnpm audit:unused`, `pnpm audit:commerce-boundaries` and `pnpm performance:bundles` for the final candidate; inspect compact summaries and retain source fingerprints. Reuse identical accepted evidence where valid; verify canonical CMS build rejects source/generated KV bindings.
- [ ] 5.4 Strict-validate every remaining active OpenSpec change, search for retired controls and stale origins, run `git diff --check`, and review the final worktree.
- [ ] 5.5 Record exact code and accepted PRD snapshot identities; use Browser Use on technical PRD for navigation, Store/search, approved terms/privacy, disabled checkout, protected staff, overlays/player, mobile layout and console/network cleanliness. Verify paired code rollback and separate content rollback procedures preserve commerce history. Reference UAT payment proof; live payment/settlement/delivery remain 6.3. Recheck affected surfaces if code, configuration or accepted content changes.

## 6. Final Activation and Stability

- [ ] 6.1 Set `native_checkout_enabled=true` while launch approval remains absent and verify checkout stays closed.
- [ ] 6.2 Record completed pre-activation evidence, the prepared final-origin artifacts, and remaining live-smoke/public-routing checks; request the user's sole go/no-go decision.
- [ ] 6.3 After explicit approval, set `PRD_LAUNCH_APPROVED=true` for the accepted Worker code, record that configuration/deployment change, and run one bounded live checkout smoke through the technical return origin; verify actual payment, stock/order settlement, collected Greek shipping, and delivery state.
- [ ] 6.4 On smoke failure, set `native_checkout_enabled=false`, remove launch approval if needed, and leave the apex on the Holding Page.
- [ ] 6.5 On smoke success, repoint the apex from `holding` to the already-verified production artifact without code or generated-asset changes; verify public canonical URLs, checkout return routing, HTTPS, and `www` redirects.
- [ ] 6.6 Keep the Holding Page available as immediate rollback for at least 24 hours and record stability evidence.
- [ ] 6.7 After accepted stability, retire holding-only workflow/source/artifact/branch dependencies, remove holding `noindex` remnants, sync final specs, and archive this change.
