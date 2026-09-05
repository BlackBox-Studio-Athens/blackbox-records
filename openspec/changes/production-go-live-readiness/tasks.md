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

- [ ] 2.1 Build one exact commit, run the bundle graph check, and store raw performance output under ignored `.codex-artifacts/runtime-performance/<commit>/`.
- [ ] 2.2 Run the documented desktop cold, mobile stress, wide scroll, mobile scroll, and legacy Store/Distro profiles.
- [ ] 2.3 Use Browser Use to verify Store rendering, first/repeat traversal, navigation, overlays, player lifecycle, mobile layout, accessibility, and console cleanliness.
- [ ] 2.4 Verify one listing-price projection request per Store activation, zero per-card Store Offer reads, and zero Store 5xx responses.
- [ ] 2.5 Record a no-action result when gates pass, or plan, fix, validate, and archive one bounded performance child for a reproducible application-attributable failure.

## 3. New Stripe Account Test-Mode Closure

- [ ] 3.1 Obtain access to the new Stripe account and approved test/live credentials through secret stores without committing secrets or full Stripe IDs.
- [ ] 3.2 Complete, strict-validate, sync, and archive `stabilize-store-listing-prices` against the new account's test mode.
- [ ] 3.3 Complete, strict-validate, sync, and archive `add-checkout-stock-reservations` against the same accepted test-mode commit.
- [ ] 3.4 Obtain approved UAT email recipients without committing private recipient data.
- [ ] 3.5 Complete, strict-validate, sync, and archive `add-paid-order-delivery-outbox` with immediate and controlled-retry proof.

## 4. Live Stripe and PRD Preparation While Checkout Is Closed

- [ ] 4.1 Select one exact launch commit SHA to own static build, Worker, catalog, migrations, tests, evidence, approval, and cutover.
- [ ] 4.2 Keep `PRD_LAUNCH_APPROVED` absent and `native_checkout_enabled=false`; verify capabilities report disabled and checkout creation rejects before provider work.
- [ ] 4.3 Create live Products/Prices, Payment Method Configuration, and the production webhook endpoint using API version `2026-08-26.dahlia`; store secrets only in approved stores.
- [ ] 4.4 Apply PRD D1 migrations and readiness seed, then configure live price mappings without copying UAT rows, test objects, synthetic stock, or UAT evidence.
- [ ] 4.5 Configure paid-delivery Cron, Resend, Access trust, Worker bindings, checkout origins, and permanent Greece-only delivery.
- [ ] 4.6 Run catalog promotion for the exact artifact commit with `target=prd`, `confirm_live_catalog_changes=true`, and direct CLI confirmation.
- [ ] 4.7 Deploy the exact Worker and static artifacts to technical PRD origins; verify catalog, webhook, D1, Access, Cron, and runtime configuration while checkout remains closed.

## 5. Exact-Tree Acceptance

- [ ] 5.1 Run `pnpm install --frozen-lockfile` and verify no incompatible peer or engine warnings.
- [ ] 5.2 Regenerate Prisma and OpenAPI/client artifacts twice and verify deterministic output.
- [ ] 5.3 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm audit:unused`, `pnpm audit:commerce-boundaries`, and `pnpm performance:bundles`.
- [ ] 5.4 Strict-validate every remaining active OpenSpec change, search for retired controls and stale origins, run `git diff --check`, and review the final worktree.
- [ ] 5.5 Use Browser Use on technical PRD origins for navigation, Store, live Checkout, Greece-only rejection, operator access, stock/order reconciliation, delivery state, overlays, player, mobile layout, and console/network cleanliness.

## 6. Final Activation and Stability

- [ ] 6.1 Set `native_checkout_enabled=true` while launch approval remains absent and verify checkout stays closed.
- [ ] 6.2 Record final exact-tree evidence and request the user's sole go/no-go decision.
- [ ] 6.3 After explicit approval, set `PRD_LAUNCH_APPROVED=true`, deploy the accepted Worker configuration, and run one bounded live checkout smoke.
- [ ] 6.4 On smoke failure, set `native_checkout_enabled=false`, remove launch approval if needed, and leave the apex on the Holding Page.
- [ ] 6.5 On smoke success, atomically update full-site origins, repoint the apex from `holding` to production `main`, and verify HTTPS plus `www` redirects.
- [ ] 6.6 Keep the Holding Page available as immediate rollback for at least 24 hours and record stability evidence.
- [ ] 6.7 After accepted stability, retire holding-only workflow/source/artifact/branch dependencies, remove holding `noindex` remnants, sync final specs, and archive this change.
