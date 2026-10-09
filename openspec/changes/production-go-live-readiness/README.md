# production-go-live-readiness

Track final PRD-open launch gates for native commerce after UAT evidence.

## Accepted execution disposition — 2026-10-09

The owner-authorized execution sequence accepts sandbox-paid proof plus genuine LIVE unpaid application Session inspection and expiry as the launch provider-proof exception. This supersedes earlier wording requiring another final approval round or an actual LIVE purchase/refund before cutover. Technical acceptance, the current UAT provider-proof handoff, PRD promotion, independently accepted PRD content and origin checks still precede activation/routing. Live charge/refund receipt emails, settlement, physical dispatch and the minimum 24-hour stability window remain unobserved; no sandbox result is relabelled as live proof.

The accepted monetary mode is `NO_TAX_COLLECTED`: preserve approved gross item and once-per-order delivery amounts with zero tax collected, no top-up and no exemption or fiscal-compliance claim. The two explicitly assigned assumed LP profiles remain eligible; other unassigned products remain ineligible. Source-bound local evidence is in the [monetary child](../greek-vat-and-shipping-charges/evidence.md). The current 99-row migration map and protected catalog/stock stay intact.

The parent accepted the six-file release-control/origin patch and the no-tax implementation handoff. Both exact private policy drafts are saved pending in their respective CMS workspaces; publication and hosted readback remain separate acceptance steps. The accepted [UAT cleanup receipt](../../../.codex-artifacts/stripe-migration-delegation/uat-order-cleanup-20261009.json) records removal of test orders/deliveries with catalog and stock preserved; do not replay deleted paid events.

Keep `PRD_AVAILABILITY_ALERTS_APPROVED` absent or false. General selling authority does not authorize notifications to retained subscribers. No synthetic PRD withdrawal, receipt or other email is authorized for this proof. Retain immediate checkout stop and the Holding Page rollback target.

The single [commerce operations runbook](../../../docs/commerce-operations.md) covers failed-webhook resend, terminal paid-order review/contact/refund, delivery checks, and manual dispatch. [Archived paid-order correction evidence](../archive/2026-09-22-fix-paid-order-reconciliation/evidence.md) retains its old-account diagnostics and limits. The [accepted Fast UAT result](../../../.codex-artifacts/stripe-migration-delegation/uat-fast-finish-20261008-final.json) now proves the designated-account core repair, signed/replay and two paid cases; broader UAT and exact PRD acceptance remain open. Full migration has resumed under the existing plan and simplified process, with no public launch or live-payment grant. Necessary operating ownership is supplied by the 2026-10-08 private attestation. PRD launch controls remain closed.

## Current owner authority — 2026-10-08

