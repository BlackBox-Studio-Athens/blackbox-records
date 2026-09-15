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

# Reliability and performance follow-up — 2026-09-15

The reported UAT first-opening failure did not recur naturally during two bounded inspections. The affected record returned valid CSS and all four images. A captured cold opening took 6,009 ms for preview HTML; ordinary content reads took 193–481 ms. This does not establish the original asset transport failure's cause.

Controlled Local reproduction blocked image delivery on first opening. Restoring delivery and refreshing unchanged content made the old implementation report success with two images still broken. A failing CSS response also produced an empty `CSSStyleSheet` in Chromium: `link.sheet` alone was not a valid readiness check. The new browser regression covers these real failure paths, requires assets to load before replacing the previous frame, and checks identical-HTML retry, stale updates, invalid content, authentication expiry, and preserved drafts. The full `node scripts/test-content-workspace.mjs` suite passed, including mobile/media/publication flows and newly added stock loading races.

The preview concurrency regression failed on the old reader (peak one active read) and passes on the new reader (peak four, stable order). A three-run controlled fixture with 12 published revisions and 40 ms per CMS read measured median 655 ms before and 234 ms after, with 14 reads in each run. This isolates application sequencing from transport variability; it is not a hosted CPU/quota measurement.

The real Local 17-context smoke passed before and after, with no draft or publication changes. End-to-end localhost timings vary: artist detail 382/407 ms and distro detail 1,597/1,506 ms before/after. Warm artist listing improved 86/68 ms; distro listing stayed about 1.7 seconds. Read counts did not increase; artist contexts dropped from 38 to 37 through request-local deduplication. These single samples do not establish a general end-to-end speedup.

Native Chrome Performance metrics through hydration on Local list/creation surfaces:

| Flow         | Script time | Layout + style time |
| ------------ | ----------: | ------------------: |
| Content list |       79 ms |               20 ms |
| Images       |       60 ms |               30 ms |
| Items        |       27 ms |               37 ms |
| Create item  |       40 ms |               14 ms |
| Stock        |       18 ms |               13 ms |
| Orders       |       19 ms |               14 ms |

These snapshots identify no comparable multi-second browser execution bottleneck on those surfaces. Content/Orders already overlap their startup reads; existing rich-text code splitting remains. No speculative new cache, dependency, prefetching or authentication bypass was added.

Final release-source checks passed: `pnpm test:unit`, `pnpm check`, `pnpm build`, canonical `pnpm --filter @blackbox/backend build:cms` (source/generated no-KV guards), `pnpm audit:unused`, strict OpenSpec validation, and `git diff --check`. The browser regression passed on the final frontend build. Existing unused-code advisory output remains unchanged. UAT release run 35018552284 deploys code commit `5c8755d8be7e6dd80e05ef77610597a004f6f87d`; hosted results are recorded below after completion.

The final selected-entry optimization reduced the Local distro detail fixture from 237 reads to 23 (1,597 ms baseline; 54 ms final sample). Release detail fell from 41 to 31 reads and news detail from 28 to 23. Listings still read full collections; their cache warming now happens when a listing is requested, rather than during a detail preview. The final 17-context smoke and full browser regression both passed. Final native Chrome inspection of the real Ouranopithecus preview confirmed all four images and stylesheet/font readiness.

## UAT deployment verification

The candidate, artifact inspection, UAT Worker deployment, and UAT static deployment jobs succeeded in [run 35018552284](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35018552284). Native Chrome verification used two preview requests for the affected Ouranopithecus record, without saving or publishing content. First opening returned preview HTML in 2,148 ms with 37 logical reads and 16 cache misses; the stylesheet returned 200, both stylesheets were attached, fonts were loaded, and all four images decoded. The screenshot showed the styled public artist layout.

Refreshing unchanged content returned HTML in 3,999 ms, navigated a new `about:srcdoc` frame, fetched preview CSS successfully, and reached “Preview up to date” with all images and fonts loaded. This confirms deployed iframe replacement rather than reusing a failed identical document. Hosted timing variability remains substantial; the controlled Local benchmark isolates the sequencing improvement. No original intermittent transport failure recurred during this bounded pilot.

The full release workflow completed successfully, including UAT provider smoke. Earlier runs' retired `/admin/*` route failures did not recur. PRD was not promoted.

## Firefox policy and workspace refinement (2026-09-16)

The old production meta policy was reproduced in sandboxed srcdoc frames: Chromium loaded the CSS; Firefox left the same frame unstyled. The shared explicit-origin policy now passes in both browsers while external styles/images, scripts, and form submission remain blocked. Local real-template verification passed all 17 preview contexts in both browsers, including image decoding, stylesheet rules, fonts, and unchanged draft/publication state.

Workspace regression coverage includes default-closed preview, zero hidden preview requests, persistence with unavailable-storage fallback, unsaved editing/reopening, scroll restoration, replacement failures and recovery, stale responses, authentication evidence, diagnostic transport failure isolation, mobile tabs, expanded focus restoration, and staff root/logo routing. Responsive screenshots cover 390, 768, 1280, and 1600 px. Diagnostics unit checks cover authorization, origin/marker validation, bounded payloads, redaction, correlation, throttling, and bounded identity state.

The diagnostic endpoint stores no reports. Existing Cloudflare structured logs receive request/release correlation and sanitized stages; draft content, cookies, HTML, and private media paths are excluded. CSP directives are included only when observed. The separate auth/me 404 is unchanged.

Final source checks passed: pnpm test:unit, pnpm check, pnpm build, canonical CMS build with no-KV guards, unused-code audit (existing advisory findings), strict OpenSpec validation, and git diff --check. Final built workspace regressions passed in Firefox and Chromium; the final Local 17-context real-template smoke also passed in both browsers. One browser run overlapped a staff rebuild and timed out; the rerun against the completed artifact passed.
