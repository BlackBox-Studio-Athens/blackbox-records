Implement before the hosted EmDash migration. Follow the apply-change workflow continuously through all 22 tasks, as requested by the user. Stay in the main worktree on `main`; run `pnpm openspec:guard` before prepared work. Every completed behavior-changing section requires `pnpm test:unit`, `pnpm check`, and `pnpm build` on its final tree. Record exact revisions, checks, and outstanding account/approval needs in the handoff; do not mark hosted work complete from local evidence.

## 1. Reconcile the baseline and capture the current release contract

- [x] 1.1 Verify the completed `replace-catalog-promotion` implementation and synchronize its deltas using the sync-specs workflow; verify the effective specs describe Product bindings/default Prices, no bot artifact commits, and non-reset release behavior before applying this change's dependent deltas.
- [x] 1.2 Inventory `.github/workflows/pages.yml`, dependent smoke/holding workflows, environment profiles, actual UAT/PRD projects/origins, and secret binding names without values; deliver a redacted before/after environment matrix consistent with `design.md`.
- [x] 1.3 Add focused workflow contract tests for main-push UAT-only behavior, explicit PRD candidate selection, and independent launch/catalog gates; verify the tests fail against the old automatic-PRD or mutable-HEAD paths, then implement the initial request guards so the section passes. Verified artifact consumption, stale-candidate rechecks, and full promotion remain section 3 work.
- [x] 1.4 Inspect active go-live and validation changes for overlapping hosting assumptions; update only affected planning artifacts with the update-change workflow and verify unrelated task status, approvals, and historical evidence are unchanged.

## 2. Establish matching Cloudflare hosting

- [x] 2.1 Add the dedicated UAT Pages target to the existing environment profile and keep hosted base `/` with canonical Local `/blackbox-records/`; verify URL/profile tests cover distinct UAT/PRD backend origins and unchanged local launcher URLs.
- [ ] 2.2 Resolve and provision the intended UAT Pages project through authorized account operations, or record missing account access as outstanding; verify the actual project ID/origin and target credential scope before committing non-secret configuration.
- [x] 2.3 Update UAT checkout-return/CORS allowlists, media/catalog origins, sitemap/robots, temporary Sveltia site configuration, and smoke defaults through existing helpers; verify no active UAT path resolves to PRD or the retired GitHub Pages origin.
- [x] 2.4 Apply matching static cache/redirect policy and preserve exact UAT Review Site Marker behavior; verify target artifact tests cover HTML revalidation, fingerprinted assets, marker presence in UAT, and marker absence in Local/PRD/holding.

## 3. Implement candidate review and explicit promotion

- [x] 3.1 Refactor the canonical release workflow so relevant main pushes verify/build/deploy UAT only while retaining documentation-only exclusions and manual dispatch; verify workflow tests reject any push-triggered PRD deployment or live catalog apply.
- [x] 3.2 Produce paired UAT/PRD public artifacts and compatible backend artifacts from one SHA, extending existing evidence with digests and non-secret target configuration; verify artifact handoff tests reject mixed SHAs, missing artifacts, and target-variable leakage.
- [x] 3.3 Add manual PRD promotion of an exact successful candidate SHA/run with false-by-default code confirmation; verify wrong repository/workflow, untrusted revision, stale candidate, expired artifact, and changed configuration all stop before mutation.
- [x] 3.4 Preserve bounded non-cancelling target mutation locks and candidate/target rechecks; verify overlapping-run tests cannot deploy an older candidate after newer accepted state or cancel an in-progress provider mutation.
- [x] 3.5 Keep migrations, backend readiness, static deployment, and one canonical provider-smoke invocation ordered with revision-bound results; verify partial-failure tests report the actual mixed backend/frontend state and never reset stock or provider objects.
- [x] 3.6 Preserve PRD Holding Page isolation and independent code, catalog, launch, and checkout controls; verify a confirmed disabled-PRD code promotion cannot switch the apex or enable checkout.

## 4. Prove UAT and retire the old deployment path

- [ ] 4.1 Deploy the verified candidate to the new authorized UAT target; verify its exact revision with public-route, asset, cache, metadata, redirect, and checkout-return smoke evidence under the existing Smoke Harness.
- [ ] 4.2 Run the existing fixed-price and pay-what-you-want Stripe UAT paid scenarios plus newsletter smoke against the new origin; verify signed webhook processing, D1 outcomes, UAT email sink routing, and absence of PRD effects.
- [ ] 4.3 Browser-review representative mobile/desktop direct routes, shell navigation, player persistence, overlays, cart, and Review Site Marker; verify no origin/base change breaks behavior or layout.
- [ ] 4.4 Retire GitHub Pages deployment jobs/permissions/triggers only after new UAT acceptance; verify active workflows and smoke defaults have one canonical UAT public target, preserving historical artifacts without another writable deployment path.

## 5. Handoff and final verification

- [x] 5.1 Document the short workflow “commit → review UAT → explicitly promote this candidate” and artifact-expiry recovery in `README.md` and affected runbooks/agent guidance; verify commands, actual URLs, and all gate names match implementation.
- [ ] 5.2 Exercise failed/stale promotion and compatible application rollback in UAT; deliver evidence that recovery preserves D1 stock, reservations, and orders and that no atomic multi-provider rollback is claimed.
- [ ] 5.3 If separately authorized, exercise promotion to the disabled PRD readiness target with no live catalog mutation; verify exact candidate/artifact identity and unchanged launch gates, otherwise leave this hosted acceptance task explicitly outstanding.
- [ ] 5.4 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, relevant boundary/environment/workflow checks, and `pnpm openspec -- validate align-cloudflare-uat-and-release-promotion --strict`; verify the exact final tree and deliver the accepted UAT URL, promotion runbook, rollback references, and prerequisite status for the EmDash implementer.
