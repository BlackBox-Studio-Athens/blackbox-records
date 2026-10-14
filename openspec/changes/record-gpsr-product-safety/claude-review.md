# Claude implementation review, 14 October 2026

Reviewed source: `f4b6c5b523a024e637cd61f77b25476e4cdb547e`, changes since `c68ea0cac13b30d7ccc545320650ef79ab5df765`. Scope: public disclosure, checkout projection, staff fields and connected runtime/publication readers. The approved collapsed presentation is retained; this review does not reopen that owner design decision or certify its legal sufficiency.

## R1 — P1: checkout keeps the first publication's safety data

`apps/web/src/components/store/store-page-data.ts:98-111` retains a single module-level promise. The comment assumes a static build, but `apps/backend/astro.public.config.mjs` aliases the content reader to the request-scoped `published-reader.ts`. `PublicSiteRuntime.render` selects a snapshot per render and invalidates page caches when publication changes; it cannot reset this module variable.

Concrete case: the first checkout reads an item with no verified data. Staff later verify and publish its manufacturer details. The next checkout still receives the original empty map for the lifetime of that runtime. Updating or withdrawing an existing verified record likewise leaves old checkout disclosures in place, even while the item page reads fresh data. This is separate from normal 30-second edge staleness.

Smallest fix: remove the module-global promise and read through the existing publication-aware reader on each render. If a cache is retained, it must have the same snapshot identity and isolation as that reader. Add a regression for absent -> verified -> changed/removed data across successive publication contexts, without reloading the module. Do not change commerce gates.

Reproduction: `node .codex-artifacts/compliance-review-20261014/reproduce-safety-cache.mjs`. It transpiles the actual helper and supplies controlled collection dependencies. Observed first map `{}`, second map `{}` after data changes, and only one source read. This is a local module reproduction, not a hosted publication test.

## R4 — P2: valid HTTPS contacts containing @ become email links

`apps/web/src/platform/components/ProductSafetyDisclosure.tsx:23-30` treats every electronic address containing `@` as email. The schema accepts `https://manufacturer.example/contact?email=safety@example.com`; the component renders `mailto:https://manufacturer.example/contact?email=safety@example.com`. The shopper opens an email application instead of the manufacturer's contact page.

Smallest fix: recognize an HTTPS URL first and preserve it; use `mailto:` for the validated email alternative. Cover both manufacturer and responsible-person contacts with an HTTPS address containing `@` and a normal email.

Reproduction: `node --import tsx .codex-artifacts/compliance-review-20261014/reproduce-contact-link.mjs`. Uses the real schema/projection and transpiled component with synthetic data; the wrong href is asserted. No content was saved or published.

## Checks and remaining acceptance

- `pnpm validate`: PASS, 64 affected tasks / 50 projects, 62 cache hits. Actual summary `.codex-artifacts/validation/2026-10-14T13-03-15-088Z-53556-1d2da5/summary.json`, mode `local`; before/after SHA `f4b6c5b523a024e637cd61f77b25476e4cdb547e`, matching clean fingerprint `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, zero changed files.
- Existing tests pass but have no multi-publication helper scenario or HTTPS-with-@ contact case. Staff unit checks are included in the passing affected validation; no new staff browser acceptance is claimed.
- `pnpm test:e2e e2e/international-order-checkout.spec.ts -g "legal guarantee"`: 2 passed, desktop and phone.
- Initial attempted multi-file `pnpm test` invocation was unsupported and selected no tests. It is not a product failure or passing evidence; the correct affected validation above supersedes it.
- No UI source, supplier facts, providers or hosted content changed during review. Official assets, 200% text/zoom, no-JS/image-failure behavior, staff browser interaction and Local publication acceptance still require the checks already assigned in the owning changes.

Verdict: fix R1 and R4, then review the new evidence. Unknown supplier facts and incomplete-offer treatment remain owner work.

## Fixes, 14 October 2026

Commit `17547f01` fixes R1 and R4; final validation ran on `c8251ce2594db5e1cbe6fd4748cfa9a5b3d46217`.

- **R1:** `listStoreProductSafety` no longer keeps a module-level promise. It reads `listStoreItems` and the publication-aware `getEntry` on every render, so each checkout uses the snapshot its render selected. Regression `store-page-data.test.ts` "follows each publication without reloading the module" goes from absent to verified to changed to removed in one module instance. No sale rule or checkout gate changed.
- **R4:** `ContactValue` treats an address starting with `https://` as a contact page and keeps it, with a new tab and `noopener noreferrer`. Everything else, which the schema limits to a valid email, becomes `mailto:`. `statutory-disclosures.test.tsx` covers a normal email, a normal HTTPS page, and HTTPS with `@` in the path and in the query, for both the manufacturer and the EU responsible person. Markup and visible text are unchanged.
- **Reproductions:** `reproduce-safety-cache.mjs` and `reproduce-contact-link.mjs` now fail their assertions of the old behaviour (two source reads; the HTTPS href is no longer `mailto:`). Output is in `.codex-artifacts/compliance-review-20261014/fixes/reproductions-after-fix.log`.
- **Checks:**
  - Scoped `pnpm test` passed for both files.
  - `pnpm test:e2e e2e/international-order-checkout.spec.ts`: 13 passed (`.codex-artifacts/compliance-review-20261014/fixes/e2e-checkout.json`).
  - `pnpm validate` passed, `mode: local`, scope `all`; before and after SHA `c8251ce2`, matching clean fingerprint `e3b0c442…b855`, zero changed files. Summary: `.codex-artifacts/validation/2026-10-14T13-42-03-675Z-78088-cc335b/summary.json`.
- **Still unverified:** a published snapshot with verified data in a real Local publication or hosted runtime; product safety in a browser (no edition has verified data yet). Tasks 2.1, 2.3 and 2.4 stay open.

## Codex re-review acceptance, 14 October 2026

R1 and R4 are accepted at `a4cd20f7d11320cea5ac98fa804cbd26b6ca0203`. The reviewer read the complete fix diff, the publication-aware reader and callers, and the regression cases. The helper now reads each render's source; no persistent promise survives a snapshot change. Contact rendering preserves the schema's HTTPS alternative even with `@`, for both contact roles. No visible design, copy, sale gate or supplier fact changed.

Independently inspected `.codex-artifacts/validation/2026-10-14T13-47-31-943Z-30452-f451a5/summary.json`: status `passed`, mode `local`, identical before/after SHA `a4cd20f7d11320cea5ac98fa804cbd26b6ca0203`, fingerprint `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, zero files/source changes. The retained checkout browser summary reports 13 expected passes and zero unexpected/flaky results. Passing unchanged source evidence is reused; the review does not claim a new real publication or supplier-data browser check. The remaining acceptance listed above stays open.
