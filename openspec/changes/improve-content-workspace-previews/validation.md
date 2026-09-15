# Local validation

## Rendering and isolation

The real combined Local CMS Worker rendered 17 contexts across all 13 collections: detail and listing for artists, releases, news and distro, and page/settings contexts for the remaining sections. The smoke submits unsaved edits and verifies stored records and publication history are unchanged. HTML has no scripts, embedded frames or actionable links; private cache/CSP headers and cross-origin/custom-header rejection are asserted.

Request-scoped reader tests cover concurrent draft isolation, published-only surrounding data, forged identities, invalid fields/links, mismatched revisions, missing images, unpublished artist references and streamed size limits. Publication component tests distinguish pending, unresolved failure, later confirmed live and unavailable history.

Native browser review confirmed public fonts and private images, mobile Edit/Preview preservation, unsaved title rendering, an invalid URL retaining an outdated preview, simulated authentication expiry retaining edits, expansion/focus return and the compact history surface. Viewports: 390, 768, 1280 and 1600 px. The preview uses the actual shared public components; it is not a screenshot approximation.

Final keyboard regression: type a collection query, Tab to Search, press Enter, then return to the input and select the matching record with Arrow Down/Enter. Search no longer accidentally selects an old result. Scrolling down the preview and editing the title retained the preview's position. Temporary real-CMS edits were discarded; save/publication interaction checks used isolated in-memory fixtures. Reduced motion produced zero-duration transitions; actions used pointer cursors and fields text cursors. Input borders were raised above 3:1 contrast and the blue primary action darkened for readable white text.

Passed: `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm --filter @blackbox/backend build:cms` (including source/generated no-KV guards), the real Local preview smoke, strict OpenSpec validation and `git diff --check`. The existing browser fixture harness was updated; interactive verification in this session used the native Codex browser tools.

## Resource observations

The Local smoke measured 21–256 logical CMS reads per rendering. After the first context loaded, most previews had 1–3 cache misses. The first distro detail had 216 misses; subsequent distro listing had 3. HTML was approximately 20–222 kB. Typical warm page render wall time was 37–92 ms; the larger distro contexts took approximately 1.6–1.7 seconds. These are local wall times and API-read counts, not hosted CPU or quota measurements.

Budgets: 256 KiB input, 4 MiB rendered HTML, 512 logical reads, 2 MiB per CMS response, 30-second surrounding-read cache bounded to 512 responses/8 MiB serialized text. Private drafts supplied by the browser are never cached. No new bindings, KV, hosted writes or deployed preview records.

## Delivery scope

No hosted deployment or hosted verification was performed. UAT/PRD require the ordinary reviewed release workflow and Free-tier preflight. CMS code and live public code may differ; the preview states this limitation. Media uses protected originals with the same public dimensions and crop rules rather than public optimized image variants.
