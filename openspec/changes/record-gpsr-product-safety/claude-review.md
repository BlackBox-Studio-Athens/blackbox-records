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
