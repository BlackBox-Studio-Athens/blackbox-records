# Tasks

## 1. Commerce projection

- [ ] 1.1 Discard the uncommitted Releases parse-time prefetch (`ReleaseCatalogPresentation.tsx`, its test and `pages/releases/index.astro`) and verify `git status` shows no changes outside this change.
- [ ] 1.2 Add a pure projection function in `apps/backend/src/application/commerce` that maps `readStoreListingPrices(..., 'preorders')` output to slug-sorted `{ storeItemSlug, displayPrice, shipEstimate }` items with a SHA-256 identity of the canonical JSON. Verify with a unit test covering ready stocked pre-orders, paused, unavailable and sold-out exclusions, a withheld estimate and a stable identity.
- [ ] 1.3 Add `pushPreorderProjection(bindings)`, which reads the projection and POSTs it to `PUBLIC_SITE` `/__publication/preorders`, logging and swallowing failures. Verify with a unit test that a rejected fetch resolves without throwing and logs a redacted event.
- [ ] 1.4 Call the push through `ctx.waitUntil` after each successful mutation in `register-internal-stock-routes.ts`, after paid finalization in `stripe-webhook-services.ts`, after Stripe catalog price updates, and on every `scheduled` run in `cms-worker.ts`. Verify with worker tests that a pre-order set, a last-copy paid order and a cron run each issue one push, and that a failed push leaves the write's response unchanged.

## 2. Renderer storage, cache identity and invalidation

- [ ] 2.1 Add the private `/__publication/preorders` POST to the renderer default entrypoint. Validate the projection with zod and bounded reads, forward it to `public-v2` and `publication-v2`, and purge `blackbox-publication` only when an object reports a changed identity (Local without an edge cache skips the purge). Verify with renderer worker tests: invalid body gives 400, unchanged gives no purge, changed gives a purge, and a gateway-forwarded request cannot reach the path.
- [ ] 2.2 Persist the projection in `PublicSiteRuntime` SQLite, add it to `publishedContext`, and include its identity in the render cache key, the `retain()` prefix and the ETag input. Verify with tests that a changed projection retires old rows, that an unchanged one writes nothing, and that hibernation reuse still serves cached pages.
- [ ] 2.3 Remove the `/preorder-showcase.json` cache allowance in `public-runtime.ts`. Verify that the existing public-runtime tests pass with the route gone.
- [ ] 2.4 Update `docs/content-publication.md` (renderer projection, cache key, invalidation) and `docs/cloudflare-free-tier.md` (push and DO request estimate). Verify with `pnpm agent:check`.

## 3. Web rendering

- [ ] 3.1 Add `readOpenPreorders()` for web pages. It reads from the renderer context, and otherwise from the JSON file named by `BLACKBOX_PREORDER_PROJECTION` (default empty). Wire the e2e Astro server and the CI static fixture build to a fixture projection that matches the existing e2e Store Items. Verify with a unit test for both sources and an empty default.
- [ ] 3.2 Home: build showcase items in `pages/index.astro` from the snapshot and the projection (moving the image preparation out of `preorder-showcase.json.ts`). Render `StorePreorderShowcase` only when items exist, with items as props and `client:idle`. Remove `loadStorePreorderShowcase`, its retry and the JSON route. Verify with component tests that SSR markup contains the chapters with price and estimate, and that no browser listing or candidate fetch occurs.
- [ ] 3.3 Releases and release pages: render `ReleaseCard.astro` and `ReleaseDetailContent.astro` from `releasePresentation(entry, projectedRecord)` and write the rendered state to a data attribute. Change `connectReleaseCatalogPresentation` and `ReleaseStoreLink` to keep the rendered state until a successful live read, and keep it on failure. Verify with `ReleaseCatalogPresentation.test.ts` and `ReleaseStoreLink.test.tsx` cases for projected pre-order SSR, live correction and failed read.
- [ ] 3.4 Change `sanitizeReleaseCatalogPresentation` (used by `shell-page-snapshot.ts`) to restore the rendered state instead of neutral. Verify with `shell-page-snapshot.test.ts`.
- [ ] 3.5 Update `e2e/home-preorders.spec.ts` and `e2e/release-merchandising.spec.ts`: assert that pre-order content is present in the HTML response and at first paint (direct and shell entry), that no late section insertion occurs, and that live correction works. Verify with `pnpm test:e2e e2e/home-preorders.spec.ts` and `pnpm test:e2e e2e/release-merchandising.spec.ts`.
- [ ] 3.6 Update module boundaries if new entrypoints or dependencies appear (`project.json` `metadata.boundaries` and the manifest). Verify with `pnpm check:boundaries`.

## 4. Integration and acceptance

- [ ] 4.1 Run `pnpm validate` on the final tree and `pnpm openspec -- validate render-preorders-in-html --type change --strict`. Record the summary path and fingerprint in `validation.md` in this change.
- [ ] 4.2 On the Local stack, open and end a pre-order in Staff. Confirm that Home and Releases HTML (with `curl`) change within seconds and that the browser shows no late insertion. Record the request IDs in `validation.md`.
- [ ] 4.3 After UAT deploy, wait for or trigger the first cron push. Confirm that `curl` of UAT Home and Releases contains the pre-order markup and that a cold browser load paints it with no late insertion. Record the evidence in `validation.md`.

## Workflow follow-up

- Promote to PRD through the normal gate and repeat 4.3 against PRD.
- Archive the change after acceptance.