The [migration authority](../migrate-stripe-to-blackboxrecords/evidence.md#owner-decisions--2026-10-08) requests unrestricted selling after actual technical readiness, with no participant/order limit or end date. It supersedes the older restricted-beta access and cap/end requirements. Supplied seller/stock/bank and necessary operating-owner inputs are attestations, kept privately. The approved public draft return address is **Panourgia 1, Athina 104 43 (BlackBox Studio)** and support is **orders@blackboxrecordsathens.com**; accepted content publication remains open.

The owner authorizes the existing assumed vinyl parcel within its supported explicitly assigned product scope; real measurement remains Unknown. Actual Tax evidence and fiscal-provider/myDATA/credit/filing automation are deferred for this uncapped scope, without invented legal identity, registration, accepted rates or compliance. [VAT/delivery implementation](../greek-vat-and-shipping-charges/evidence.md#assumed-prd-packing-implementation--2026-10-08) now supplies two explicit assumed LP assignments and a dated policy reference, with PRD `allowSynthetic=false`; 96 of the 98 October 1 snapshot entries remain unassigned and fresh hosted drift acceptance is open. The remaining provider tax-calculation dependency is distinct from the owner's deferred fiscal evidence. No scope decision or local packing implementation activates checkout, publication or public routing; technical acceptance, live smoke and final activation remain.

## PRD Holding Page handoff — 2026-09-01

- `https://blackboxrecordsathens.com/` serves the isolated PRD Holding Page from the existing Pages `holding` branch; `www` and apex HTTP requests canonicalize to the HTTPS apex with exact-host `308` redirects that preserve path and query.
- Closure deployment run `33521213349` succeeded from `main` SHA `50b3ecbae6618cf96b7a9a620fa290973f03a00a`. Public DNS/TLS, canonical/noindex metadata, desktop/390 px rendering, contact actions, console cleanliness, and holding-only `404` isolation passed.
- Immediate holding rollback removes the two named redirect rules and proxied `www` CNAME; the verified holding branch remains available. Repoint the apex only during an approved full-site cutover or if restoring a recorded prior target.
- This handoff does not satisfy Stripe, PRD Worker, D1, catalog, webhook, provider, full-site custom-domain cutover, go/no-go, holding retirement, or post-launch cleanup gates. Those remain owned by this change.

## Completed prerequisite evidence — 2026-09-02

- Site performance: archived under `2026-08-31-site-performance-program`; accepted measurement commits `8469799f` and `2b96bbd7`. Store was deliberately reserved for the post-commerce remeasurement owned by this change.
- Environment alignment: archived under `2026-08-31-align-cloudflare-environment-names`; accepted completion commit `8a8d5c64`. Local/UAT/PRD naming and the UAT runtime target were verified, and obsolete GitHub environment controls were removed.
- Decap editor predecessor: archived by `50b3ecba`; accepted behavioral commit `55f69d7c`. Static, CMS asset, and CMS admin runs `33513979001`, `33514374291`, and `33514591960` passed, including an owner no-publish walkthrough with no commerce controls exposed. This remains migration history, not the current CMS prerequisite.
- Holding Page/domain handoff: archived by `ec0bfe64`. Closure run `33521213349` passed on source `50b3ecba`, proving apex hosting, HTTPS, exact-host redirects, holding metadata, responsive rendering, console cleanliness, and the retained holding rollback target.
- Operator Access/JWT: archived by `2fd6ab63`. Hosted allowlisted access, verified JWT identity, missing/forged assertion denial, and no-net-mutation checks passed.
- Production controls: implementation commit `42a39a59`, archived by `96a1ef12`. Live catalog confirmation, shopper launch approval, and the runtime checkout feature gate are independent and fail closed.

These references prove completed prerequisites only. They do not authorize Stripe, PRD data, checkout, DNS, or public launch mutations.

## Sveltia editorial prerequisite — 2026-09-05

- Final implementation commit `521f5350e69721f6ee803386f696998bbab43244` passed `pnpm test:cms-admin` with 64 tests, local CMS smoke, unit tests, `pnpm check`, unused-code audit, and `pnpm build`; the secret-free CMS artifact remained disabled.
- Exact-commit UAT workflow run `33930912472` and PRD workflow run `33931491617` succeeded. Hosted `cms_admin` passed 2 checks and `cms_assets` passed 11 checks on both technical origins with zero console or page errors after normal deployment propagation.
- Chrome Browser Use reused the designated authenticated account, loaded the UAT Sveltia Distro collection, and opened the Barren Point editor without saving or publishing. Required fields, existing image, preview, group, format, release date, and order loaded; Save remained disabled.
- The migration is archived at `openspec/changes/archive/2026-09-05-migrate-decap-to-sveltia/` by commit `d42b57cc`. Baseline specifications now define Sveltia as the current CMS and retain Decap only as migration history or an explicit anti-restoration boundary.
- CMS completion authorizes no Stripe, PRD data, checkout, DNS, provider-secret, content-publication, or public-launch mutation. The apex remains on Holding Page.

## Post-commerce Store measurement — 2026-09-02

- Baseline commit `81ce9976` transferred 5,761,330 bytes for Store All and 5,514,396 bytes for Store Distro under the declared mobile-stress profile; median LCP was about 3.26 seconds on both routes.
- Implementation commit `46a78e3f` gives Store Item and Distro Coverflow images the bounded `(min-width: 40rem) 16rem, 56vw` slot while preserving ordinary catalog sizes. Transfer fell to 3,054,690 bytes for Store All and 3,330,724 bytes for Store Distro; median LCP improved to 2.68 and 2.76 seconds respectively.
- Store activation passed three of three runs with 104 cards settled, one listing-price projection, zero per-card Store Offer reads, and zero Store 5xx responses. The static-only local projection remained the expected classified `404`.
- Browser Use passed direct and shell-managed Store All/Distro at desktop and 390 px: bounded images remained visually sharp, Next/Previous and View all/Show Coverflow worked, complete card graphs remained present, focus reset to `MAIN` after shell navigation, and no overflow, blank state, or console warning/error appeared.
- Wide Store traversal passed cleanly. Store Distro still produced isolated first-traversal long-task/layout outliers in wide, mobile, and legacy profiles, and both mobile LCP results remain above the 2.5-second gate.
- Decision: retain the truthful image-slot fix, keep the bounded child active, and do not add loading machinery. The next design revision must test the measured remaining three-eager-cover contention before any implementation changes loading priority.

Raw output is ignored under `.codex-artifacts/runtime-performance/81ce9976/` and `.codex-artifacts/runtime-performance/46a78e3f/`.

## Active-cover priority measurement — 2026-09-03

- Exact implementation commit `9f37b7db` gives only the initial first-viewport Coverflow cover eager/high priority. Coverflow neighbors and every later Distro group remain native-lazy; ordinary non-Coverflow catalogs retain their first-three eager behavior.
- Median mobile-stress LCP improved to 2.460 seconds for Store All and 2.564 seconds for Store Distro. Store All now passes the 2.5-second gate; Store Distro still misses it by 64 milliseconds. Transfer was 3,056,872 bytes and 3,332,843 bytes respectively, and CLS stayed below 0.01 on both routes.
- The remaining Distro LCP element is text (`p.store-orientation-panel__copy`), not Coverflow artwork. Its low TTFB and text render delay show that initial image priority is no longer the measured LCP boundary. A targeted throttled trace counted 1,831 DOM elements and large layout updates; this matches the first-traversal script/layout outliers in the wide, mobile, and legacy profiles.
- Traversal still fails the long-task and rendering-slice gates. The largest captured failures were a 294-millisecond browser task during Distro wide first traversal, 125- and 114-millisecond tasks during Distro mobile first traversal, and isolated Store mobile-repeat and legacy-first tasks of 57 and 136 milliseconds.
- Store activation passed three of three runs with 104 settled cards, exactly one listing-price projection, zero per-card Store Offer reads, and zero Store 5xx responses. The static-only local listing projection remained the expected classified `404`.
- Browser Use passed direct and shell-managed Store All/Distro at desktop and 390 px. The first active image stayed sharp, neighboring images became ready during traversal, Next/Previous and View all/Show Coverflow worked without blank covers, every canonical card remained present, focus returned to `MAIN`, and no overflow, visible jump, failed image request, console warning, or console error appeared.
- Decision: retain the active-cover-only priority implementation, keep `right-size-store-coverflow-images` active, leave parent performance tasks unchanged, and do not sync or archive the child. Any next amendment must first approve a bounded response to the measured Distro DOM/layout cost; this pass does not add observers, preload management, pagination, virtualization, batching, or dependencies.

Raw output is ignored under `.codex-artifacts/runtime-performance/9f37b7db/`.

## Rejected below-fold Distro containment — 2026-09-05

- Exact experiment commit `6ce07d20` extended native containment to the first chunk of every later Distro group. Store All and Store Distro median mobile LCP passed at 0.800 and 0.928 seconds, CLS remained below 0.011, and three Store activations retained one listing projection, zero per-card Store Offer reads, and zero Store 5xx responses.
- The experiment failed the traversal gate on all three Distro profiles: wide first traversal produced 277–285 millisecond tasks, mobile first traversal produced 278–289 millisecond tasks, and legacy first traversal produced 283–284 millisecond tasks. Matching long animation frames reached 299 milliseconds. The selector deferred the same layout cost into first traversal rather than removing it.
- Decision: restore the previous selector and test contract, skip Browser acceptance for rejected code, keep both performance changes active, and leave production-readiness performance tasks open. Raw output remains ignored under `.codex-artifacts/runtime-performance/6ce07d20/`.

## Distro mode-aware containment remeasurement — 2026-09-10

The child is accepted for closure at 23/23 under the user-approved exceptions below. The retained eager catalog, prepared preview layout, UI card font, bounded card containment, and deferred focus implementation passes full unit/check/build, browser acceptance, cold mobile loads, Store activation, bundle checks, and affected-change strict validation. All 104 Store and 101 Distro cards remain present; commerce authority is unchanged.

The user explicitly accepted the final 51 ms mobile disclosure task, the instrumented 51–77 ms tasks, and inconclusive attribution of occasional wide traversal spans. These are retained exceptions, not numerical passes or a global budget relaxation. The implemented behavior is synchronized to the main spec and this child is archived; broader readiness and production launch are not granted by this decision. See [the child evidence](../archive/2026-09-10-contain-below-fold-distro-chunks/README.md) for final source/build identity, passing checks, and retained rejected traces.

## Store Coverflow image closure — 2026-09-10

`right-size-store-coverflow-images` is accepted at 19/19 with the same containment timing exceptions, explicitly authorized for this child after the remaining gate was explained. The bounded responsive slot and initial-active-cover-only priority remain implemented. The `site-images` requirements are synchronized and the child is archived; earlier failed measurements above remain historical evidence.

Closure matched the current source/build hashes to `contain-closure` reports. Store All mobile LCP median/p75 is 1.072/1.080 seconds and Distro is 1.164/1.188 seconds; maximum CLS is 0.010066/0.000642. Three activations retain 104 cards, one listing projection, zero per-card Store Offer reads, and zero Store 5xx. The 51 ms disclosure task, traced 51–77 ms tasks, and inconclusive wide traversal attribution are accepted exceptions, not numerical passes.

Parent tasks 2.1, 2.2, 2.4, and 2.5 are complete using the original exact-commit measurements plus the fingerprinted containment handoff. The five-run desktop cold report `.codex-artifacts/runtime-performance/1788694926509-desktop-load.json` is historical profile-execution evidence from 2026-09-06, not final-tree acceptance; it lacks the later runner's source/build fingerprints. Parent task 2.3 and all final launch-tree gates remain open. See [image closure evidence](../archive/2026-09-10-right-size-store-coverflow-images/README.md) for provenance and the bounded acceptance decision.

## PRD availability-alert prerequisite — 2026-10-08

Task 4.1's alert guard is locally implemented in the existing delivery schedule. PRD alerts require `PRD_AVAILABILITY_ALERTS_APPROVED=true` plus both existing checkout controls. Keep this optional Worker input absent or false through closed preparation and verify it for approved public selling. A zero alert-drain limit leaves pending consent/retry data and send-day counters unchanged while normal retention cleanup, paid-order recovery and estimate notices continue. Local/UAT behavior and the UAT sink remain unchanged. The existing module exports/dependencies already allow the checkout reader; no boundary, API, schema, scheduler or cohort-access architecture was added. Configuration and operator contracts are in [the environment model](../../../docs/environment-model.md#manual-checkpoints) and [commerce operations](../../../docs/commerce-operations.md#notify-me-availability-alerts).

The scoped command `pnpm test apps/backend/src/paid-order-delivery-schedule.worker.test.ts` reproduced seven unwanted PRD sends before the guard and passes after it. Coverage includes closed launch/runtime controls, missing/false/invalid public-alert approval with beta checkout enabled, explicit public approval, checkout-flag failure, unchanged pending records/counters, expiry cleanup, UAT sink routing, and paid/estimate recovery with checkout closed or flag evaluation failing. These are Local workerd/D1 tests with stubbed Resend HTTP responses; no hosted data or email state was changed. Final combined local validation, strict checks, source SHA, matching before/after fingerprint and logs are recorded in ignored `.codex-artifacts/stripe-migration-delegation/availability-alert-final-20261008.json`.

Selected acceptance: Commerce/checkout/stock for the scheduled Worker behavior and Release/environment for the approval-input contract. Browser, real provider, release and launch acceptance remain unrun. Task 4.1 stays unchecked for remaining deployment/origin/release work; cohort/limit/end enforcement is superseded. Deploy this guard and verify the PRD input remains absent/off before [the migration's freeze/rebinding step](../migrate-stripe-to-blackboxrecords/design.md#migration-plan); local passing evidence does not close migration 4.x, hosted deployment or public-launch acceptance.
