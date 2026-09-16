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

### UAT cross-browser verification

Release commit `01566042827d01f1c4967c5439f6ee2691a9ced9` passed the new Firefox/Chromium gates and deployed through [run 35027445399](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35027445399). Native Chrome verified staff root redirects to Content, the logo targets Content, the Test environment badge appears, and preview starts closed with zero preview responses before opening.

Two bounded preview requests for Ouranopithecus returned 200 and reached Preview up to date, including unchanged-content refresh. CSS returned 200 and the screenshot showed the fully styled public layout with artist/release images and typography. Response and embedded policy both named the UAT staff origin explicitly. Request references were `ffefb1a7-9f0b-458e-bbae-69efbeb5e443` and `f9561ca7-e63d-44fb-90bd-8f2b39f810e9`; both carried the expected release revision. No draft was saved and no content publication was requested.

The user independently refreshed UAT in their Firefox and confirmed: “Yes, preview loads correctly.” Automated local and CI Firefox coverage complements this hosted confirmation. PRD code was prepared through the retained shared artifact; PRD was not promoted.

The workflow's final provider smoke failed only its five retired public `/admin/*` URL checks (expected 404, received 200). Stripe scenarios, Resend checks, public assets, checkout shell, current public routes, and both deployment jobs passed. A bounded read of `/admin/config.yml` confirmed `CF-Cache-Status: HIT`, age 74056 seconds, and `public, s-maxage=604800`; this is the previously tracked public Pages retirement-cache issue. The source/artifact checks and preview gates passed. The one-commit retirement exception was not reused, no broad cache purge was performed, and the failed workflow must not be represented as a green PRD promotion candidate.

## Superseding UAT release verification — 2026-09-16

Release run [35071291241](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35071291241) completed successfully for commit `923251cc4b99d83db1049ccf9475c03581dacdf0`. The UAT Worker, Pages artifact, browser preview gates, release identity checks and UAT smoke passed. This closes task 6.5; PRD remains unpromoted.

## Publication recovery, preview freshness and design reference (2026-09-16)

### Confirmed diagnosis

Publication `352167be-39f9-45ce-aa79-759c0e555006` was requested at 22:04:18 UTC on September 15. UAT's fifteen-minute cron dispatched [run 35030059450](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35030059450) at 22:15:45. It failed at Resolve deployed code under the release lock because the currently deployed code candidate concluded failure. Registration previously followed that step, so the journal had no run ID for reconciliation and the frontend stopped checking after two minutes.

The implementation now kicks the existing dispatcher after acceptance, registers the workflow before dependency installation/code validation, binds code separately using the same authenticated run contract, and adds a run-matched failure callback. Lost callbacks/cancellation use existing reconciliation. A recorded deployment is not marked failed by the callback: its public identity still needs verification. Local never dispatches GitHub. Existing full run claims remain compatible; no migration, new binding or service was introduced.

### Bounded hosted correction

A single public probe at 22:36:39 UTC still returned HTTP 200 / cache HIT for the exact retired `/admin/config.yml`, age 75839. No cache-busting URL, broad purge, exception reuse, or release acceptance bypass was attempted.

One indexed UAT journal read confirmed the exact pending request, revision `01M2KHJKN5XA26SCMEQ9VQTNA0`, request timestamp, empty run/code/deployment fields, and dispatch lease. The completed GitHub run log independently identified this publication and its acceptance failure. A conditional update matching all those facts set only this request to Failed and attached run `35030059450`. RETURNING verified the new values; D1 reported one changed record, three rows read and two index/table rows written, one attempt. The preceding read reported one row read and zero writes. This is a bounded status correction, not a content import/recovery rehearsal: no content, snapshot, commerce, public deployment or private draft changed. It prevents another hourly dispatch of this known failed attempt.

The original requested revision is not yet live. Retry remains blocked until provider cache invalidation/expiry and a successful accepted code candidate. Do not silently publish newer drafts when recovering it. The new code is deliberately not pushed/deployed while the known acceptance blocker persists; PRD is unchanged.

### Preview evidence

The reported stale description did not reproduce in deployed Chrome or initial local Firefox investigation. New production-policy workspace tests cover typed successive newsletter descriptions, Save draft, unchanged refresh, reload, old-generation response rejection, last-successful rendering, and numeric request/display diagnostics. Browser fixtures also cover optional-font fallback versus required-font failure, hidden polling, focus/visibility/manual single-flight, and the thirty-minute polling bound. The top-right Refresh control is visible without opening history at narrow and wide sizes.

Real-template testing exposed an additional Firefox problem: Google Fonts uses the public layout's `display=optional`; Firefox's font-display deadline can mark an optional face errored even when the browser correctly uses its fallback. A transport-isolation diagnostic fetched the same public bytes and still reproduced the font-display timeout, distinguishing it from the first observed external network timeout. The readiness guard now respects optional fallback and continues rejecting failed required fonts. Public font settings and CSP permissions are unchanged.

After the fix, the unmodified-network local CMS smoke passed all 17 shared-template contexts in Chromium and Firefox, plus successive unsaved newsletter descriptions and unchanged refresh in both full editors. Draft and publication-state invariants passed. This used Playwright Firefox 153; the user's Firefox 155 stale existing-tab symptom is not claimed reproduced or conclusively resolved.

### Delivery evidence

Required checks passed after the optional-font fix: `pnpm test:unit`, `pnpm check`, `pnpm build`, and canonical `pnpm --filter @blackbox/backend build:cms` including no-KV guards. Policy tests retain approved CSS/images and deny external assets/scripts/forms. Workspace screenshots cover 390/768/1280/1600 px, narrow tabs, expanded focus restoration and reduced motion. Native Chrome visual review confirmed the direct top-right refresh control; the 390 px screenshot shows it remains accessible without horizontal overflow.

Two verification infrastructure collisions were resolved without source workarounds: a CMS rebuild initially hit a Windows file lock while the local server used its artifact (stopping the server allowed the canonical build to pass), and a workspace run overlapped the root build rewriting staff assets (rerun only after build completion). Do not run a browser against an artifact being rebuilt.

Logs and screenshots remain in ignored `.codex-artifacts/reliability-*` and `.codex-artifacts/content-workspace/`. The living [backoffice design reference](../../../docs/backoffice-design.md) records twelve sources, shared rules and fifteen Proposed improvements. Hosted deployment/republication remain explicitly unfinished under task 6.5.
