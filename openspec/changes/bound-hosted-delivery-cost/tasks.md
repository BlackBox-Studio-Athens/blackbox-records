## 1. Preconditions

- [x] 1.1 Record the baseline identity `e818b709a2364aa29dfd54cadcd0433779a1f263` and the integration base of each slice; confirm no hosted UAT or PRD request, deployment or provider call is made while implementing.
- [x] 1.2 Read `docs/cloudflare-free-tier.md` and the `cloudflare-free-tier-cache-policy` baseline before each slice, and record the Free-plan availability of every Cloudflare feature used, with its documentation source.
- [x] 1.3 Record the state of `complete-image-delivery`, whose unarchived requirements overlap groups 3-5.

## 2. Published Purchase Information On Hosted Pages

- [x] 2.1 PAGES-07: Point the hosted purchase-information override at the current owner module and inline the purchase-information JSON only in builds whose browser reader needs it.
- [x] 2.2 Add a regression test that every module the hosted config overrides exists and exports the same names, and verify a local hosted build reads the snapshot's purchase information.

## 3. Media Addressed By Media SHA

- [x] 3.1 HOST-10: Transform from the configured canonical `PUBLIC_IMAGE_SOURCE_ORIGIN` instead of the exact `pages.dev` request host, and add an opt-in `image_transform` UAT static smoke scenario without running it.
- [ ] 3.2 HOST-02: Render media URLs by media SHA only, and serve a short-lived original fallback instead of an immutable one when a transformation fails.
- [x] 3.3 HOST-N1: Accept media and `/_image` only for the live and three most recent accepted snapshots and only for emitted widths.
- [x] 3.4 HOST-06: Remove the per-request manifest re-parse for non-current snapshots.
- [x] 3.5 Prove with worker tests stable URLs across a text-only publication, 404 `no-store` for draft, unknown and retired media and non-emitted widths, canonical source derivation and legacy URL handling; update the Free-tier and publication docs.

## 4. Images And Assets Off The Pages Function

- [x] 4.1 HOST-01: Emit direct Images transform URLs from a hosted image service, preconnect to the images host, and add a Worker-requests-per-page-view budget to the Free-tier rule with the UAT pilot that checks it.
- [x] 4.2 HOST-13: Emit plain `/_astro` URLs for ESM images, exclude `/favicon*` from the Function, and return asset responses byte-for-byte.
- [x] 4.3 HOST-14: Answer non-site paths with a static `no-store` 404 in the gateway from a release-built route allowlist, without calling the renderer.
- [x] 4.4 Prove with tests the image service URLs (widths, formats, quality, `srcset`), the gateway allowlist, 404s and `Accept`-only forwarding, and `_routes.json`; record the local per-page-view request count before and after.

## 5. Hosted HTML Through Hibernation

- [x] 5.1 HOST-05: Persist rendered pages in Durable Object storage keyed by release, snapshot and path with byte-accounted LRU, and add publication-tagged edge reuse with purge on activation only if the Free plan provides it.
- [x] 5.2 HOST-07: Single-flight the snapshot pointer refresh and serve the current snapshot while refreshing.
- [x] 5.3 HOST-09: Add a weak ETag per release, snapshot and path, and forward `If-None-Match` from the gateway.
- [x] 5.4 HOST-08: Stream renders and tee them into the cache inside `waitUntil` if it stays simple; otherwise record why buffering remains.
- [x] 5.5 HOST-04: Recreate the public object under a new name with a European location hint and move `/__publication/*` to a separate instance, after confirming the object holds caches only.
- [x] 5.6 Prove with worker tests that the page cache survives a simulated object restart, eviction is LRU by bytes, the ETag and 304 path works and refresh is single-flight; confirm no `cloudflare-free-tier-cache-policy` requirement is violated.

## 6. Hosted Performance Gates

- [x] 6.1 HOST-12: Scope `strictExecutionOrder` to the hosted SSR build and run the bundle-graph and image-markup checks against `dist-public`.
- [x] 6.2 Document the Pages fail-open and fail-closed options for the static fallback with their cost and risk, for the owner decision recorded as out of scope; change nothing.
- [x] 6.3 Prove hosted client bundles carry no `strictExecutionOrder` wrappers and the checks run against `dist-public`.

## 7. Spec Reconciliation

- [ ] 7.1 When `complete-image-delivery` is archived, convert this change's media and transform requirements into modifications of its "Public CMS images use bounded transformations with original fallback" requirement, then strict-validate.
- [x] 7.2 Reconcile the Worker-request budget delta with slice B2's measured figure and the Free-tier rule text.
- [x] 7.3 Reconcile the hosted HTML delta with slice B3's result (tag purge available or not, location hint applied or not) and with `complete-image-delivery`'s document revalidation wording.

## 8. Hosted Verification And Closure

- [x] 8.1 Run `pnpm validate` on the final tree and `pnpm openspec -- validate bound-hosted-delivery-cost --type change --strict`; record both in `validation.md`.
- [ ] 8.2 After an owner-authorized release, follow the Free-tier rule on UAT: record account-wide usage, then run a bounded pilot measuring Worker requests per page view, transformations, `/_image` sizes and formats, HTML cache status and `Age`, 304 revalidation, the static 404 path and hosted purchase information; repeat on PRD after UAT succeeds.
- [ ] 8.3 Run the `image_transform` smoke scenario on the apex at cutover.
- [ ] 8.4 Write the hosted implementation report, append `PERF-006` to `../archive/2026-08-31-site-performance-program/performance-report-log.md` without rewriting earlier entries, and archive.

## Final local evidence and open gates

PERF-006 and validation.md record the actual local SSR capture, published purchase-information fixture, unchanged output budgets and source-bound passing repository tests. Task3.2 remains partial: media-SHA addressing/compatibility fallback and native browser recovery work, but cross-zone direct images lack script-disabled/crawler quota fallback. Task5.1 source integration is complete: persistent byte LRU and default-entrypoint activation invalidation are tested. Native purge propagation remains unverified because the installed emulator lacks its API; keep 30+30s HTML reuse until the authorized hosted pilot.

Task7.3 is reconciled with Free-available purge, best-effort eeur placement and unchanged document revalidation; 7.1 waits on complete-image-delivery. Tasks8.2–8.3 require owner-authorized release/account preflight/pilot/apex smoke. The implementation report and PERF-006 ledger entry for8.4 are written; archival remains pending. No task was waived by a synthetic local publication or Sharp byte model.
