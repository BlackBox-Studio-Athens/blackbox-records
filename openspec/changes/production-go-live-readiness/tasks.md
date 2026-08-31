## 1. Close Planning and Implementation Prerequisites

- [ ] 1.1 Create the missing `design.md` through the OpenSpec artifact workflow, resolve any decision-changing question, and verify `pnpm openspec -- status --change production-go-live-readiness --json` reports planning complete before implementation begins.
- [ ] 1.2 Verify `site-performance-program`, `align-cloudflare-environment-names`, `stabilize-store-listing-prices`, `redesign-decap-editor-experience`, and `publish-prd-holding-page` are complete and archived; record the accepted commits plus redacted Decap and holding-domain handoff evidence.
- [ ] 1.3 Verify `verify-operator-access-jwt`, `add-checkout-stock-reservations`, and `add-paid-order-delivery-outbox` are complete and archived; record UAT proof for verified operator identity, one-unit checkout concurrency/replay safety, and immediate plus scheduled paid-delivery recovery.
- [ ] 1.4 Remeasure Store performance after commerce consolidation and verify either the current gates pass with a recorded no-action decision or one bounded performance child is complete and archived; no performance child may remain active at launch.

## 2. Define the Production Gate

- [ ] 2.1 Name final go/no-go reviewers and approval checkpoints; verify each gate has one accountable reviewer and recorded decision field.
- [ ] 2.2 Document native-commerce emergency disable, full-site rollback to the verified PRD Holding Page, and later holding retirement; verify rollback does not require new infrastructure or expose secrets.
- [ ] 2.3 Confirm the final PRD domain, canonical URLs, checkout return origins, email brand URLs, catalog asset origins, and Worker routing as one atomic cutover model; verify shipping remains permanently limited to `GR` with no non-Greece provider or quote path.

## 3. Collect External Production Evidence

- [ ] 3.1 Capture live Stripe Products/Prices, Payment Method Configuration, and webhook evidence without committing secrets or full account-specific IDs; verify every approved launch item maps to live provider ownership.
- [ ] 3.2 Configure and verify PRD Worker secrets, D1 binding, migrations, seed/mapping data, webhook endpoint, and paid-delivery Cron while checkout remains closed; verify redacted preflight output and no incompatible legacy rows.
- [ ] 3.3 Verify the production operator hostname and Cloudflare Access policy enforce the archived JWT boundary before any internal read or mutation; record allowlisted success and forged/missing-assertion denial without storing identity secrets.
- [ ] 3.4 Confirm the launch catalog artifact commit is generated from Decap/repo content that passed UAT proof; verify no UAT D1 rows, Stripe test objects, synthetic stock, or UAT evidence are copied into PRD.
- [ ] 3.5 Define and verify each launch Store Item's live price authority, first-publication stock readiness, PRD D1 readiness rows, and permanent Greece-only fulfillment before `PRD_OPEN_GATE=open` can exist.

## 4. Execute and Review Launch

- [ ] 4.1 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, required audits, and strict OpenSpec validation against the exact launch tree; verify every command passes before provider or DNS cutover.
- [ ] 4.2 Verify generated PRD catalog readiness artifacts are non-empty for approved launch items and reference PRD asset URLs rather than UAT asset URLs.
- [ ] 4.3 Record Browser Use acceptance for public navigation, live checkout, permanent `GR` rejection behavior, operator access, order/stock reconciliation, paid-delivery immediate/retry state, mobile layout, and console/network cleanliness on the approved launch configuration.
- [ ] 4.4 Record named go approval, deploy the exact accepted full PRD artifact, update all full-site origins together, repoint the apex from the holding branch to production `main`, and verify the holding branch remains the immediate rollback target during the stability window.
- [ ] 4.5 After named stability acceptance, retire the holding workflow/source/artifact/branch dependencies and obsolete rules, verify full-site metadata has no holding-only `noindex`, then record the final result and archive this change.
